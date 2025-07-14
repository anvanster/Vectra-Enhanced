import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 } from 'uuid';
import { ItemSelector } from './ItemSelector';
import { IndexItem, IndexStats, MetadataFilter, MetadataTypes, QueryResult } from './types';
import { LocalDocument } from './LocalDocument';
import { LocalDocumentIndex } from './LocalDocumentIndex';
import bm25 from 'wink-bm25-text-search';
import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';
import { DistanceMetric } from './types';
import { lockManager, Lock } from './LockManager';
import { AtomicOperations } from './AtomicOperations';
import { OperationQueue } from './OperationQueue';
import { Validator, VectorValidationOptions, MetadataSchema, ValidationError } from './Validator';
import { CleanupManager, CleanupStats } from './CleanupManager';
import { LazyIndex, LazyIndexOptions } from './LazyIndex';
import { WAL, WALEntry, WALOptions, walManager } from './WAL';
import { OperationsLog, OperationLogOptions, operationsLogManager, CompactionResult } from './OperationsLog';
import { HNSWManager, HNSWOptions, hnswIndexManager } from './HNSWManager';
import { DataIntegrity, IntegrityCheckResult, DataIntegrityOptions, dataIntegrity } from './DataIntegrity';
import { ErrorHandler, errorHandler, ErrorContext, VectraError, ErrorSeverity, ErrorCategory } from './ErrorHandler';

export interface CreateIndexConfig {
    version: number;
    deleteIfExists?: boolean;
    metadata_config?: {
        indexed?: string[];
        schema?: MetadataSchema;
    };
    distanceMetric?: DistanceMetric;
    vectorOptions?: VectorValidationOptions;
    lazy?: boolean;
    lazyOptions?: LazyIndexOptions;
    wal?: boolean;
    walOptions?: WALOptions;
    operationLogOptions?: OperationLogOptions;
    hnswOptions?: HNSWOptions;
}

/**
 * Local vector index instance.
 * @remarks
 * This class is used to create, update, and query a local vector index.
 * Each index is a folder on disk containing an index.json file and an optional set of metadata files.
 */
export class LocalIndex<TMetadata extends Record<string,MetadataTypes> = Record<string,MetadataTypes>>{
    private readonly _folderPath: string;
    private readonly _indexName: string;
    private readonly _operationsLogName: string = 'operations.log';
    private _hnswManager?: HNSWManager;
    private _data?: InMemoryIndexData;
    private _update?: InMemoryIndexData;
    private _bm25Engine: any;
    private _activeLock?: Lock;
    private _operationQueue: OperationQueue;
    private _vectorOptions?: VectorValidationOptions;
    private _metadataSchema?: MetadataSchema;
    private _lazyIndex?: LazyIndex<TMetadata>;
    private _isLazy: boolean = false;
    private _wal?: WAL;
    private _walEnabled: boolean = false;
    private _operationsLog?: OperationsLog;
    private _hnswOptions?: HNSWOptions;

    /**
     * Creates a new instance of LocalIndex.
     * @param folderPath Path to the index folder.
     * @param indexName Optional name of the index file. Defaults to index.json.
     */
    public constructor(folderPath: string, indexName?: string) {
        this._folderPath = folderPath;
        this._indexName = indexName || "index.json";
        
        // Initialize operation queue with handlers
        this._operationQueue = new OperationQueue({
            maxConcurrency: 1, // Serialize write operations
            maxRetries: 5,
            retryDelay: 100,
            priorityQueue: true
        });
        
        this.setupQueueHandlers();
    }

    private setupQueueHandlers(): void {
        // Handle insert operations
        this._operationQueue.setHandler('insert', async (data: { item: Partial<IndexItem<TMetadata>>, unique: boolean }) => {
            return await this.performInsert(data.item, data.unique);
        });

        // Handle delete operations
        this._operationQueue.setHandler('delete', async (data: { id: string }) => {
            return await this.performDelete(data.id);
        });

        // Handle custom operations
        this._operationQueue.setHandler('custom', async (data: { fn: () => Promise<any> }) => {
            return await data.fn();
        });
    }

    /**
     * Path to the index folder.
     */
    public get folderPath(): string {
        return this._folderPath;
    }

    /**
     * Optional name of the index file. 
     */
    public get indexName(): string {
        return this._indexName;
    }

    /**
     * Begins an update to the index.
     * @remarks
     * This method loads the index into memory and prepares it for updates.
     */
    public async beginUpdate(): Promise<void> {
        if (this._update) {
            throw new Error('Update already in progress');
        }

        // Acquire write lock
        this._activeLock = await lockManager.acquireWriteLock(this._folderPath);

        try {
            await this.loadIndexData();
            this._update = {
                version: this._data!.version,
                distanceMetric: this._data!.distanceMetric,
                metadata_config: this._data!.metadata_config,
                vectorOptions: this._data!.vectorOptions,
                items: new Map(this._data!.items),
                wal: this._data!.wal
            };
            
            // Ensure HNSW manager is initialized (always initialize for vector search)
            if (!this._hnswManager) {
                this._hnswManager = await hnswIndexManager.getIndex(this._folderPath, this._data!.distanceMetric);
            }
        } catch (err) {
            // Release lock on error
            if (this._activeLock) {
                await this._activeLock.release();
                this._activeLock = undefined;
            }
            throw err;
        }
    }

