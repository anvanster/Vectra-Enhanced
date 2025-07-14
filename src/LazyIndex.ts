import * as fs from 'fs/promises';
import * as path from 'path';
import { IndexItem, MetadataFilter, MetadataTypes } from './types';
import { ItemSelector } from './ItemSelector';
import { v4 as uuidv4 } from 'uuid';

export interface PageInfo {
    pageSize: number;
    pageNumber: number;
    totalItems: number;
    totalPages: number;
}

export interface PagedResult<T> {
    items: T[];
    pageInfo: PageInfo;
    hasMore: boolean;
}

export interface LazyIndexOptions {
    cacheSize?: number;
    pageSize?: number;
    preloadMetadata?: boolean;
}

export interface IndexManifest {
    version: number;
    totalItems: number;
    chunks: ChunkInfo[];
    vectorDimensions?: number;
    lastModified: string;
}

export interface ChunkInfo {
    id: string;
    startIndex: number;
    endIndex: number;
    itemCount: number;
    filename: string;
}

class LRUCache<K, V> {
    private cache: Map<K, V> = new Map();
    private readonly maxSize: number;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    get(key: K): V | undefined {
        const value = this.cache.get(key);
        if (value !== undefined) {
            // Move to end (most recently used)
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }

    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // Remove least recently used (first item)
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }

    clear(): void {
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }
}

export class LazyIndex<TMetadata extends Record<string, MetadataTypes> = Record<string, MetadataTypes>> {
    private readonly folderPath: string;
    private readonly options: Required<LazyIndexOptions>;
    private manifest?: IndexManifest;
    private itemCache: LRUCache<string, IndexItem<TMetadata>>;
    private chunkCache: LRUCache<string, Map<string, IndexItem<TMetadata>>>;
    private metadataCache: LRUCache<string, TMetadata>;

    constructor(folderPath: string, options: LazyIndexOptions = {}) {
        this.folderPath = folderPath;
        this.options = {
            cacheSize: options.cacheSize || 1000,
            pageSize: options.pageSize || 100,
            preloadMetadata: options.preloadMetadata || false
        };
        
        this.itemCache = new LRUCache(this.options.cacheSize);
        this.chunkCache = new LRUCache(Math.max(10, Math.floor(this.options.cacheSize / 100)));
        this.metadataCache = new LRUCache(this.options.cacheSize);
    }

    /**
     * Loads the index manifest
     */
    private async loadManifest(): Promise<IndexManifest> {
        if (this.manifest) {
            return this.manifest;
        }

        const manifestPath = path.join(this.folderPath, 'manifest.json');
        const data = await fs.readFile(manifestPath, 'utf-8');
        this.manifest = JSON.parse(data);
        return this.manifest!;
    }

    /**
     * Finds which chunk contains an item by ID
     */
    private async findChunkForItem(itemId: string): Promise<ChunkInfo | undefined> {
        const manifest = await this.loadManifest();
        
        // First check cache
        const cachedItem = this.itemCache.get(itemId);
        if (cachedItem) {
            return undefined; // Already in cache
        }

        // Linear search through chunks - could be optimized with index
        for (const chunk of manifest.chunks) {
            const chunkData = await this.loadChunk(chunk.id);
            if (chunkData.has(itemId)) {
                return chunk;
            }
        }

        return undefined;
    }

    /**
     * Loads a chunk from disk
     */
    private async loadChunk(chunkId: string): Promise<Map<string, IndexItem<TMetadata>>> {
        // Check cache first
        const cached = this.chunkCache.get(chunkId);
        if (cached) {
            return cached;
        }

        const manifest = await this.loadManifest();
        const chunkInfo = manifest.chunks.find(c => c.id === chunkId);
        if (!chunkInfo) {
            throw new Error(`Chunk ${chunkId} not found`);
        }

        const chunkPath = path.join(this.folderPath, 'chunks', chunkInfo.filename);
        const data = await fs.readFile(chunkPath, 'utf-8');
        const items: IndexItem<TMetadata>[] = JSON.parse(data);
        
        const chunkMap = new Map<string, IndexItem<TMetadata>>();
        for (const item of items) {
            chunkMap.set(item.id, item);
            // Also cache individual items
            this.itemCache.set(item.id, item);
        }

        this.chunkCache.set(chunkId, chunkMap);
        return chunkMap;
    }

    /**
     * Gets a single item by ID
     */
    async getItem(id: string): Promise<IndexItem<TMetadata> | undefined> {
        // Check cache first
        const cached = this.itemCache.get(id);
        if (cached) {
            return await this.loadMetadataIfNeeded(cached);
        }

        // Find and load chunk
        const chunkInfo = await this.findChunkForItem(id);
        if (!chunkInfo) {
            return undefined;
        }

        const item = this.itemCache.get(id);
        return item ? await this.loadMetadataIfNeeded(item) : undefined;
    }

    /**
     * Loads external metadata if needed
     */
    private async loadMetadataIfNeeded(item: IndexItem<TMetadata>): Promise<IndexItem<TMetadata>> {
        if (!item.metadataFile) {
            return item;
        }

        // Check metadata cache
        const cached = this.metadataCache.get(item.id);
        if (cached) {
            return { ...item, metadata: cached };
        }

        // Load from file
        const metadataPath = path.join(this.folderPath, item.metadataFile);
        const data = await fs.readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(data) as TMetadata;
        
        this.metadataCache.set(item.id, metadata);
        return { ...item, metadata };
    }

