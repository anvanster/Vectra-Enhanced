import * as fs from 'fs/promises';
import * as path from 'path';
import { HierarchicalNSW } from 'hnswlib-node';
import { DistanceMetric } from './types';
import { AtomicOperations } from './AtomicOperations';
import * as crypto from 'crypto';

export interface HNSWOptions {
    M?: number;              // Number of bi-directional links (default: 16)
    efConstruction?: number; // Size of dynamic candidate list (default: 200)
    randomSeed?: number;     // Random seed for reproducibility
    maxElements?: number;    // Initial capacity (default: 10000)
}

export interface HNSWStats {
    dimensions: number;
    distanceMetric: DistanceMetric;
    elementCount: number;
    capacity: number;
    fileSize?: number;
    checksum?: string;
    lastSaved?: number;
    buildTime?: number;
}

export interface HNSWPersistenceOptions {
    checksumEnabled?: boolean;
    compressionEnabled?: boolean;
    incrementalSave?: boolean;
}

export class HNSWManager {
    private index?: HierarchicalNSW;
    private readonly folderPath: string;
    private readonly indexFileName: string = 'hnsw.index';
    private readonly metadataFileName: string = 'hnsw.meta';
    private dimensions?: number;
    private distanceMetric: DistanceMetric = 'cosine';
    private itemIdToLabel: Map<string, number> = new Map();
    private labelToItemId: Map<number, string> = new Map();
    private lastSaved: number = 0;
    private isDirty: boolean = false;
    private nextLabel: number = 0;  // Monotonically increasing label counter

    constructor(folderPath: string) {
        this.folderPath = folderPath;
    }
    
    /**
     * Set the distance metric (used when metric is known before initialization)
     */
    setDistanceMetric(metric: DistanceMetric): void {
        this.distanceMetric = metric;
    }

    /**
     * Initialize a new HNSW index
     */
    async initializeIndex(
        dimensions: number,
        distanceMetric: DistanceMetric,
        options: HNSWOptions = {}
    ): Promise<void> {
        this.dimensions = dimensions;
        this.distanceMetric = distanceMetric;

        // Create HNSW index with optimized parameters
        const M = options.M || 16;
        const efConstruction = options.efConstruction || 200;
        const maxElements = options.maxElements || 10000;
        const randomSeed = options.randomSeed || 100;

        this.index = new HierarchicalNSW(distanceMetric, dimensions);
        this.index.initIndex(maxElements, M, efConstruction, randomSeed);
        
        this.itemIdToLabel.clear();
        this.labelToItemId.clear();
        this.nextLabel = 0;
        this.isDirty = true;
    }

    /**
     * Add a vector to the index
     */
    async addVector(itemId: string, vector: number[]): Promise<void> {
        // Initialize index on first vector if needed
        if (!this.index && this.dimensions === undefined) {
            await this.initializeIndex(vector.length, this.distanceMetric, {});
        }
        
        if (!this.index) {
            throw new Error('Index not initialized');
        }
        
        // Validate dimension matches
        if (this.dimensions !== undefined && vector.length !== this.dimensions) {
            // If dimensions don't match and index has items, we need to rebuild
            if (this.itemIdToLabel.size > 0) {
                console.warn(`Vector dimension mismatch: expected ${this.dimensions}, got ${vector.length}. Skipping vector.`);
                return;
            } else {
                // If index is empty, we can re-initialize with new dimensions
                console.log(`Re-initializing HNSW index with new dimensions: ${vector.length}`);
                await this.initializeIndex(vector.length, this.distanceMetric, {});
            }
        }

        // Check if item already exists
        if (this.itemIdToLabel.has(itemId)) {
            throw new Error(`Item ${itemId} already exists in index`);
        }

        // Check if we need to resize
        if (this.itemIdToLabel.size >= this.index.getMaxElements()) {
            // Resize to 2x current capacity
            const newCapacity = this.index.getMaxElements() * 2;
            this.index.resizeIndex(newCapacity);
        }
        
        // Get next label (monotonically increasing)
        const label = this.nextLabel++;
        
        // Add to HNSW
        this.index.addPoint(vector, label);
        
        // Update mappings
        this.itemIdToLabel.set(itemId, label);
        this.labelToItemId.set(label, itemId);
        this.isDirty = true;
    }

    /**
     * Update a vector in the index
     */
    async updateVector(itemId: string, vector: number[]): Promise<void> {
        // Initialize index on first vector if needed
        if (!this.index && this.dimensions === undefined) {
            await this.initializeIndex(vector.length, this.distanceMetric, {});
        }
        
        if (!this.index) {
            throw new Error('Index not initialized');
        }
        
        // Validate dimension matches
        if (this.dimensions !== undefined && vector.length !== this.dimensions) {
            console.warn(`Vector dimension mismatch in update: expected ${this.dimensions}, got ${vector.length}. Skipping update.`);
            return;
        }

        const label = this.itemIdToLabel.get(itemId);
        if (label === undefined) {
            throw new Error(`Item ${itemId} not found in index`);
        }

        // HNSW doesn't support updates, so we need to mark as deleted and add new
        this.index.markDelete(label);
        
        // Add with new label (monotonically increasing)
        const newLabel = this.nextLabel++;
        this.index.addPoint(vector, newLabel);
        
        // Update mappings
        this.itemIdToLabel.set(itemId, newLabel);
        this.labelToItemId.delete(label);
        this.labelToItemId.set(newLabel, itemId);
        this.isDirty = true;
    }

