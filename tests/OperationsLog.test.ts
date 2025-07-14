import { expect } from 'chai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { OperationsLog, operationsLogManager } from '../lib/OperationsLog';
import { LocalIndex } from '../lib/LocalIndex';
import { v4 as uuidv4 } from 'uuid';

describe('Operations Log Compaction and Rotation', () => {
    const testDir = './test-operations-log';
    
    beforeEach(async () => {
        await fs.rm(testDir, { recursive: true }).catch(() => {});
        await fs.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        operationsLogManager.clear();
        await fs.rm(testDir, { recursive: true }).catch(() => {});
    });

    describe('OperationsLog Core', () => {
        it('should append and read entries', async () => {
            const log = new OperationsLog(testDir);
            await log.initialize();
            
            // Append entries
            await log.append({
                operation: 'insert',
                item: {
                    id: 'item-1',
                    vector: [1, 2, 3],
                    norm: 1,
                    metadata: { test: 'value' }
                }
            });
            
            await log.append({
                operation: 'delete',
                id: 'item-2'
            });
            
            // Read entries
            const entries = await log.readEntries();
            expect(entries).to.have.lengthOf(2);
            expect(entries[0].operation).to.equal('insert');
            expect(entries[0].item?.id).to.equal('item-1');
            expect(entries[1].operation).to.equal('delete');
            expect(entries[1].id).to.equal('item-2');
        });

        it('should compact operations log', async () => {
            const log = new OperationsLog(testDir);
            await log.initialize();
            
            // Add operations including overwrites
            await log.append({
                operation: 'insert',
                item: { id: 'item-1', vector: [1, 1], norm: 1, metadata: { v: 1 } }
            });
            
            await log.append({
                operation: 'insert',
                item: { id: 'item-2', vector: [2, 2], norm: 1, metadata: { v: 1 } }
            });
            
            await log.append({
                operation: 'upsert',
                item: { id: 'item-1', vector: [1, 2], norm: 1, metadata: { v: 2 } }
            });
            
            await log.append({
                operation: 'delete',
                id: 'item-2'
            });
            
            await log.append({
                operation: 'insert',
                item: { id: 'item-3', vector: [3, 3], norm: 1, metadata: { v: 1 } }
            });
            
            // Compact
            const result = await log.compact();
            expect(result.originalEntries).to.equal(5);
            expect(result.compactedEntries).to.equal(2); // item-1 and item-3
            expect(result.bytesReclaimed).to.be.greaterThan(0);
            
            // Verify compacted state
            const entries = await log.readEntries();
            expect(entries).to.have.lengthOf(2);
            
            const ids = entries.map(e => e.item?.id).sort();
            expect(ids).to.deep.equal(['item-1', 'item-3']);
            
            // Verify item-1 has latest value
            const item1 = entries.find(e => e.item?.id === 'item-1');
            expect(item1?.item?.metadata.v).to.equal(2);
        });

        it('should rotate log based on size', async () => {
            const log = new OperationsLog(testDir, 'operations.log', {
                maxSize: 1024 // 1KB
            });
            await log.initialize();
            
            // Add entries until rotation
            for (let i = 0; i < 50; i++) {
                await log.append({
                    operation: 'insert',
                    item: {
                        id: `item-${i}`,
                        vector: Array(10).fill(i),
                        norm: 1,
                        metadata: { 
                            data: 'x'.repeat(50) // Make entries larger
                        }
                    }
                });
            }
            
            // Check rotated files exist
            const files = await fs.readdir(testDir);
            const rotatedFiles = files.filter(f => f.match(/^operations\.log\.\d+\./));
            expect(rotatedFiles.length).to.be.greaterThan(0);
            
            // Current log should be small
            const stats = await log.getStats();
            expect(stats.currentSize).to.be.lessThan(1024);
            expect(stats.rotatedFiles).to.be.greaterThan(0);
        });

        it('should handle compressed rotated files', async () => {
            const log = new OperationsLog(testDir, 'operations.log', {
                maxSize: 512,
                compressionEnabled: true
            });
            await log.initialize();
            
            // Force rotation
            for (let i = 0; i < 20; i++) {
                await log.append({
                    operation: 'insert',
                    item: {
                        id: `item-${i}`,
                        vector: [i, i, i],
                        norm: 1,
                        metadata: { data: 'x'.repeat(50) }
                    }
                });
            }
            
            // Check for .gz files
            const files = await fs.readdir(testDir);
            const gzFiles = files.filter(f => f.endsWith('.gz'));
            expect(gzFiles.length).to.be.greaterThan(0);
        });

        it('should cleanup old rotated files', async () => {
            const log = new OperationsLog(testDir, 'operations.log', {
                maxSize: 256,
                maxFiles: 2
            });
            await log.initialize();
            
            // Force multiple rotations
            for (let i = 0; i < 100; i++) {
                await log.append({
                    operation: 'insert',
                    item: {
                        id: `item-${i}`,
                        vector: [i],
                        norm: 1,
                        metadata: { data: 'x'.repeat(20) }
                    }
                });
            }
            
            // Should only keep maxFiles rotated files
            const files = await fs.readdir(testDir);
            const rotatedFiles = files.filter(f => f.match(/^operations\.log\.\d+\./));
            expect(rotatedFiles.length).to.be.lessThanOrEqual(2);
        });

        it('should merge multiple logs', async () => {
            // Create directories
            await fs.mkdir(path.join(testDir, 'log1'), { recursive: true });
            await fs.mkdir(path.join(testDir, 'log2'), { recursive: true });
            
            // Create multiple logs with high max size to prevent rotation
            const log1 = new OperationsLog(path.join(testDir, 'log1'), 'operations.log', {
                maxSize: 100 * 1024 * 1024 // 100MB
            });
            const log2 = new OperationsLog(path.join(testDir, 'log2'), 'operations.log', {
                maxSize: 100 * 1024 * 1024 // 100MB
            });
            
            await log1.initialize();
            await log2.initialize();
            
            // Use recent timestamps to avoid age-based rotation
            const baseTime = Date.now();
            
            // Add entries to log1
            await log1.append({
                operation: 'insert',
                timestamp: baseTime + 1000,
                item: { id: 'item-1', vector: [1], norm: 1, metadata: {} }
            });
            
            await log1.append({
                operation: 'insert',
                timestamp: baseTime + 3000,
                item: { id: 'item-3', vector: [3], norm: 1, metadata: {} }
            });
            
            // Add entries to log2
            await log2.append({
                operation: 'insert',
                timestamp: baseTime + 2000,
                item: { id: 'item-2', vector: [2], norm: 1, metadata: {} }
            });
            
            await log2.append({
                operation: 'insert',
                timestamp: baseTime + 4000,
                item: { id: 'item-4', vector: [4], norm: 1, metadata: {} }
            });
            
            // Merge logs
            const outputPath = path.join(testDir, 'merged');
            await fs.mkdir(outputPath);
            await OperationsLog.merge([log1, log2], outputPath);
            
            // Verify individual logs have entries first
            const log1Entries = await log1.readEntries();
            const log2Entries = await log2.readEntries();
            
            // Debug output
            if (log1Entries.length !== 2 || log2Entries.length !== 2) {
                console.log('log1Entries:', log1Entries);
                console.log('log2Entries:', log2Entries);
            }
            
            expect(log1Entries).to.have.lengthOf(2);
            expect(log2Entries).to.have.lengthOf(2);
            
            // Read merged log
            const mergedLog = new OperationsLog(outputPath);
            await mergedLog.initialize();
            const entries = await mergedLog.readEntries();
            
            expect(entries).to.have.lengthOf(4);
            
            // Should be sorted by timestamp
            const ids = entries.map(e => e.item?.id);
            expect(ids).to.deep.equal(['item-1', 'item-2', 'item-3', 'item-4']);
        });
    });

    describe('LocalIndex Integration', () => {
        it('should use operations log for tracking operations', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({
                version: 1,
                operationLogOptions: {
                    maxSize: 5 * 1024 * 1024 // 5MB
                }
            });
            
            // Add items
            for (let i = 0; i < 10; i++) {
                await index.insertItem({
                    vector: Array(5).fill(i),
                    metadata: { index: i }
                });
            }
            
            // Update item
            await index.upsertItem({
                id: (await index.listItems())[0].id,
                vector: [99, 99, 99, 99, 99],
                metadata: { index: 99 }
            });
            
            // Delete item
            await index.deleteItem((await index.listItems())[1].id);
            
            // Get log stats
            const stats = await index.getOperationsLogStats();
            expect(stats.entryCount).to.equal(12); // 10 inserts + 1 upsert + 1 delete
            expect(stats.currentSize).to.be.greaterThan(0);
        });

        it('should compact operations log', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            // Add and modify items
            const items = [];
            for (let i = 0; i < 5; i++) {
                const item = await index.insertItem({
                    vector: [i, i, i],
                    metadata: { v: 1 }
                });
                items.push(item);
            }
            
            // Update items
            for (let i = 0; i < 3; i++) {
                await index.upsertItem({
                    id: items[i].id,
                    vector: [i * 2, i * 2, i * 2],
                    metadata: { v: 2 }
                });
            }
            
            // Delete some
            await index.deleteItem(items[3].id);
            await index.deleteItem(items[4].id);
            
            // Compact log
            const result = await index.compactOperationsLog();
            expect(result.originalEntries).to.equal(10); // 5 inserts + 3 updates + 2 deletes
            expect(result.compactedEntries).to.equal(3); // Only 3 items remain
            
            // Verify index still works
            const remainingItems = await index.listItems();
            expect(remainingItems).to.have.lengthOf(3);
        });

        it('should handle log rotation', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({
                version: 1,
                operationLogOptions: {
                    maxSize: 1024 // 1KB for quick rotation
                }
            });
            
            // Add many items to force rotation
            for (let i = 0; i < 50; i++) {
                await index.insertItem({
                    vector: Array(10).fill(i),
                    metadata: {
                        index: i,
                        data: 'x'.repeat(50)
                    }
                });
            }
            
            // Check stats
            const stats = await index.getOperationsLogStats();
            expect(stats.rotatedFiles).to.be.greaterThan(0);
            
            // Manual rotation
            await index.rotateOperationsLog();
            const newStats = await index.getOperationsLogStats();
            expect(newStats.rotatedFiles).to.be.greaterThanOrEqual(stats.rotatedFiles);
            expect(newStats.currentSize).to.equal(0);
            expect(newStats.entryCount).to.equal(0);
        });

        it('should recover from operations log after crash', async () => {
            // Create index and add items
            let index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            const items = [];
            for (let i = 0; i < 10; i++) {
                const item = await index.insertItem({
                    vector: Array(3).fill(i),
                    metadata: { index: i }
                });
                items.push(item);
            }
            
            // Simulate crash - create new instance without proper shutdown
            index = new LocalIndex(testDir);
            
            // Should recover from operations log
            const recoveredItems = await index.listItems();
            expect(recoveredItems).to.have.lengthOf(10);
            
            // Verify items match
            for (let i = 0; i < 10; i++) {
                const item = await index.getItem(items[i].id);
                expect(item).to.exist;
                expect(item!.metadata.index).to.equal(i);
            }
        });

        it('should handle operations log with external metadata', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({
                version: 1,
                metadata_config: {
                    indexed: ['type']
                }
            });
            
            // Add items with large metadata
            for (let i = 0; i < 5; i++) {
                await index.insertItem({
                    vector: [i, i, i],
                    metadata: {
                        type: 'doc',
                        content: 'x'.repeat(1000),
                        data: Array(100).fill(`item-${i}`)
                    }
                });
            }
            
            // Compact log
            const result = await index.compactOperationsLog();
            expect(result.compactedEntries).to.equal(5);
            
            // Verify metadata files still work
            const items = await index.listItems();
            for (const item of items) {
                const fullItem = await index.getItem(item.id);
                expect(fullItem!.metadata.content).to.equal('x'.repeat(1000));
                expect(fullItem!.metadata.data).to.have.lengthOf(100);
            }
        });

        it('should integrate compaction with index compact', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            // Add operations
            for (let i = 0; i < 20; i++) {
                if (i % 3 === 0) {
                    await index.insertItem({
                        vector: [i, i],
                        metadata: { i }
                    });
                } else if (i % 3 === 1) {
                    const items = await index.listItems();
                    if (items.length > 0) {
                        await index.upsertItem({
                            id: items[0].id,
                            vector: [i * 2, i * 2],
                            metadata: { i: i * 2 }
                        });
                    }
                } else {
                    const items = await index.listItems();
                    if (items.length > 1) {
                        await index.deleteItem(items[1].id);
                    }
                }
            }
            
            // Run index compact (which includes log compaction)
            const cleanupStats = await index.compact();
            
            // Verify operations log was compacted
            const logStats = await index.getOperationsLogStats();
            expect(logStats.entryCount).to.be.lessThan(20);
        });
    });

    describe('Operations Log Manager', () => {
        it('should manage multiple logs', async () => {
            // Create directories first
            await fs.mkdir(path.join(testDir, 'index1'), { recursive: true });
            await fs.mkdir(path.join(testDir, 'index2'), { recursive: true });
            
            const log1 = await operationsLogManager.getLog(
                path.join(testDir, 'index1')
            );
            const log2 = await operationsLogManager.getLog(
                path.join(testDir, 'index2')
            );
            
            // Add entries to different logs
            await log1.append({
                operation: 'insert',
                item: { id: '1', vector: [1], norm: 1, metadata: {} }
            });
            
            await log2.append({
                operation: 'insert',
                item: { id: '2', vector: [2], norm: 1, metadata: {} }
            });
            
            // Compact all
            const results = await operationsLogManager.compactAll();
            expect(results.size).to.equal(2);
            
            for (const [key, result] of results) {
                expect(result.compactedEntries).to.equal(1);
            }
        });

        it('should return same log instance', async () => {
            const path1 = path.join(testDir, 'test');
            const log1 = await operationsLogManager.getLog(path1);
            const log2 = await operationsLogManager.getLog(path1);
            
            expect(log1).to.equal(log2);
        });
    });
});