    /**
     * Cancels an update to the index.
     * @remarks
     * This method discards any changes made to the index since the update began.
     */
    public async cancelUpdate(): Promise<void> {
        this._update = undefined;
        if (this._activeLock) {
            await this._activeLock.release();
            this._activeLock = undefined;
        }
    }

    /**
     * Creates a new index.
     * @remarks
     * This method creates a new folder on disk containing an index.json file.
     * @param config Index configuration.
     */
    public async createIndex(config: CreateIndexConfig = {version: 1, distanceMetric: 'cosine'}): Promise<void> {
        // Delete if exists
        if (await this.isIndexCreated()) {
            if (config.deleteIfExists) {
                await this.deleteIndex();
            } else {
                throw new Error('Index already exists');
            }
        }

        // Create folder for index first
        await fs.mkdir(this._folderPath, { recursive: true });
        
        // Acquire lock for index creation
        const lock = await lockManager.acquireWriteLock(this._folderPath);

        try {
            // Store validation options
            this._vectorOptions = config.vectorOptions;
            this._metadataSchema = config.metadata_config?.schema;
            this._isLazy = config.lazy || false;
            this._walEnabled = config.wal || false;
            this._hnswOptions = config.hnswOptions || {}; // Default to empty options for HNSW
            
            if (this._isLazy) {
                // Create lazy index structure
                await fs.mkdir(path.join(this._folderPath, 'chunks'), { recursive: true });
                const manifest = {
                    version: config.version,
                    totalItems: 0,
                    chunks: [],
                    vectorDimensions: undefined,
                    lastModified: new Date().toISOString()
                };
                await AtomicOperations.writeFile(
                    path.join(this._folderPath, 'manifest.json'), 
                    JSON.stringify(manifest, null, 2)
                );
                
                // Also create a minimal index.json for compatibility
                const indexData: IndexData = {
                    version: config.version,
                    distanceMetric: config.distanceMetric ?? 'cosine',
                    metadata_config: config.metadata_config ?? {},
                    vectorOptions: config.vectorOptions,
                    items: [],
                    lazy: true
                };
                await AtomicOperations.writeFile(path.join(this._folderPath, this._indexName), JSON.stringify(indexData));
                
                this._lazyIndex = new LazyIndex<TMetadata>(this._folderPath, config.lazyOptions);
            } else {
                // Initialize normal index.json file
                const indexData: IndexData = {
                    version: config.version,
                    distanceMetric: config.distanceMetric ?? 'cosine',
                    metadata_config: config.metadata_config ?? {},
                    vectorOptions: config.vectorOptions,
                    items: [],
                    wal: this._walEnabled
                };
                await AtomicOperations.writeFile(path.join(this._folderPath, this._indexName), JSON.stringify(indexData));
                this._data = {
                    ...indexData,
                    items: new Map(),
                    wal: this._walEnabled
                };
            }
            
            // Initialize WAL if enabled
            if (this._walEnabled) {
                this._wal = await walManager.getWAL(this._folderPath, config.walOptions);
            }
            
            // Initialize operations log
            this._operationsLog = await operationsLogManager.getLog(
                this._folderPath,
                this._operationsLogName,
                config.operationLogOptions
            );
        } catch (err: unknown) {
            await this.deleteIndex();
            throw new Error('Error creating index: ' + (err as any).message);
        } finally {
            await lock.release();
        }
    }

    /**
     * Deletes the index.
     * @remarks
     * This method deletes the index folder from disk.
     */
    public deleteIndex(): Promise<void> {
        this._data = undefined;
        return fs.rm(this._folderPath, {
            recursive: true,
            maxRetries: 3
        });
    }

    /**
     * Deletes an item from the index.
     * @param id ID of item to delete.
     */
    public async deleteItem(id: string): Promise<void> {
        // Queue the operation for processing
        return await this._operationQueue.enqueue('delete', { id }, 1);
    }

    /**
     * Internal method to perform the actual delete
     */
    private async performDelete(id: string): Promise<void> {
        const updateInProgress = !!this._update;
        if (!updateInProgress) {
            await this.beginUpdate();
        }
        try {
            // Get item to check for metadata file
            const item = this._update!.items.get(id);
            if (item && item.metadataFile) {
                // Delete associated metadata file
                await CleanupManager.deleteMetadataFile(this._folderPath, item.metadataFile);
            }
            
            // Write to WAL if enabled
            if (this._wal) {
                await this._wal.writeEntry({
                    id: id,
                    timestamp: Date.now(),
                    operation: 'delete',
                    data: { id }
                });
            }
            
            // Log to operations log
            if (this._operationsLog) {
                await this._operationsLog.append({ 
                    operation: 'delete', 
                    id,
                    timestamp: Date.now()
                });
            }
            this._update!.items.delete(id);
            
            // Remove from HNSW index if available
            if (this._hnswManager) {
                try {
                    this._hnswManager.removeVector(id);
                } catch (err) {
                    console.warn('Failed to remove from HNSW index:', err);
                }
            }
            
            if (!updateInProgress) {
                await this.endUpdate();
            }
        } catch (err) {
            if (!updateInProgress) {
                await this.cancelUpdate();
            }
            throw err;
        }
    }