    /**
     * Remove a vector from the index
     */
    removeVector(itemId: string): void {
        if (!this.index) {
            throw new Error('Index not initialized');
        }

        const label = this.itemIdToLabel.get(itemId);
        if (label === undefined) {
            throw new Error(`Item ${itemId} not found in index`);
        }

        // Mark as deleted in HNSW
        this.index.markDelete(label);
        
        // Remove from mappings
        this.itemIdToLabel.delete(itemId);
        this.labelToItemId.delete(label);
        this.isDirty = true;
    }

    /**
     * Search for k nearest neighbors
     */
    searchKNN(
        queryVector: number[],
        k: number,
        ef?: number
    ): Array<{ id: string; distance: number }> {
        if (!this.index) {
            throw new Error('Index not initialized');
        }
        
        // Validate query vector dimension
        if (this.dimensions !== undefined && queryVector.length !== this.dimensions) {
            throw new Error(`Query vector dimension ${queryVector.length} doesn't match index dimension ${this.dimensions}`);
        }

        // Set search ef parameter for accuracy/speed trade-off
        if (ef) {
            this.index.setEf(ef);
        }

        const result = this.index.searchKnn(queryVector, k);
        
        // Convert labels to item IDs
        const results: Array<{ id: string; distance: number }> = [];
        for (let i = 0; i < result.neighbors.length; i++) {
            const label = result.neighbors[i];
            const itemId = this.labelToItemId.get(label);
            if (itemId) {
                results.push({
                    id: itemId,
                    distance: result.distances[i]
                });
            }
        }

        return results;
    }

    /**
     * Save index to disk
     */
    async save(options: HNSWPersistenceOptions = {}): Promise<void> {
        if (!this.index || !this.dimensions || !this.distanceMetric) {
            throw new Error('Index not initialized');
        }

        // Skip if not dirty and incremental save is enabled
        if (options.incrementalSave && !this.isDirty) {
            return;
        }

        const indexPath = path.join(this.folderPath, this.indexFileName);
        const metadataPath = path.join(this.folderPath, this.metadataFileName);
        const tempIndexPath = `${indexPath}.tmp`;
        const tempMetadataPath = `${metadataPath}.tmp`;

        try {
            // Save HNSW index
            this.index!.writeIndexSync(tempIndexPath);

            // Calculate checksum if enabled
            let checksum: string | undefined;
            if (options.checksumEnabled) {
                const indexData = await fs.readFile(tempIndexPath);
                checksum = crypto.createHash('sha256').update(indexData).digest('hex');
            }

            // Save metadata
            const metadata = {
                dimensions: this.dimensions,
                distanceMetric: this.distanceMetric,
                elementCount: this.itemIdToLabel.size,
                capacity: this.index.getMaxElements(),
                checksum,
                lastSaved: Date.now(),
                nextLabel: this.nextLabel,
                mappings: {
                    itemIdToLabel: Array.from(this.itemIdToLabel.entries()),
                    labelToItemId: Array.from(this.labelToItemId.entries())
                }
            };

            await AtomicOperations.writeFile(tempMetadataPath, JSON.stringify(metadata, null, 2));

            // Atomic rename
            await fs.rename(tempIndexPath, indexPath);
            await fs.rename(tempMetadataPath, metadataPath);

            this.lastSaved = Date.now();
            this.isDirty = false;
        } catch (err) {
            // Clean up temp files on error
            await fs.unlink(tempIndexPath).catch(() => {});
            await fs.unlink(tempMetadataPath).catch(() => {});
            throw err;
        }
    }

    /**
     * Load index from disk
     */
    async load(options: HNSWPersistenceOptions = {}): Promise<void> {
        const indexPath = path.join(this.folderPath, this.indexFileName);
        const metadataPath = path.join(this.folderPath, this.metadataFileName);

        // Check if files exist
        try {
            await fs.access(indexPath);
            await fs.access(metadataPath);
        } catch {
            throw new Error('HNSW index files not found');
        }

        // Load metadata
        const metadataData = await fs.readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(metadataData);

        // Verify checksum if enabled
        if (options.checksumEnabled && metadata.checksum) {
            const indexData = await fs.readFile(indexPath);
            const calculatedChecksum = crypto.createHash('sha256').update(indexData).digest('hex');
            if (calculatedChecksum !== metadata.checksum) {
                throw new Error('HNSW index checksum mismatch');
            }
        }

        // Create index instance
        this.dimensions = metadata.dimensions;
        this.distanceMetric = metadata.distanceMetric;
        this.index = new HierarchicalNSW(this.distanceMetric!, this.dimensions!);

        // Load index data
        this.index!.readIndexSync(indexPath);

        // Restore mappings
        this.itemIdToLabel = new Map(metadata.mappings.itemIdToLabel);
        this.labelToItemId = new Map(metadata.mappings.labelToItemId);
        this.nextLabel = metadata.nextLabel || this.itemIdToLabel.size;
        this.lastSaved = metadata.lastSaved || 0;
        this.isDirty = false;
    }

