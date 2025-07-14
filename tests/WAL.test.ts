import { expect } from 'chai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WAL, WALEntry, walManager } from '../lib/WAL';
import { LocalIndex } from '../lib/LocalIndex';
import { v4 as uuidv4 } from 'uuid';

describe('Write-Ahead Logging (WAL)', () => {
    const testDir = './test-wal-index';
    const walDir = path.join(testDir, 'wal');
    
    beforeEach(async () => {
        await fs.rm(testDir, { recursive: true }).catch(() => {});
    });

    afterEach(async () => {
        await walManager.closeAll();
        await fs.rm(testDir, { recursive: true }).catch(() => {});
    });

    describe('WAL Core Operations', () => {
        it('should initialize WAL and write entries', async () => {
            const wal = new WAL(testDir);
            await wal.initialize();
            
            // Write entries
            const entry1: WALEntry = {
                id: 'item-1',
                timestamp: Date.now(),
                operation: 'insert',
                data: { id: 'item-1', value: 'test1' }
            };
            
            const entry2: WALEntry = {
                id: 'item-2',
                timestamp: Date.now(),
                operation: 'update',
                data: { id: 'item-2', value: 'test2' }
            };
            
            await wal.writeEntry(entry1);
            await wal.writeEntry(entry2);
            
            // Read entries
            const entries = await wal.readEntries();
            expect(entries).to.have.lengthOf(2);
            expect(entries[0].id).to.equal('item-1');
            expect(entries[1].id).to.equal('item-2');
            
            await wal.close();
        });

        it('should handle checksum validation', async () => {
            const wal = new WAL(testDir, { checksumEnabled: true });
            await wal.initialize();
            
            const entry: WALEntry = {
                id: 'checksum-test',
                timestamp: Date.now(),
                operation: 'insert',
                data: { test: 'data' }
            };
            
            await wal.writeEntry(entry);
            
            // Read and verify checksum is added
            const entries = await wal.readEntries();
            expect(entries[0].checksum).to.exist;
            expect(entries[0].checksum).to.be.a('string');
            expect(entries[0].checksum).to.have.length(64); // SHA256 hex length
            
            await wal.close();
        });

        it('should rotate WAL files based on size', async () => {
            const wal = new WAL(testDir, { maxSize: 1024 }); // 1KB max
            await wal.initialize();
            
            // Write entries until rotation happens
            for (let i = 0; i < 50; i++) {
                await wal.writeEntry({
                    id: `item-${i}`,
                    timestamp: Date.now(),
                    operation: 'insert',
                    data: { id: `item-${i}`, value: 'x'.repeat(50) }
                });
            }
            
            // Check that multiple WAL files exist
            const files = await fs.readdir(walDir);
            const walFiles = files.filter(f => f.match(/^wal\.\d+\.log$/));
            expect(walFiles.length).to.be.greaterThan(1);
            
            await wal.close();
        });

        it('should replay entries in correct order', async () => {
            const wal = new WAL(testDir);
            await wal.initialize();
            
            // Write mixed operations
            await wal.writeEntry({
                id: 'item-1',
                timestamp: 1000,
                operation: 'insert',
                data: { id: 'item-1', value: 'initial' }
            });
            
            await wal.writeEntry({
                id: 'item-1',
                timestamp: 2000,
                operation: 'update',
                data: { id: 'item-1', value: 'updated' }
            });
            
            await wal.writeEntry({
                id: 'item-1',
                timestamp: 3000,
                operation: 'delete',
                data: { id: 'item-1' }
            });
            
            // Replay and track operations
            const operations: string[] = [];
            await wal.replay(async (entry) => {
                operations.push(entry.operation);
            });
            
            expect(operations).to.deep.equal(['insert', 'update', 'delete']);
            
            await wal.close();
        });

        it('should handle checkpoint operations', async () => {
            const wal = new WAL(testDir);
            await wal.initialize();
            
            // Write entries
            for (let i = 0; i < 5; i++) {
                await wal.writeEntry({
                    id: `item-${i}`,
                    timestamp: Date.now(),
                    operation: 'insert',
                    data: { id: `item-${i}` }
                });
            }
            
            // Create checkpoint
            await wal.checkpoint();
            
            // Verify checkpoint file exists
            const checkpointPath = path.join(walDir, 'checkpoint');
            const checkpointExists = await fs.access(checkpointPath).then(() => true).catch(() => false);
            expect(checkpointExists).to.be.true;
            
            const checkpoint = JSON.parse(await fs.readFile(checkpointPath, 'utf-8'));
            expect(checkpoint.lastEntry).to.equal(5);
            
            await wal.close();
        });

        it('should cleanup old WAL files', async () => {
            const wal = new WAL(testDir, { maxSize: 512 }); // Small size to force rotations
            await wal.initialize();
            
            // Force multiple rotations
            for (let i = 0; i < 100; i++) {
                await wal.writeEntry({
                    id: `item-${i}`,
                    timestamp: Date.now(),
                    operation: 'insert',
                    data: { id: `item-${i}`, value: 'x'.repeat(50) }
                });
            }
            
            // Get file count before cleanup
            let files = await fs.readdir(walDir);
            const beforeCount = files.filter(f => f.match(/^wal\.\d+\.log$/)).length;
            expect(beforeCount).to.be.greaterThan(2);
            
            // Cleanup keeping only 2 files
            const deleted = await wal.cleanup(2);
            expect(deleted).to.be.greaterThan(0);
            
            // Verify only 2 files remain
            files = await fs.readdir(walDir);
            const afterCount = files.filter(f => f.match(/^wal\.\d+\.log$/)).length;
            expect(afterCount).to.equal(2);
            
            await wal.close();
        });
    });

    describe('LocalIndex WAL Integration', () => {
        it('should create index with WAL enabled', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({
                version: 1,
                wal: true,
                walOptions: {
                    syncInterval: 100
                }
            });
            
            // Verify WAL directory created
            const walExists = await fs.access(walDir).then(() => true).catch(() => false);
            expect(walExists).to.be.true;
            
            // Insert items
            const item1 = await index.insertItem({
                vector: [1, 2, 3],
                metadata: { test: 'value1' }
            });
            
            const item2 = await index.insertItem({
                vector: [4, 5, 6],
                metadata: { test: 'value2' }
            });
            
            // Verify WAL contains entries
            const wal = await walManager.getWAL(testDir);
            const entries = await wal.readEntries();
            expect(entries.length).to.be.at.least(2);
            
            await index.close();
        });

        it('should recover from WAL after crash', async () => {
            // Create index and add items
            let index = new LocalIndex(testDir);
            await index.createIndex({
                version: 1,
                wal: true
            });
            
            const items = [];
            for (let i = 0; i < 10; i++) {
                const item = await index.insertItem({
                    vector: Array(5).fill(i),
                    metadata: { index: i }
                });
                items.push(item);
            }
            
            // Simulate crash - close without proper shutdown
            // Don't call endUpdate or close
            
            // Create new index instance and recover
            index = new LocalIndex(testDir);
            const recovered = await index.recoverFromWAL();
            expect(recovered).to.equal(10);
            
            // Verify all items recovered
            const allItems = await index.listItems();
            expect(allItems).to.have.lengthOf(10);
            
            for (let i = 0; i < 10; i++) {
                const item = await index.getItem(items[i].id);
                expect(item).to.exist;
                expect(item!.metadata.index).to.equal(i);
            }
            
            await index.close();
        });

        it('should handle mixed operations in WAL', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({
                version: 1,
                wal: true
            });
            
            // Insert items
            const item1 = await index.insertItem({
                vector: [1, 1, 1],
                metadata: { name: 'item1' }
            });
            
            const item2 = await index.insertItem({
                vector: [2, 2, 2],
                metadata: { name: 'item2' }
            });
            
            // Update item1
            await index.upsertItem({
                id: item1.id,
                vector: [1.5, 1.5, 1.5],
                metadata: { name: 'item1-updated' }
            });
            
            // Delete item2
            await index.deleteItem(item2.id);
            
            // Insert item3
            const item3 = await index.insertItem({
                vector: [3, 3, 3],
                metadata: { name: 'item3' }
            });
            
            // Simulate crash and recover
            await index.close();
            const newIndex = new LocalIndex(testDir);
            await newIndex.recoverFromWAL();
            
            // Verify final state
            const items = await newIndex.listItems();
            expect(items).to.have.lengthOf(2);
            
            const recoveredItem1 = await newIndex.getItem(item1.id);
            expect(recoveredItem1!.metadata.name).to.equal('item1-updated');
            expect(recoveredItem1!.vector).to.deep.equal([1.5, 1.5, 1.5]);
            
            const recoveredItem2 = await newIndex.getItem(item2.id);
            expect(recoveredItem2).to.be.undefined;
            
            const recoveredItem3 = await newIndex.getItem(item3.id);
            expect(recoveredItem3!.metadata.name).to.equal('item3');
            
            await newIndex.close();
        });

        it('should get WAL statistics', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({
                version: 1,
                wal: true
            });
            
            // Add some items
            for (let i = 0; i < 5; i++) {
                await index.insertItem({
                    vector: [i, i, i],
                    metadata: { index: i }
                });
            }
            
            // Get stats
            const stats = await index.getWALStats();
            expect(stats.entryCount).to.equal(5);
            expect(stats.currentSize).to.be.greaterThan(0);
            expect(stats.rotationCount).to.equal(0);
            
            await index.close();
        });

        it('should cleanup WAL files', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({
                version: 1,
                wal: true,
                walOptions: {
                    maxSize: 1024 // Small size to force rotation
                }
            });
            
            // Add many items to force rotation
            for (let i = 0; i < 50; i++) {
                await index.insertItem({
                    vector: Array(10).fill(i),
                    metadata: { 
                        index: i,
                        data: 'x'.repeat(100)
                    }
                });
            }
            
            // Cleanup old WAL files
            const cleaned = await index.cleanupWAL(1);
            expect(cleaned).to.be.greaterThan(0);
            
            // Verify index still works
            const items = await index.listItems();
            expect(items).to.have.lengthOf(50);
            
            await index.close();
        });

        it('should handle WAL with external metadata files', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({
                version: 1,
                wal: true,
                metadata_config: {
                    indexed: ['id']
                }
            });
            
            // Insert item with large metadata
            const largeMetadata = {
                id: 'test-1',
                content: 'x'.repeat(5000),
                array: Array(100).fill('data')
            };
            
            const item = await index.insertItem({
                vector: [1, 2, 3, 4, 5],
                metadata: largeMetadata
            });
            
            // Simulate crash and recover
            await index.close();
            const newIndex = new LocalIndex(testDir);
            const recovered = await newIndex.recoverFromWAL();
            expect(recovered).to.equal(1);
            
            // Verify metadata recovered correctly
            const recoveredItem = await newIndex.getItem(item.id);
            expect(recoveredItem).to.exist;
            expect(recoveredItem!.metadata.content).to.equal(largeMetadata.content);
            expect(recoveredItem!.metadata.array).to.deep.equal(largeMetadata.array);
            
            await newIndex.close();
        });
    });

    describe('WAL Error Handling', () => {
        it('should handle corrupt WAL entries', async () => {
            const wal = new WAL(testDir);
            await wal.initialize();
            
            // Write valid entry
            await wal.writeEntry({
                id: 'valid-1',
                timestamp: Date.now(),
                operation: 'insert',
                data: { id: 'valid-1' }
            });
            
            // Manually write corrupt entry
            const walFile = path.join(walDir, 'wal.0.log');
            await fs.appendFile(walFile, 'corrupt data\n');
            
            // Write another valid entry
            await wal.writeEntry({
                id: 'valid-2',
                timestamp: Date.now(),
                operation: 'insert',
                data: { id: 'valid-2' }
            });
            
            // Close and reinitialize
            await wal.close();
            const newWal = new WAL(testDir);
            await newWal.initialize();
            
            // Read entries - should skip corrupt entry
            const entries = await newWal.readEntries();
            expect(entries).to.have.lengthOf(2);
            expect(entries[0].id).to.equal('valid-1');
            expect(entries[1].id).to.equal('valid-2');
            
            await newWal.close();
        });

        it('should handle checksum mismatch during replay', async () => {
            const wal = new WAL(testDir, { checksumEnabled: true });
            await wal.initialize();
            
            // Write entries with checksums
            await wal.writeEntry({
                id: 'item-1',
                timestamp: Date.now(),
                operation: 'insert',
                data: { id: 'item-1', value: 'test' }
            });
            
            await wal.close();
            
            // Manually corrupt the data
            const walFile = path.join(walDir, 'wal.0.log');
            let content = await fs.readFile(walFile, 'utf-8');
            const entry = JSON.parse(content.trim());
            entry.data.value = 'corrupted';
            await fs.writeFile(walFile, JSON.stringify(entry) + '\n');
            
            // Try to replay
            const newWal = new WAL(testDir, { checksumEnabled: true });
            await newWal.initialize();
            
            let replayedCount = 0;
            await newWal.replay(async (entry) => {
                replayedCount++;
            });
            
            // Should skip entry with bad checksum
            expect(replayedCount).to.equal(0);
            
            await newWal.close();
        });
    });
});