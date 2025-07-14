import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import { AtomicOperations } from './AtomicOperations';
import { IndexItem } from './types';
import * as zlib from 'zlib';

export interface OperationLogEntry {
    operation: 'insert' | 'upsert' | 'delete';
    timestamp?: number;
    item?: IndexItem;
    id?: string;
}

export interface OperationLogOptions {
    maxSize?: number;              // Max log size before rotation (default: 10MB)
    maxAge?: number;               // Max age before rotation (default: 7 days)
    maxFiles?: number;             // Max number of rotated files to keep (default: 5)
    compressionEnabled?: boolean;   // Enable gzip compression for rotated files (default: true)
}

export interface OperationLogStats {
    currentSize: number;
    entryCount: number;
    oldestEntry?: number;
    newestEntry?: number;
    rotatedFiles: number;
}

export interface CompactionResult {
    originalEntries: number;
    compactedEntries: number;
    bytesReclaimed: number;
    duration: number;
}

export class OperationsLog {
    private readonly folderPath: string;
    private readonly logName: string;
    private readonly options: Required<OperationLogOptions>;
    private currentSize: number = 0;
    private entryCount: number = 0;
    private oldestTimestamp?: number;
    private newestTimestamp?: number;

    constructor(folderPath: string, logName: string = 'operations.log', options: OperationLogOptions = {}) {
        this.folderPath = folderPath;
        this.logName = logName;
        this.options = {
            maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB
            maxAge: options.maxAge || 7 * 24 * 60 * 60 * 1000, // 7 days
            maxFiles: options.maxFiles || 5,
            compressionEnabled: options.compressionEnabled !== false
        };
    }

    /**
     * Initialize the operations log
     */
    async initialize(): Promise<void> {
        await this.loadStats();
    }

    /**
     * Append an operation to the log
     */
    async append(entry: OperationLogEntry): Promise<void> {
        // Add timestamp if not provided
        if (entry.timestamp === undefined) {
            entry.timestamp = Date.now();
        }

        // Check if rotation is needed
        if (await this.shouldRotate()) {
            await this.rotate();
        }

        // Append entry
        const logPath = path.join(this.folderPath, this.logName);
        const entryData = JSON.stringify(entry) + '\n';
        await fs.appendFile(logPath, entryData);

        // Update stats
        this.currentSize += Buffer.byteLength(entryData);
        this.entryCount++;
        if (!this.oldestTimestamp) {
            this.oldestTimestamp = entry.timestamp;
        }
        this.newestTimestamp = entry.timestamp;
    }