    /**
     * Build index from items
     */
    async buildFromItems(
        items: Array<{ id: string; vector: number[] }>,
        dimensions: number,
        distanceMetric: DistanceMetric,
        options: HNSWOptions = {},
        progressCallback?: (progress: number) => void
    ): Promise<void> {
        const startTime = Date.now();

        // Initialize with appropriate capacity
        const hnswOptions = {
            ...options,
            maxElements: items.length
        };
        
        await this.initializeIndex(dimensions, distanceMetric, hnswOptions);

        // Add items with progress reporting
        for (let i = 0; i < items.length; i++) {
            await this.addVector(items[i].id, items[i].vector);
            
            if (progressCallback && i % 100 === 0) {
                progressCallback((i / items.length) * 100);
            }
        }

        if (progressCallback) {
            progressCallback(100);
        }

        const buildTime = Date.now() - startTime;
        console.log(`HNSW index built in ${buildTime}ms for ${items.length} items`);
    }

    /**
     * Get index statistics
     */
    async getStats(): Promise<HNSWStats> {
        if (!this.index || !this.dimensions || !this.distanceMetric) {
            // Return empty stats for uninitialized index
            return {
                dimensions: 0,
                distanceMetric: 'cosine' as DistanceMetric,
                elementCount: 0,
                capacity: 0
            };
        }

        let fileSize: number | undefined;
        let checksum: string | undefined;

        try {
            const indexPath = path.join(this.folderPath, this.indexFileName);
            const stats = await fs.stat(indexPath);
            fileSize = stats.size;

            const indexData = await fs.readFile(indexPath);
            checksum = crypto.createHash('sha256').update(indexData).digest('hex');
        } catch {
            // Files might not exist yet
        }

        return {
            dimensions: this.dimensions,
            distanceMetric: this.distanceMetric,
            elementCount: this.itemIdToLabel.size,
            capacity: this.index.getCurrentCount(),
            fileSize,
            checksum,
            lastSaved: this.lastSaved
        };
    }

    /**
     * Optimize index for search performance
     */
    async optimize(ef?: number): Promise<void> {
        if (!this.index) {
            // Nothing to optimize if index not initialized
            return;
        }

        // Set optimal ef for search
        if (ef) {
            this.index.setEf(ef);
        }

        // Force save to persist optimizations
        this.isDirty = true;
        await this.save();
    }

    /**
     * Check if index needs saving
     */
    needsSave(): boolean {
        return this.isDirty;
    }

    /**
     * Check if index is initialized
     */
    isInitialized(): boolean {
        return !!(this.index && this.dimensions && this.distanceMetric);
    }
    
    /**
     * Check if index can accept vectors of given dimension
     */
    canAcceptDimension(dimension: number): boolean {
        if (!this.isInitialized() || this.dimensions === undefined) {
            return true; // Can initialize with any dimension
        }
        return this.dimensions === dimension;
    }
    
    /**
     * Get current dimension
     */
    getDimension(): number | undefined {
        return this.dimensions;
    }

    /**
     * Clear the index
     */
    clear(): void {
        this.index = undefined;
        this.dimensions = undefined;
        this.distanceMetric = 'cosine';
        this.itemIdToLabel.clear();
        this.labelToItemId.clear();
        this.isDirty = false;
        this.lastSaved = 0;
    }

    /**
     * Get current capacity
     */
    getCapacity(): number {
        return this.index?.getMaxElements() || 0;
    }

    /**
     * Resize index capacity
     */
    async resize(newCapacity: number): Promise<void> {
        if (!this.index) {
            throw new Error('Index not initialized');
        }

        this.index.resizeIndex(newCapacity);
        this.isDirty = true;
    }
}

/**
 * Singleton manager for HNSW indices
 */
export class HNSWIndexManager {
    private static instance: HNSWIndexManager;
    private indices: Map<string, HNSWManager> = new Map();

    static getInstance(): HNSWIndexManager {
        if (!HNSWIndexManager.instance) {
            HNSWIndexManager.instance = new HNSWIndexManager();
        }
        return HNSWIndexManager.instance;
    }

    async getIndex(folderPath: string, distanceMetric?: DistanceMetric): Promise<HNSWManager> {
        let index = this.indices.get(folderPath);
        if (!index) {
            index = new HNSWManager(folderPath);
            if (distanceMetric) {
                index.setDistanceMetric(distanceMetric);
            }
            this.indices.set(folderPath, index);
        }
        return index;
    }

    async closeIndex(folderPath: string): Promise<void> {
        const index = this.indices.get(folderPath);
        if (index && index.needsSave()) {
            await index.save();
        }
        this.indices.delete(folderPath);
    }

    async closeAll(): Promise<void> {
        for (const [path, index] of this.indices) {
            if (index.needsSave()) {
                await index.save();
            }
        }
        this.indices.clear();
    }
}

export const hnswIndexManager = HNSWIndexManager.getInstance();