    /**
     * Ends an update to the index.
     * @remarks
     * This method saves the index to disk.
     */
    public async endUpdate(): Promise<void> {
        if (!this._update) {
            throw new Error('No update in progress');
        }

        try {
            // Save index
            const indexData: IndexData = {
                version: this._update.version,
                distanceMetric: this._update.distanceMetric,
                metadata_config: this._update.metadata_config,
                vectorOptions: this._update.vectorOptions,
                items: Array.from(this._update.items.values()),
                wal: this._walEnabled
            };
            await AtomicOperations.writeFile(path.join(this._folderPath, this._indexName), JSON.stringify(indexData));
            this._data = this._update;
            this._update = undefined;
            
            // Checkpoint WAL if enabled
            if (this._wal) {
                await this._wal.checkpoint();
            }
            
            // Save HNSW index if dirty
            if (this._hnswManager && this._hnswManager.needsSave()) {
                await this._hnswManager.save({ checksumEnabled: true, incrementalSave: true });
            }
        } catch(err: unknown) {
            throw new Error(`Error saving index: ${(err as any).toString()}`);
        } finally {
            // Always release lock
            if (this._activeLock) {
                await this._activeLock.release();
                this._activeLock = undefined;
            }
        }
    }

    /**
     * Loads an index from disk and returns its stats.
     * @returns Index stats.
     */
    public async getIndexStats(): Promise<IndexStats> {
        await this.loadIndexData();
        return {
            version: this._data!.version,
            metadata_config: this._data!.metadata_config,
            items: this._data!.items.size
        };
    }

    /**
     * Returns an item from the index given its ID.
     * @param id ID of the item to retrieve.
     * @returns Item or undefined if not found.
     */
    public async getItem<TItemMetadata extends TMetadata = TMetadata>(id: string): Promise<IndexItem<TItemMetadata> | undefined> {
        const lock = await lockManager.acquireReadLock(this._folderPath);
        try {
            await this.loadIndexData();
            
            if (this._isLazy && this._lazyIndex) {
                return await this._lazyIndex.getItem(id) as any;
            }
            
            const item = this._data!.items.get(id);
            if (!item) {
                return undefined;
            }
            
            // Load external metadata if needed
            if (item.metadataFile) {
                const metadataPath = path.join(this._folderPath, item.metadataFile);
                const metadata = await fs.readFile(metadataPath);
                return {
                    ...item,
                    metadata: JSON.parse(metadata.toString())
                } as any;
            }
            
            return item as any;
        } finally {
            await lock.release();
        }
    }

    /**
     * Adds an item to the index.
     * @remarks
     * A new update is started if one is not already in progress. If an item with the same ID
     * already exists, an error will be thrown.
     * @param item Item to insert.
     * @returns Inserted item.
     */
    public async insertItem<TItemMetadata extends TMetadata = TMetadata>(item: Partial<IndexItem<TItemMetadata>>): Promise<IndexItem<TItemMetadata>> {
        // Queue the operation for processing
        return await this._operationQueue.enqueue('insert', { item, unique: true }, 1);
    }

    /**
     * Internal method to perform the actual insert
     */
    private async performInsert<TItemMetadata extends TMetadata = TMetadata>(item: Partial<IndexItem<TItemMetadata>>, unique: boolean): Promise<IndexItem<TItemMetadata>> {
        const updateInProgress = !!this._update;
        if (!updateInProgress) {
            await this.beginUpdate();
        }
        try {
            const newItem = await this.addItemToUpdate(item, unique);
            
            // Write to WAL if enabled
            if (this._wal) {
                await this._wal.writeEntry({
                    id: newItem.id,
                    timestamp: Date.now(),
                    operation: unique ? 'insert' : 'update',
                    data: newItem
                });
            }
            
            // Log to operations log
            if (this._operationsLog) {
                await this._operationsLog.append({ 
                    operation: unique ? 'insert' : 'upsert', 
                    item: newItem,
                    timestamp: Date.now()
                });
            }
            if (!updateInProgress) {
                await this.endUpdate();
            }
            return newItem as any;
        } catch (err) {
            if (!updateInProgress) {
                await this.cancelUpdate();
            }
            throw err;
        }
    }

    /**
     * Returns true if the index exists.
     */
    public async isIndexCreated(): Promise<boolean> {
        try {
            await fs.access(path.join(this._folderPath, this.indexName));
            return true;
        } catch (err: unknown) {
            return false;
        }
    }

    /**
     * Returns all items in the index.
     * @remarks
     * This method loads the index into memory and returns all its items. A copy of the items
     * array is returned so no modifications should be made to the array.
     * @returns Array of all items in the index.
     */
    public async listItems<TItemMetadata extends TMetadata = TMetadata>(): Promise<IndexItem<TItemMetadata>[]> {
        const lock = await lockManager.acquireReadLock(this._folderPath);
        try {
            await this.loadIndexData();
            
            if (this._isLazy && this._lazyIndex) {
                // For lazy index, iterate through all items
                const items: IndexItem<TItemMetadata>[] = [];
                for await (const item of this._lazyIndex.iterateItems()) {
                    items.push(item as any);
                }
                return items;
            }
            
            return Array.from(this._data!.items.values()) as any;
        } finally {
            await lock.release();
        }
    }