    /**
     * Read all entries from the log
     */
    async readEntries(): Promise<OperationLogEntry[]> {
        const logPath = path.join(this.folderPath, this.logName);
        
        try {
            const content = await fs.readFile(logPath, 'utf-8');
            return content
                .trim()
                .split('\n')
                .filter(line => line)
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        console.warn(`Invalid log entry: ${line}`);
                        return null;
                    }
                })
                .filter(entry => entry !== null) as OperationLogEntry[];
        } catch (err: any) {
            if (err.code === 'ENOENT') {
                return [];
            }
            throw err;
        }
    }

    /**
     * Compact the operations log
     */
    async compact(): Promise<CompactionResult> {
        const startTime = Date.now();
        const entries = await this.readEntries();
        
        if (entries.length === 0) {
            return {
                originalEntries: 0,
                compactedEntries: 0,
                bytesReclaimed: 0,
                duration: Date.now() - startTime
            };
        }

        // Build final state from operations
        const itemState = new Map<string, IndexItem>();
        const deletedItems = new Set<string>();

        for (const entry of entries) {
            switch (entry.operation) {
                case 'insert':
                case 'upsert':
                    if (entry.item) {
                        itemState.set(entry.item.id, entry.item);
                        deletedItems.delete(entry.item.id);
                    }
                    break;
                case 'delete':
                    if (entry.id) {
                        itemState.delete(entry.id);
                        deletedItems.add(entry.id);
                    }
                    break;
            }
        }

        // Generate compacted entries
        const compactedEntries: OperationLogEntry[] = [];
        
        // Add all current items as inserts
        for (const item of itemState.values()) {
            compactedEntries.push({
                operation: 'insert',
                timestamp: Date.now(),
                item
            });
        }

        // Calculate size before compaction
        const originalSize = this.currentSize;

        // Write compacted log
        const tempPath = path.join(this.folderPath, `${this.logName}.compact`);
        const compactedData = compactedEntries.map(e => JSON.stringify(e)).join('\n') + '\n';
        await AtomicOperations.writeFile(tempPath, compactedData);

        // Replace original with compacted
        const logPath = path.join(this.folderPath, this.logName);
        await fs.rename(tempPath, logPath);

        // Update stats
        const newSize = Buffer.byteLength(compactedData);
        this.currentSize = newSize;
        this.entryCount = compactedEntries.length;
        this.oldestTimestamp = compactedEntries.length > 0 ? Date.now() : undefined;
        this.newestTimestamp = compactedEntries.length > 0 ? Date.now() : undefined;

        return {
            originalEntries: entries.length,
            compactedEntries: compactedEntries.length,
            bytesReclaimed: originalSize - newSize,
            duration: Date.now() - startTime
        };
    }

    /**
     * Rotate the operations log
     */
    async rotate(): Promise<void> {
        const logPath = path.join(this.folderPath, this.logName);
        
        // Check if log exists
        try {
            await fs.access(logPath);
        } catch {
            return; // No log to rotate
        }

        // Find next rotation number
        const rotatedFiles = await this.getRotatedFiles();
        const nextNumber = rotatedFiles.length > 0 
            ? Math.max(...rotatedFiles.map(f => this.extractRotationNumber(f))) + 1 
            : 1;

        // Rotate file
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const rotatedName = `${this.logName}.${nextNumber}.${timestamp}`;
        const rotatedPath = path.join(this.folderPath, rotatedName);

        // Move current log to rotated
        await fs.rename(logPath, rotatedPath);

        // Compress if enabled
        if (this.options.compressionEnabled) {
            await this.compressFile(rotatedPath);
            await fs.unlink(rotatedPath);
        }

        // Clean up old rotated files
        await this.cleanupRotatedFiles();

        // Reset stats
        this.currentSize = 0;
        this.entryCount = 0;
        this.oldestTimestamp = undefined;
        this.newestTimestamp = undefined;
    }

    /**
     * Truncate the operations log
     */
    async truncate(): Promise<void> {
        const logPath = path.join(this.folderPath, this.logName);
        
        try {
            await fs.truncate(logPath);
            this.currentSize = 0;
            this.entryCount = 0;
            this.oldestTimestamp = undefined;
            this.newestTimestamp = undefined;
        } catch (err: any) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
    }

    /**
     * Get statistics about the operations log
     */
    async getStats(): Promise<OperationLogStats> {
        const rotatedFiles = await this.getRotatedFiles();
        
        return {
            currentSize: this.currentSize,
            entryCount: this.entryCount,
            oldestEntry: this.oldestTimestamp,
            newestEntry: this.newestTimestamp,
            rotatedFiles: rotatedFiles.length
        };
    }

    /**
     * Merge multiple operation logs
     */
    static async merge(
        logs: OperationsLog[],
        outputPath: string,
        outputName: string = 'operations.log'
    ): Promise<void> {
        const allEntries: OperationLogEntry[] = [];
        
        // Collect all entries
        for (const log of logs) {
            const entries = await log.readEntries();
            allEntries.push(...entries);
        }

        // Sort by timestamp
        allEntries.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        // Write merged log
        const mergedPath = path.join(outputPath, outputName);
        const mergedData = allEntries.map(e => JSON.stringify(e)).join('\n') + '\n';
        await AtomicOperations.writeFile(mergedPath, mergedData);
    }

    private async loadStats(): Promise<void> {
        const logPath = path.join(this.folderPath, this.logName);
        
        try {
            const stats = await fs.stat(logPath);
            this.currentSize = stats.size;
            
            // Count entries and find timestamps
            const entries = await this.readEntries();
            this.entryCount = entries.length;
            
            if (entries.length > 0) {
                const timestamps = entries
                    .map(e => e.timestamp)
                    .filter(t => t !== undefined) as number[];
                
                if (timestamps.length > 0) {
                    this.oldestTimestamp = Math.min(...timestamps);
                    this.newestTimestamp = Math.max(...timestamps);
                }
            }
        } catch (err: any) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
    }

    private async shouldRotate(): Promise<boolean> {
        // Check size
        if (this.currentSize >= this.options.maxSize) {
            return true;
        }

        // Check age
        if (this.oldestTimestamp) {
            const age = Date.now() - this.oldestTimestamp;
            if (age >= this.options.maxAge) {
                return true;
            }
        }

        return false;
    }

    private async getRotatedFiles(): Promise<string[]> {
        try {
            const files = await fs.readdir(this.folderPath);
            const pattern = new RegExp(`^${this.logName}\\.\\d+\\.`);
            return files
                .filter(f => pattern.test(f))
                .sort((a, b) => {
                    const numA = this.extractRotationNumber(a);
                    const numB = this.extractRotationNumber(b);
                    return numA - numB;
                });
        } catch {
            return [];
        }
    }

    private extractRotationNumber(filename: string): number {
        const match = filename.match(/\.(\d+)\./);
        return match ? parseInt(match[1], 10) : 0;
    }

    private async compressFile(filePath: string): Promise<void> {
        const compressedPath = `${filePath}.gz`;
        
        await pipeline(
            createReadStream(filePath),
            zlib.createGzip(),
            createWriteStream(compressedPath)
        );
    }

    private async cleanupRotatedFiles(): Promise<void> {
        const rotatedFiles = await this.getRotatedFiles();
        
        if (rotatedFiles.length > this.options.maxFiles) {
            const filesToDelete = rotatedFiles.slice(0, rotatedFiles.length - this.options.maxFiles);
            
            for (const file of filesToDelete) {
                const filePath = path.join(this.folderPath, file);
                await fs.unlink(filePath).catch(() => {});
            }
        }
    }
}

/**
 * Operations Log Manager for managing multiple logs
 */
export class OperationsLogManager {
    private logs: Map<string, OperationsLog> = new Map();

    async getLog(
        folderPath: string,
        logName?: string,
        options?: OperationLogOptions
    ): Promise<OperationsLog> {
        const key = `${folderPath}:${logName || 'operations.log'}`;
        
        let log = this.logs.get(key);
        if (!log) {
            log = new OperationsLog(folderPath, logName, options);
            await log.initialize();
            this.logs.set(key, log);
        }
        
        return log;
    }

    async compactAll(): Promise<Map<string, CompactionResult>> {
        const results = new Map<string, CompactionResult>();
        
        for (const [key, log] of this.logs) {
            try {
                const result = await log.compact();
                results.set(key, result);
            } catch (err) {
                console.error(`Error compacting log ${key}:`, err);
            }
        }
        
        return results;
    }

    async rotateAll(): Promise<void> {
        for (const log of this.logs.values()) {
            try {
                await log.rotate();
            } catch (err) {
                console.error('Error rotating log:', err);
            }
        }
    }

    clear(): void {
        this.logs.clear();
    }
}

export const operationsLogManager = new OperationsLogManager();