    /**
     * Lists items with pagination
     */
    async listItems(page: number = 1, pageSize?: number): Promise<PagedResult<IndexItem<TMetadata>>> {
        const manifest = await this.loadManifest();
        const size = pageSize || this.options.pageSize;
        const startIndex = (page - 1) * size;
        const endIndex = Math.min(startIndex + size, manifest.totalItems);

        if (startIndex >= manifest.totalItems) {
            return {
                items: [],
                pageInfo: {
                    pageSize: size,
                    pageNumber: page,
                    totalItems: manifest.totalItems,
                    totalPages: Math.ceil(manifest.totalItems / size)
                },
                hasMore: false
            };
        }

        const items: IndexItem<TMetadata>[] = [];
        
        // Find chunks that contain items in the requested range
        for (const chunk of manifest.chunks) {
            if (chunk.endIndex < startIndex || chunk.startIndex >= endIndex) {
                continue; // Skip chunks outside range
            }

            const chunkData = await this.loadChunk(chunk.id);
            const chunkItems = Array.from(chunkData.values());
            
            // Add items within the range
            for (let i = 0; i < chunkItems.length; i++) {
                const globalIndex = chunk.startIndex + i;
                if (globalIndex >= startIndex && globalIndex < endIndex) {
                    const item = await this.loadMetadataIfNeeded(chunkItems[i]);
                    items.push(item);
                }
            }
        }

        return {
            items,
            pageInfo: {
                pageSize: size,
                pageNumber: page,
                totalItems: manifest.totalItems,
                totalPages: Math.ceil(manifest.totalItems / size)
            },
            hasMore: endIndex < manifest.totalItems
        };
    }

    /**
     * Creates an async iterator for streaming items
     */
    async *iterateItems(): AsyncIterableIterator<IndexItem<TMetadata>> {
        const manifest = await this.loadManifest();
        
        for (const chunkInfo of manifest.chunks) {
            const chunkData = await this.loadChunk(chunkInfo.id);
            
            for (const item of chunkData.values()) {
                yield await this.loadMetadataIfNeeded(item);
            }
        }
    }

    /**
     * Filters items with streaming
     */
    async *filterItems(filter: MetadataFilter): AsyncIterableIterator<IndexItem<TMetadata>> {
        for await (const item of this.iterateItems()) {
            if (ItemSelector.select(item.metadata, filter)) {
                yield item;
            }
        }
    }

    /**
     * Gets items by metadata filter with pagination
     */
    async listItemsByMetadata(
        filter: MetadataFilter,
        page: number = 1,
        pageSize?: number
    ): Promise<PagedResult<IndexItem<TMetadata>>> {
        const size = pageSize || this.options.pageSize;
        const items: IndexItem<TMetadata>[] = [];
        let totalMatches = 0;
        let skipped = 0;
        const skipCount = (page - 1) * size;

        for await (const item of this.filterItems(filter)) {
            totalMatches++;
            
            if (skipped < skipCount) {
                skipped++;
                continue;
            }

            if (items.length < size) {
                items.push(item);
            }
        }

        return {
            items,
            pageInfo: {
                pageSize: size,
                pageNumber: page,
                totalItems: totalMatches,
                totalPages: Math.ceil(totalMatches / size)
            },
            hasMore: totalMatches > skipCount + items.length
        };
    }

    /**
     * Creates a lazy index from an existing index
     */
    static async createFromIndex(
        indexPath: string,
        outputPath: string,
        chunkSize: number = 1000
    ): Promise<void> {
        // Read the original index
        const indexData = await fs.readFile(path.join(indexPath, 'index.json'), 'utf-8');
        const index = JSON.parse(indexData);
        
        // Create output directory structure
        await fs.mkdir(outputPath, { recursive: true });
        await fs.mkdir(path.join(outputPath, 'chunks'), { recursive: true });

        // Split items into chunks
        const chunks: ChunkInfo[] = [];
        const items = index.items || [];
        
        for (let i = 0; i < items.length; i += chunkSize) {
            const chunkItems = items.slice(i, Math.min(i + chunkSize, items.length));
            const chunkId = uuidv4();
            const chunkInfo: ChunkInfo = {
                id: chunkId,
                startIndex: i,
                endIndex: i + chunkItems.length - 1,
                itemCount: chunkItems.length,
                filename: `chunk-${chunkId}.json`
            };
            
            // Write chunk file
            await fs.writeFile(
                path.join(outputPath, 'chunks', chunkInfo.filename),
                JSON.stringify(chunkItems)
            );
            
            chunks.push(chunkInfo);
        }

        // Create manifest
        const manifest: IndexManifest = {
            version: index.version || 1,
            totalItems: items.length,
            chunks,
            vectorDimensions: items.length > 0 ? items[0].vector?.length : undefined,
            lastModified: new Date().toISOString()
        };

        // Write manifest
        await fs.writeFile(
            path.join(outputPath, 'manifest.json'),
            JSON.stringify(manifest, null, 2)
        );

        // Copy other files (metadata, etc)
        const files = await fs.readdir(indexPath);
        for (const file of files) {
            if (file.endsWith('.json') && file !== 'index.json') {
                await fs.copyFile(
                    path.join(indexPath, file),
                    path.join(outputPath, file)
                );
            }
        }
    }

    /**
     * Clears all caches
     */
    clearCache(): void {
        this.itemCache.clear();
        this.chunkCache.clear();
        this.metadataCache.clear();
        this.manifest = undefined;
    }

    /**
     * Gets cache statistics
     */
    getCacheStats(): {
        itemCacheSize: number;
        chunkCacheSize: number;
        metadataCacheSize: number;
    } {
        return {
            itemCacheSize: this.itemCache.size,
            chunkCacheSize: this.chunkCache.size,
            metadataCacheSize: this.metadataCache.size
        };
    }
}