    /**
     * Returns all items in the index matching the filter.
     * @remarks
     * This method loads the index into memory and returns all its items matching the filter.
     * @param filter Filter to apply.
     * @returns Array of items matching the filter.
     */
    public async listItemsByMetadata<TItemMetadata extends TMetadata = TMetadata>(filter: MetadataFilter): Promise<IndexItem<TItemMetadata>[]> {
        const lock = await lockManager.acquireReadLock(this._folderPath);
        try {
            await this.loadIndexData();
            
            if (this._isLazy && this._lazyIndex) {
                // For lazy index, stream filter results
                const filteredItems: IndexItem<TItemMetadata>[] = [];
                for await (const item of this._lazyIndex.filterItems(filter)) {
                    filteredItems.push(item as any);
                }
                return filteredItems;
            }
            
            const filteredItems: IndexItem[] = [];
            for (const item of this._data!.items.values()) {
                if (ItemSelector.select(item.metadata, filter)) {
                    filteredItems.push(item);
                }
            }
            return filteredItems as any;
        } finally {
            await lock.release();
        }
    }

    /**
     * Finds the top k items in the index that are most similar to the vector.
     * @remarks
     * This method loads the index into memory and returns the top k items that are most similar.
     * An optional filter can be applied to the metadata of the items.
     * @param vector Vector to query against.
     * @param topK Number of items to return.
     * @param filter Optional. Filter to apply.
     * @returns Similar items to the vector that matche the supplied filter.
     */
    public async queryItems<TItemMetadata extends TMetadata = TMetadata>(vector: number[], query: string, topK: number, filter?: MetadataFilter, isBm25?: boolean, alpha: number = 1.0): Promise<QueryResult<TItemMetadata>[]> {
        const lock = await lockManager.acquireReadLock(this._folderPath);
        try {
            await this.loadIndexData();

        // Filter items
        let items: IndexItem[] = Array.from(this._data!.items.values());
        if (filter) {
            items = items.filter(i => ItemSelector.select(i.metadata, filter));
        }

        let vectorScores: Map<string, number> = new Map();
        
        // Initialize HNSW manager if not already done
        if (!this._hnswManager) {
            this._hnswManager = await hnswIndexManager.getIndex(this._folderPath, this._data!.distanceMetric);
            try {
                await this._hnswManager.load({ checksumEnabled: true });
            } catch (err) {
                // Index might not exist yet, that's ok for now
            }
        }
        
        if (this._hnswManager && this._hnswManager.isInitialized() && this._hnswManager.canAcceptDimension(vector.length)) {
            try {
                // If there's a filter, we need to search for more results and then filter
                const searchK = filter ? Math.min(topK * 10, this._data!.items.size) : topK;
                const results = this._hnswManager.searchKNN(vector, searchK);
                
                for (const result of results) {
                    // Check if item passes filter
                    if (filter) {
                        const item = this._data!.items.get(result.id);
                        if (!item || !ItemSelector.select(item.metadata, filter)) {
                            continue;
                        }
                    }
                    
                    // Convert distance to similarity score (1 - normalized distance)
                    const similarity = this._data!.distanceMetric === 'cosine' 
                        ? 1 - result.distance 
                        : 1 / (1 + result.distance); // For L2 and IP distances
                    vectorScores.set(result.id, similarity);
                    
                    // Stop when we have enough filtered results
                    if (vectorScores.size >= topK) {
                        break;
                    }
                }
            } catch (err) {
                console.warn('HNSW search failed, falling back to brute force:', err);
                // Fall back to brute force search
                const norm = ItemSelector.normalize(vector);
                const distances: { id: string, distance: number }[] = [];
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const distance = ItemSelector.normalizedCosineSimilarity(vector, norm, item.vector, item.norm);
                    distances.push({ id: item.id, distance: distance });
                }
                distances.sort((a, b) => b.distance - a.distance);
                distances.slice(0, topK).forEach(d => {
                    vectorScores.set(d.id, d.distance);
                });
            }
        } else {
            const norm = ItemSelector.normalize(vector);
            const distances: { id: string, distance: number }[] = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const distance = ItemSelector.normalizedCosineSimilarity(vector, norm, item.vector, item.norm);
                distances.push({ id: item.id, distance: distance });
            }
            distances.sort((a, b) => b.distance - a.distance);
            distances.slice(0, topK).forEach(d => {
                vectorScores.set(d.id, d.distance);
            });
        }

