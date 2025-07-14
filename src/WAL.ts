import * as fs from 'fs/promises';
import * as path from 'path';
import { createWriteStream, createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import * as crypto from 'crypto';
import { AtomicOperations } from './AtomicOperations';
import { lockManager } from './LockManager';

export interface WALEntry {
    id: string;
    timestamp: number;
    operation: 'insert' | 'update' | 'delete';
    data: any;
    checksum?: string;
}

export interface WALOptions {
    maxSize?: number;           // Max WAL file size in bytes (default: 100MB)
    maxAge?: number;            // Max age in ms before rotation (default: 24 hours)
    syncInterval?: number;      // Sync to disk interval in ms (default: 1000ms)
    checksumEnabled?: boolean;  // Enable checksum validation (default: true)
    compressionEnabled?: boolean; // Enable compression (default: false)
}

export interface WALStats {
    currentSize: number;
    entryCount: number;
    oldestEntry: number;
    newestEntry: number;
    rotationCount: number;
}

export class WAL {
    private readonly walPath: string;
    private readonly indexPath: string;
    private readonly options: Required<WALOptions>;
    private writeStream?: NodeJS.WritableStream;
    private currentSize: number = 0;
    private entryCount: number = 0;
    private oldestTimestamp: number = Date.now();
    private rotationCount: number = 0;
    private syncTimer?: NodeJS.Timeout;
    private isClosing: boolean = false;

    constructor(indexPath: string, options: WALOptions = {}) {
        this.indexPath = indexPath;
        this.walPath = path.join(indexPath, 'wal');
        this.options = {
            maxSize: options.maxSize || 100 * 1024 * 1024, // 100MB
            maxAge: options.maxAge || 24 * 60 * 60 * 1000, // 24 hours
            syncInterval: options.syncInterval || 1000, // 1 second
            checksumEnabled: options.checksumEnabled !== false,
            compressionEnabled: options.compressionEnabled || false
        };
    }

    /**
     * Initialize the WAL
     */
    async initialize(): Promise<void> {
        // Create WAL directory if it doesn't exist
        await fs.mkdir(this.walPath, { recursive: true });
        
        // Load existing WAL files
        await this.loadExistingWAL();
        
        // Start write stream
        await this.startWriteStream();
        
        // Start sync timer
        this.startSyncTimer();
    }

    /**
     * Close the WAL
     */
    async close(): Promise<void> {
        this.isClosing = true;
        
        // Stop sync timer
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = undefined;
        }
        
        // Close write stream
        if (this.writeStream) {
            await new Promise<void>((resolve) => {
                this.writeStream!.end(() => resolve());
            });
            this.writeStream = undefined;
        }
    }

    /**
     * Write an entry to the WAL
     */
    async writeEntry(entry: Omit<WALEntry, 'checksum'>): Promise<void> {
        if (this.isClosing) {
            throw new Error('WAL is closing');
        }

        // Add checksum if enabled
        const fullEntry: WALEntry = {
            ...entry,
            checksum: this.options.checksumEnabled ? this.calculateChecksum(entry) : undefined
        };

        // Check if rotation is needed
        if (await this.shouldRotate()) {
            await this.rotate();
        }

        // Write entry
        const entryData = JSON.stringify(fullEntry) + '\n';
        const entryBuffer = Buffer.from(entryData);
        
        await new Promise<void>((resolve, reject) => {
            this.writeStream!.write(entryBuffer, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Update stats
        this.currentSize += entryBuffer.length;
        this.entryCount++;
        if (this.entryCount === 1) {
            this.oldestTimestamp = entry.timestamp;
        }
    }

    /**
     * Read all entries from the WAL
     */
    async readEntries(): Promise<WALEntry[]> {
        const entries: WALEntry[] = [];
        const walFiles = await this.getWALFiles();

        for (const file of walFiles) {
            const filePath = path.join(this.walPath, file);
            const fileEntries = await this.readWALFile(filePath);
            entries.push(...fileEntries);
        }

        return entries;
    }

    /**
     * Replay WAL entries
     */
    async replay(handler: (entry: WALEntry) => Promise<void>): Promise<number> {
        const entries = await this.readEntries();
        let replayedCount = 0;

        for (const entry of entries) {
            try {
                // Validate checksum if enabled
                if (this.options.checksumEnabled && entry.checksum) {
                    const calculated = this.calculateChecksum({
                        id: entry.id,
                        timestamp: entry.timestamp,
                        operation: entry.operation,
                        data: entry.data
                    });
                    if (calculated !== entry.checksum) {
                        console.warn(`Checksum mismatch for entry ${entry.id}, skipping`);
                        continue;
                    }
                }

                await handler(entry);
                replayedCount++;
            } catch (err) {
                console.error(`Error replaying entry ${entry.id}:`, err);
            }
        }

        return replayedCount;
    }

    /**
     * Checkpoint the WAL (mark entries as committed)
     */
    async checkpoint(): Promise<void> {
        const checkpointFile = path.join(this.walPath, 'checkpoint');
        const checkpoint = {
            timestamp: Date.now(),
            lastEntry: this.entryCount,
            rotationCount: this.rotationCount
        };
        
        await AtomicOperations.writeFile(checkpointFile, JSON.stringify(checkpoint));
    }

    /**
     * Clean up old WAL files
     */
    async cleanup(keepFiles: number = 2): Promise<number> {
        const walFiles = await this.getWALFiles();
        const filesToDelete = walFiles.slice(0, Math.max(0, walFiles.length - keepFiles));
        
        for (const file of filesToDelete) {
            await fs.unlink(path.join(this.walPath, file));
        }
        
        return filesToDelete.length;
    }

    /**
     * Get WAL statistics
     */
    getStats(): WALStats {
        return {
            currentSize: this.currentSize,
            entryCount: this.entryCount,
            oldestEntry: this.oldestTimestamp,
            newestEntry: Date.now(),
            rotationCount: this.rotationCount
        };
    }

    /**
     * Force sync to disk
     */
    async sync(): Promise<void> {
        if (this.writeStream && 'fd' in this.writeStream) {
            await new Promise<void>((resolve, reject) => {
                (this.writeStream as any).fd.sync((err: any) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    }

    private async loadExistingWAL(): Promise<void> {
        const walFiles = await this.getWALFiles();
        if (walFiles.length === 0) return;

        // Get the latest WAL file
        const latestFile = walFiles[walFiles.length - 1];
        const filePath = path.join(this.walPath, latestFile);
        
        try {
            const stats = await fs.stat(filePath);
            this.currentSize = stats.size;
            
            // Count entries in the latest file
            const entries = await this.readWALFile(filePath);
            this.entryCount = entries.length;
            if (entries.length > 0) {
                this.oldestTimestamp = entries[0].timestamp;
            }
            
            // Extract rotation count from filename
            const match = latestFile.match(/wal\.(\d+)\.log/);
            if (match) {
                this.rotationCount = parseInt(match[1], 10);
            }
        } catch (err) {
            console.error('Error loading existing WAL:', err);
        }
    }

    private async startWriteStream(): Promise<void> {
        const filename = `wal.${this.rotationCount}.log`;
        const filePath = path.join(this.walPath, filename);
        
        this.writeStream = createWriteStream(filePath, {
            flags: 'a', // Append mode
            highWaterMark: 64 * 1024 // 64KB buffer
        });
        
        this.writeStream.on('error', (err) => {
            console.error('WAL write stream error:', err);
        });
    }

    private startSyncTimer(): void {
        this.syncTimer = setInterval(async () => {
            try {
                await this.sync();
            } catch (err) {
                console.error('WAL sync error:', err);
            }
        }, this.options.syncInterval);
    }

    private async shouldRotate(): Promise<boolean> {
        // Check size
        if (this.currentSize >= this.options.maxSize) {
            return true;
        }
        
        // Check age
        const age = Date.now() - this.oldestTimestamp;
        if (age >= this.options.maxAge) {
            return true;
        }
        
        return false;
    }

    private async rotate(): Promise<void> {
        // Close current stream
        if (this.writeStream) {
            await new Promise<void>((resolve) => {
                this.writeStream!.end(() => resolve());
            });
        }
        
        // Increment rotation count
        this.rotationCount++;
        
        // Reset stats
        this.currentSize = 0;
        this.entryCount = 0;
        this.oldestTimestamp = Date.now();
        
        // Start new stream
        await this.startWriteStream();
    }

    private async getWALFiles(): Promise<string[]> {
        try {
            const files = await fs.readdir(this.walPath);
            return files
                .filter(f => f.match(/^wal\.\d+\.log$/))
                .sort((a, b) => {
                    const aNum = parseInt(a.match(/wal\.(\d+)\.log/)![1], 10);
                    const bNum = parseInt(b.match(/wal\.(\d+)\.log/)![1], 10);
                    return aNum - bNum;
                });
        } catch (err) {
            return [];
        }
    }

    private async readWALFile(filePath: string): Promise<WALEntry[]> {
        const entries: WALEntry[] = [];
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.trim().split('\n');
        
        for (const line of lines) {
            if (!line) continue;
            try {
                const entry = JSON.parse(line);
                entries.push(entry);
            } catch (err) {
                console.warn(`Invalid WAL entry: ${line}`);
            }
        }
        
        return entries;
    }

    private calculateChecksum(entry: Omit<WALEntry, 'checksum'>): string {
        const data = JSON.stringify({
            id: entry.id,
            timestamp: entry.timestamp,
            operation: entry.operation,
            data: entry.data
        });
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

/**
 * WAL Manager for managing multiple WALs
 */
export class WALManager {
    private static instance: WALManager;
    private wals: Map<string, WAL> = new Map();

    static getInstance(): WALManager {
        if (!WALManager.instance) {
            WALManager.instance = new WALManager();
        }
        return WALManager.instance;
    }

    async getWAL(indexPath: string, options?: WALOptions): Promise<WAL> {
        const existingWAL = this.wals.get(indexPath);
        if (existingWAL) {
            return existingWAL;
        }

        const wal = new WAL(indexPath, options);
        await wal.initialize();
        this.wals.set(indexPath, wal);
        return wal;
    }

    async closeWAL(indexPath: string): Promise<void> {
        const wal = this.wals.get(indexPath);
        if (wal) {
            await wal.close();
            this.wals.delete(indexPath);
        }
    }

    async closeAll(): Promise<void> {
        const closePromises = Array.from(this.wals.values()).map(wal => wal.close());
        await Promise.all(closePromises);
        this.wals.clear();
    }
}

export const walManager = WALManager.getInstance();