        let bm25Scores: Map<string, number> = new Map();
        if (isBm25 && query && query.trim()) {
            this.setupbm25();
            let currDoc;
            let currDocTxt;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                currDoc = new LocalDocument((this as unknown) as LocalDocumentIndex, item.metadata.documentId.toString(), '');
                currDocTxt = await currDoc.loadText();
                const startPos = item.metadata.startPos;
                const endPos = item.metadata.endPos;
                const chunkText = currDocTxt.substring(Number(startPos), Number(endPos) + 1);
                this._bm25Engine.addDoc({body: chunkText}, i);
            }
            this._bm25Engine.consolidate();
            const results = await this.bm25Search(query, items, topK);
            results.forEach((res: any) => {
                bm25Scores.set(items[res[0]].id, res[1]);
            });
        }

        const combinedScores: Map<string, number> = new Map();
        
        // If no text query, just use vector scores
        if (!query || !query.trim() || bm25Scores.size === 0) {
            vectorScores.forEach((score, id) => {
                combinedScores.set(id, score);
            });
        } else {
            // Combine all unique IDs from both score maps
            const allIds: string[] = [];
            const seenIds = new Set<string>();
            
            vectorScores.forEach((_, id) => {
                if (!seenIds.has(id)) {
                    seenIds.add(id);
                    allIds.push(id);
                }
            });
            
            bm25Scores.forEach((_, id) => {
                if (!seenIds.has(id)) {
                    seenIds.add(id);
                    allIds.push(id);
                }
            });
            
            for (const id of allIds) {
                const vectorScore = vectorScores.get(id) ?? 0;
                const bm25Score = bm25Scores.get(id) ?? 0;
                combinedScores.set(id, alpha * vectorScore + (1 - alpha) * bm25Score);
            }
        }

        const sortedScores = Array.from(combinedScores.entries()).sort((a, b) => b[1] - a[1]);
        

        const top: QueryResult<TItemMetadata>[] = sortedScores.slice(0, topK)
            .map(d => {
                const item = this._data!.items.get(d[0]);
                if (!item) {
                    return null;
                }
                return {
                    item: Object.assign({}, item) as any,
                    score: d[1]
                };
            })
            .filter(result => result !== null) as QueryResult<TItemMetadata>[];

            // Load external metadata
            for (const item of top) {
                if (item.item.metadataFile) {
                    const metadataPath = path.join(this._folderPath, item.item.metadataFile);
                    const metadata = await fs.readFile(metadataPath);
                    item.item.metadata = JSON.parse(metadata.toString());
                }
            }

            return top;
        } finally {
            await lock.release();
        }
    }

    public async snapshot(snapshotFolderPath: string): Promise<void> {
        if (this._update) {
            throw new Error('Cannot snapshot while an update is in progress');
        }

        await fs.mkdir(snapshotFolderPath, { recursive: true });
        await fs.cp(this._folderPath, snapshotFolderPath, { recursive: true });
    }

    /**
     * Adds or replaces an item in the index.
     * @remarks
     * A new update is started if one is not already in progress. If an item with the same ID
     * already exists, it will be replaced.
     * @param item Item to insert or replace.
     * @returns Upserted item.
     */
    public async upsertItem<TItemMetadata extends TMetadata = TMetadata>(item: Partial<IndexItem<TItemMetadata>>): Promise<IndexItem<TItemMetadata>> {
        // Queue the operation for processing
        return await this._operationQueue.enqueue('insert', { item, unique: false }, 1);
    }

    /**
     * Waits for all queued operations to complete.
     */
    public async flush(): Promise<void> {
        await this._operationQueue.drain();
    }

    /**
     * Performs cleanup of orphaned metadata files
     */
    public async cleanup(): Promise<CleanupStats> {
        await this.loadIndexData();
        return await CleanupManager.performFullCleanup(this._folderPath, this._data!.items);
    }

    /**
     * Validates metadata file integrity
     */
    public async validateMetadataFiles(): Promise<string[]> {
        await this.loadIndexData();
        return await CleanupManager.validateMetadataFiles(this._folderPath, this._data!.items);
    }

    /**
     * Gets metadata storage statistics
     */
    public async getMetadataStats(): Promise<{
        totalFiles: number;
        totalBytes: number;
        averageFileSize: number;
    }> {
        await this.loadIndexData();
        return await CleanupManager.getMetadataStorageStats(this._folderPath, this._data!.items);
    }

    /**
     * Ensures that the index has been loaded into memory.
     */
    protected async loadIndexData(): Promise<void> {
        if (this._data || this._lazyIndex) {
            return;
        }
        

        if (!await this.isIndexCreated()) {
            throw new Error('Index does not exist');
        }

        const data = await fs.readFile(path.join(this._folderPath, this.indexName));
        const indexData: IndexData = JSON.parse(data.toString());
        
        // Check if this is a lazy index
        if (indexData.lazy) {
            this._isLazy = true;
            this._lazyIndex = new LazyIndex<TMetadata>(this._folderPath);
            this._vectorOptions = indexData.vectorOptions;
            this._metadataSchema = indexData.metadata_config?.schema;
            return;
        }
        
        this._data = {
            ...indexData,
            items: new Map(indexData.items.map(i => [i.id, i])),
            wal: indexData.wal
        };
        
        // Load validation options
        this._vectorOptions = indexData.vectorOptions;
        this._metadataSchema = indexData.metadata_config?.schema;
        this._walEnabled = indexData.wal || false;
        
        // Initialize and replay WAL if enabled
        if (this._walEnabled) {
            this._wal = await walManager.getWAL(this._folderPath);
            // Don't auto-replay on load - let recoverFromWAL handle explicit recovery
        }

        // Initialize operations log
        this._operationsLog = await operationsLogManager.getLog(this._folderPath, this._operationsLogName);

        // Apply operations from log
        const logEntries = await this._operationsLog.readEntries();
        for (const op of logEntries) {
            switch (op.operation) {
                case 'insert':
                case 'upsert':
                    if (op.item) {
                        this._data.items.set(op.item.id, op.item);
                    }
                    break;
                case 'delete':
                    if (op.id) {
                        this._data.items.delete(op.id);
                    }
                    break;
            }
        }

        // Initialize HNSW manager
        this._hnswManager = await hnswIndexManager.getIndex(this._folderPath);
        
        // Try to load existing HNSW index
        try {
            await this._hnswManager.load({ checksumEnabled: true });
            console.log('Loaded existing HNSW index');
        } catch (err) {
            // Build HNSW index if not found or corrupt
            if (this._data.items.size > 0) {
                console.log('Building HNSW index...');
                const items = Array.from(this._data.items.entries()).map(([id, item]) => ({
                    id,
                    vector: item.vector
                }));
                const firstItem = this._data.items.values().next().value;
                const dim = firstItem!.vector.length;
                
                await this._hnswManager.buildFromItems(
                    items,
                    dim,
                    this._data.distanceMetric,
                    this._hnswOptions,
                    (progress) => {
                        if (progress % 10 === 0) {
                            console.log(`HNSW build progress: ${progress}%`);
                        }
                    }
                );
                
                // Save the built index
                await this._hnswManager.save({ checksumEnabled: true });
            }
        }
        
    }

    private async addItemToUpdate(item: Partial<IndexItem<any>>, unique: boolean): Promise<IndexItem> {
        // Ensure vector is provided
        if (!item.vector) {
            throw new Error('Vector is required');
        }

        // Always validate vector (with or without options)
        try {
            Validator.validateVector(item.vector, this._vectorOptions || {});
        } catch (err) {
            if (err instanceof ValidationError) {
                throw new Error(`Vector validation failed: ${err.message}`);
            }
            throw err;
        }

        // Validate metadata (always check for basic rules, schema optional)
        if (item.metadata) {
            try {
                Validator.validateMetadata(item.metadata, this._metadataSchema);
            } catch (err) {
                if (err instanceof ValidationError) {
                    throw new Error(`Metadata validation failed: ${err.message}`);
                }
                throw err;
            }
        }

        // Ensure unique
        const id = item.id ?? v4();
        if (unique) {
            if (this._update!.items.has(id)) {
                throw new Error(`Item with id ${id} already exists`);
            }
        }

        // Check for indexed metadata
        let metadata: Record<string,any> = {};
        let metadataFile: string | undefined;
        if (this._update!.metadata_config.indexed && this._update!.metadata_config.indexed.length > 0 && item.metadata) {
            // Copy only indexed metadata
            for (const key of this._update!.metadata_config.indexed) {
                if (item.metadata && item.metadata[key]) {
                    metadata[key] = item.metadata[key];
                }
            }

            // Save remaining metadata to disk
            metadataFile = `${v4()}.json`;
            const metadataPath = path.join(this._folderPath, metadataFile);
            await fs.writeFile(metadataPath, JSON.stringify(item.metadata));
        } else if (item.metadata) {
            metadata = item.metadata;
        }

        // Create new item
        const newItem: IndexItem = {
            id: id,
            metadata: metadata,
            vector: item.vector,
            norm: ItemSelector.normalize(item.vector)
        };
        if (metadataFile) {
            newItem.metadataFile = metadataFile;
        }

        // Add item to index
        this._update!.items.set(id, newItem);
        
        // Update HNSW index if available
        if (this._hnswManager && item.vector) {
            try {
                // Check if index is initialized
                if (!this._hnswManager.isInitialized()) {
                    // Initialize HNSW if not already done
                    await this._hnswManager.initializeIndex(
                        item.vector.length,
                        this._update!.distanceMetric,
                        this._hnswOptions
                    );
                }
                
                // Check if dimension is compatible
                if (this._hnswManager.canAcceptDimension(item.vector.length)) {
                    await this._hnswManager.addVector(id, item.vector);
                } else {
                    const currentDim = this._hnswManager.getDimension();
                    console.warn(`Skipping HNSW update: vector dimension ${item.vector.length} doesn't match index dimension ${currentDim}`);
                }
            } catch (err: any) {
                if (err.message?.includes('already exists')) {
                    // Update existing vector
                    if (this._hnswManager.canAcceptDimension(item.vector.length)) {
                        await this._hnswManager.updateVector(id, item.vector);
                    }
                } else {
                    console.warn('Failed to update HNSW index:', err);
                }
            }
        }
        
        return newItem;
    }

    private async setupbm25(): Promise<any> {
        this._bm25Engine = bm25();
        const nlp = winkNLP( model );
        const its = nlp.its;

        const prepTask = function ( text: string ) {
            const tokens: any[] = [];
            nlp.readDoc(text)
                .tokens()
                // Use only words ignoring punctuations etc and from them remove stop words
                .filter( (t: any) => ( t.out(its.type) === 'word' && !t.out(its.stopWordFlag) ) )
                // Handle negation and extract stem of the word
                .each( (t: any) => tokens.push( (t.out(its.negationFlag)) ? '!' + t.out(its.stem) : t.out(its.stem) ) );

            return tokens;
        };

        this._bm25Engine.defineConfig( { fldWeights: { body: 1 } } );
        // Step II: Define PrepTasks pipe.
        this._bm25Engine.definePrepTasks( [ prepTask ] );
    }

    private async bm25Search(searchQuery: string, items: any, topK: number): Promise<any> {
        var query = searchQuery;
        // `results` is an array of [ doc-id, score ], sorted by score
        var results = this._bm25Engine.search( query );

        return results.slice(0, topK);
    }

    /**
     * Compact the operations log
     */
    public async compactOperationsLog(): Promise<CompactionResult> {
        if (!this._operationsLog) {
            throw new Error('Operations log not initialized');
        }
        
        return await this._operationsLog.compact();
    }

    /**
     * Rotate the operations log
     */
    public async rotateOperationsLog(): Promise<void> {
        if (!this._operationsLog) {
            throw new Error('Operations log not initialized');
        }
        
        await this._operationsLog.rotate();
    }

    /**
     * Get operations log statistics
     */
    public async getOperationsLogStats(): Promise<any> {
        if (!this._operationsLog) {
            throw new Error('Operations log not initialized');
        }
        
        return await this._operationsLog.getStats();
    }

    public async compact(): Promise<CleanupStats> {
        if (this._update) {
            throw new Error('Cannot compact while an update is in progress');
        }

        await this.loadIndexData();
        
        // Clean up orphaned files before compacting
        const cleanupStats = await CleanupManager.performFullCleanup(this._folderPath, this._data!.items);
        
        const indexData: IndexData = {
            version: this._data!.version,
            distanceMetric: this._data!.distanceMetric,
            metadata_config: this._data!.metadata_config,
            vectorOptions: this._data!.vectorOptions,
            items: Array.from(this._data!.items.values())
        };

        const tempPath = path.join(this._folderPath, `${this._indexName}.tmp`);
        try {
            await AtomicOperations.writeFile(tempPath, JSON.stringify(indexData));
            await fs.rename(tempPath, path.join(this._folderPath, this._indexName));
            
            // Compact operations log
            if (this._operationsLog) {
                const compactionResult = await this._operationsLog.compact();
                console.log(`Operations log compacted: ${compactionResult.originalEntries} -> ${compactionResult.compactedEntries} entries`);
            }
            
            // Clean up old backup files
            await CleanupManager.cleanupOldBackups(this._folderPath);
            
            return cleanupStats;
        } catch (err) {
            // Attempt to clean up the temporary file if an error occurs
            await fs.unlink(tempPath).catch(() => {});
            throw err;
        }
    }

    /**
     * Converts the index to lazy loading format
     */
    public async convertToLazy(chunkSize: number = 1000): Promise<void> {
        if (this._update) {
            throw new Error('Cannot convert to lazy while an update is in progress');
        }

        await this.loadIndexData();
        const outputPath = path.join(this._folderPath, '.lazy_temp');
        
        try {
            // Create lazy index in temporary directory
            await LazyIndex.createFromIndex(this._folderPath, outputPath, chunkSize);
            
            // Move chunks directory
            await fs.rename(path.join(outputPath, 'chunks'), path.join(this._folderPath, 'chunks'));
            await fs.rename(path.join(outputPath, 'manifest.json'), path.join(this._folderPath, 'manifest.json'));
            
            // Update index.json to mark as lazy
            const indexData: IndexData = {
                version: this._data!.version,
                distanceMetric: this._data!.distanceMetric,
                metadata_config: this._data!.metadata_config,
                vectorOptions: this._data!.vectorOptions,
                items: [],
                lazy: true
            };
            await AtomicOperations.writeFile(path.join(this._folderPath, this._indexName), JSON.stringify(indexData));
            
            // Clean up temp directory
            await fs.rmdir(outputPath);
            
            // Initialize lazy index
            this._isLazy = true;
            this._lazyIndex = new LazyIndex<TMetadata>(this._folderPath);
            this._data = undefined;
        } catch (err) {
            // Clean up on error
            await fs.rm(outputPath, { recursive: true }).catch(() => {});
            throw err;
        }
    }

    /**
     * Recover index from WAL
     */
    public async recoverFromWAL(): Promise<number> {
        await this.loadIndexData();
        
        if (!this._walEnabled || !this._wal) {
            throw new Error(`WAL is not enabled for this index. walEnabled: ${this._walEnabled}, wal: ${!!this._wal}`);
        }
        
        // Clear current data
        this._data!.items.clear();
        
        // Replay all WAL entries
        const replayedCount = await this._wal!.replay(async (entry) => {
            switch (entry.operation) {
                case 'insert':
                case 'update':
                    this._data!.items.set(entry.id, entry.data);
                    break;
                case 'delete':
                    this._data!.items.delete(entry.id);
                    break;
            }
        });
        
        // Save recovered state
        if (replayedCount > 0) {
            await this.beginUpdate();
            await this.endUpdate();
        }
        
        return replayedCount;
    }

    /**
     * Get WAL statistics
     */
    public async getWALStats(): Promise<any> {
        if (!this._walEnabled || !this._wal) {
            throw new Error('WAL is not enabled for this index');
        }
        
        return this._wal.getStats();
    }

    /**
     * Clean up old WAL files
     */
    public async cleanupWAL(keepFiles: number = 2): Promise<number> {
        if (!this._walEnabled || !this._wal) {
            throw new Error('WAL is not enabled for this index');
        }
        
        return await this._wal.cleanup(keepFiles);
    }

    /**
     * Close WAL and cleanup resources
     */
    public async close(): Promise<void> {
        if (this._wal) {
            await walManager.closeWAL(this._folderPath);
            this._wal = undefined;
        }
        
        // Operations log is managed by the manager, no need to close
        this._operationsLog = undefined;
        
        // Save and close HNSW index
        if (this._hnswManager) {
            if (this._hnswManager.needsSave()) {
                await this._hnswManager.save({ checksumEnabled: true });
            }
            await hnswIndexManager.closeIndex(this._folderPath);
            this._hnswManager = undefined;
        }
    }

    /**
     * Rebuild HNSW index
     */
    public async rebuildHNSWIndex(options?: HNSWOptions): Promise<void> {
        await this.loadIndexData();
        
        if (!this._hnswManager) {
            this._hnswManager = await hnswIndexManager.getIndex(this._folderPath, this._data!.distanceMetric);
        }
        
        if (this._data!.items.size === 0) {
            console.log('No items to index');
            return;
        }
        
        console.log('Rebuilding HNSW index...');
        const items = Array.from(this._data!.items.entries()).map(([id, item]) => ({
            id,
            vector: item.vector
        }));
        const firstItem = this._data!.items.values().next().value;
        const dim = firstItem!.vector.length;
        
        await this._hnswManager.buildFromItems(
            items,
            dim,
            this._data!.distanceMetric,
            options || this._hnswOptions,
            (progress) => {
                if (progress % 10 === 0) {
                    console.log(`HNSW rebuild progress: ${progress}%`);
                }
            }
        );
        
        await this._hnswManager.save({ checksumEnabled: true });
        console.log('HNSW index rebuilt successfully');
    }

    /**
     * Get HNSW index statistics
     */
    public async getHNSWStats(): Promise<any> {
        // Ensure index data is loaded first
        await this.loadIndexData();
        
        if (!this._hnswManager) {
            this._hnswManager = await hnswIndexManager.getIndex(this._folderPath, this._data!.distanceMetric);
            try {
                await this._hnswManager.load({ checksumEnabled: true });
            } catch (err) {
                // Index might not exist
            }
        }
        
        return await this._hnswManager.getStats();
    }

    /**
     * Optimize HNSW index for search
     */
    public async optimizeHNSWIndex(ef?: number): Promise<void> {
        // Ensure index data is loaded first
        await this.loadIndexData();
        
        if (!this._hnswManager) {
            this._hnswManager = await hnswIndexManager.getIndex(this._folderPath, this._data!.distanceMetric);
        }
        
        await this._hnswManager.optimize(ef);
        console.log('HNSW index optimized');
    }

    /**
     * Verify data integrity
     */
    public async verifyIntegrity(options?: DataIntegrityOptions): Promise<IntegrityCheckResult> {
        return await dataIntegrity.verifyIndexIntegrity(this._folderPath, options);
    }

    /**
     * Generate integrity report
     */
    public async generateIntegrityReport(options?: DataIntegrityOptions): Promise<string> {
        return await dataIntegrity.generateIntegrityReport(this._folderPath, options);
    }

    /**
     * Repair index if possible
     */
    public async repairIndex(options?: DataIntegrityOptions): Promise<{ repaired: boolean; actions: string[] }> {
        return await dataIntegrity.repairIndex(this._folderPath, { ...options, repairMode: true });
    }

    /**
     * Calculate and store checksums for all components
     */
    public async updateChecksums(): Promise<void> {
        await this.loadIndexData();
        
        // Create checksums file
        const checksums: Record<string, string> = {};
        
        // Calculate index checksum
        checksums.index = dataIntegrity.calculateIndexChecksum(this._data!.items);
        
        // Calculate metadata checksums
        for (const [id, item] of this._data!.items) {
            if (item.metadataFile) {
                const metadataPath = path.join(this._folderPath, item.metadataFile);
                try {
                    checksums[`metadata.${id}`] = await dataIntegrity.calculateFileChecksum(metadataPath);
                } catch (err) {
                    // Ignore missing files
                }
            }
        }
        
        // Store checksums
        const checksumsPath = path.join(this._folderPath, '.checksums.json');
        await AtomicOperations.writeFile(checksumsPath, JSON.stringify(checksums, null, 2));
    }

    /**
     * Verify stored checksums
     */
    public async verifyChecksums(): Promise<{ valid: boolean; mismatches: string[] }> {
        const result = { valid: true, mismatches: [] as string[] };
        
        try {
            const checksumsPath = path.join(this._folderPath, '.checksums.json');
            const storedData = await fs.readFile(checksumsPath, 'utf-8');
            const stored = JSON.parse(storedData);
            
            await this.loadIndexData();
            
            // Verify index checksum
            const currentIndexChecksum = dataIntegrity.calculateIndexChecksum(this._data!.items);
            if (stored.index !== currentIndexChecksum) {
                result.valid = false;
                result.mismatches.push('index');
            }
            
            // Verify metadata checksums
            for (const [id, item] of this._data!.items) {
                if (item.metadataFile && stored[`metadata.${id}`]) {
                    const metadataPath = path.join(this._folderPath, item.metadataFile);
                    try {
                        const currentChecksum = await dataIntegrity.calculateFileChecksum(metadataPath);
                        if (stored[`metadata.${id}`] !== currentChecksum) {
                            result.valid = false;
                            result.mismatches.push(`metadata.${id}`);
                        }
                    } catch (err) {
                        result.valid = false;
                        result.mismatches.push(`metadata.${id} (missing)`);
                    }
                }
            }
        } catch (err) {
            result.valid = false;
            result.mismatches.push('checksums file not found or invalid');
        }
        
        return result;
    }
}

interface IndexData {
    version: number;
    distanceMetric: DistanceMetric;
    metadata_config: {
        indexed?: string[];
        schema?: MetadataSchema;
    };
    vectorOptions?: VectorValidationOptions;
    items: IndexItem[];
    lazy?: boolean;
    wal?: boolean;
}

interface InMemoryIndexData {
    version: number;
    distanceMetric: DistanceMetric;
    metadata_config: {
        indexed?: string[];
        schema?: MetadataSchema;
    };
    vectorOptions?: VectorValidationOptions;
    items: Map<string, IndexItem>;
    wal?: boolean;
}

