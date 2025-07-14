import { expect } from 'chai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { HNSWManager, hnswIndexManager } from '../lib/HNSWManager';
import { LocalIndex } from '../lib/LocalIndex';
import { v4 as uuidv4 } from 'uuid';

describe('HNSW Index Optimization', () => {
    const testDir = './test-hnsw-index';
    
    beforeEach(async () => {
        await fs.rm(testDir, { recursive: true }).catch(() => {});
        await fs.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        await hnswIndexManager.closeAll();
        await fs.rm(testDir, { recursive: true }).catch(() => {});
    });

    describe('HNSWManager Core', () => {
        it('should initialize and build index', async () => {
            const manager = new HNSWManager(testDir);
            await manager.initializeIndex(5, 'cosine', {
                M: 16,
                efConstruction: 200,
                maxElements: 100
            });
            
            // Add vectors
            await manager.addVector('item-1', [1, 2, 3, 4, 5]);
            await manager.addVector('item-2', [2, 3, 4, 5, 6]);
            await manager.addVector('item-3', [3, 4, 5, 6, 7]);
            
            // Search
            const results = manager.searchKNN([2.5, 3.5, 4.5, 5.5, 6.5], 2);
            expect(results).to.have.lengthOf(2);
            expect(results[0].id).to.be.oneOf(['item-2', 'item-3']);
        });

        it('should save and load index', async () => {
            const manager = new HNSWManager(testDir);
            await manager.initializeIndex(3, 'l2');
            
            // Add vectors
            const items = [
                { id: 'a', vector: [1, 0, 0] },
                { id: 'b', vector: [0, 1, 0] },
                { id: 'c', vector: [0, 0, 1] },
                { id: 'd', vector: [1, 1, 0] },
                { id: 'e', vector: [0, 1, 1] }
            ];
            
            for (const item of items) {
                await manager.addVector(item.id, item.vector);
            }
            
            // Save
            await manager.save({ checksumEnabled: true });
            
            // Get stats before clearing
            const statsBeforeClear = await manager.getStats();
            expect(statsBeforeClear.elementCount).to.equal(5);
            expect(statsBeforeClear.fileSize).to.be.greaterThan(0);
            expect(statsBeforeClear.checksum).to.be.a('string');
            
            // Clear and reload
            manager.clear();
            await manager.load({ checksumEnabled: true });
            
            // Verify loaded correctly
            const statsAfterLoad = await manager.getStats();
            expect(statsAfterLoad.elementCount).to.equal(5);
            expect(statsAfterLoad.checksum).to.equal(statsBeforeClear.checksum);
            
            // Test search works after load
            const results = manager.searchKNN([1, 1, 1], 3);
            expect(results).to.have.lengthOf(3);
        });

        it('should handle updates and deletes', async () => {
            const manager = new HNSWManager(testDir);
            await manager.initializeIndex(3, 'cosine');
            
            // Add initial vectors
            await manager.addVector('item-1', [1, 0, 0]);
            await manager.addVector('item-2', [0, 1, 0]);
            await manager.addVector('item-3', [0, 0, 1]);
            
            // Update vector
            await manager.updateVector('item-2', [0.5, 0.5, 0]);
            
            // Remove vector
            manager.removeVector('item-3');
            
            // Search
            const results = manager.searchKNN([0.6, 0.4, 0], 3);
            expect(results).to.have.lengthOf(2);
            expect(results[0].id).to.equal('item-2'); // Updated vector should be closest
        });

        it('should build from batch of items', async () => {
            const manager = new HNSWManager(testDir);
            
            // Generate test items
            const items = [];
            for (let i = 0; i < 100; i++) {
                items.push({
                    id: `item-${i}`,
                    vector: Array(10).fill(0).map(() => Math.random())
                });
            }
            
            let progressReports = 0;
            await manager.buildFromItems(
                items,
                10,
                'cosine',
                { M: 16, efConstruction: 200 },
                (progress) => {
                    progressReports++;
                }
            );
            
            expect(progressReports).to.be.greaterThan(0);
            
            const stats = await manager.getStats();
            expect(stats.elementCount).to.equal(100);
        });

        it('should handle capacity resize', async () => {
            const manager = new HNSWManager(testDir);
            await manager.initializeIndex(3, 'cosine', {
                maxElements: 10
            });
            
            // Add items up to capacity
            for (let i = 0; i < 10; i++) {
                await manager.addVector(`item-${i}`, [Math.random(), Math.random(), Math.random()]);
            }
            
            // Resize capacity
            await manager.resize(20);
            
            // Add more items
            for (let i = 10; i < 15; i++) {
                await manager.addVector(`item-${i}`, [Math.random(), Math.random(), Math.random()]);
            }
            
            expect(manager.getCapacity()).to.be.at.least(20);
        });
    });

    describe('LocalIndex Integration', () => {
        it('should persist HNSW index across restarts', async () => {
            // Create index and add items
            let index = new LocalIndex(testDir);
            await index.createIndex({
                version: 1,
                hnswOptions: {
                    M: 16,
                    efConstruction: 200
                }
            });
            
            const vectors: number[][] = [];
            for (let i = 0; i < 50; i++) {
                const vector = Array(10).fill(0).map(() => Math.random());
                vectors.push(vector);
                await index.insertItem({
                    vector,
                    metadata: { index: i }
                });
            }
            
            // Query before restart
            const queryVector = Array(10).fill(0).map(() => Math.random());
            const resultsBefore = await index.queryItems(queryVector, '', 5);
            expect(resultsBefore).to.have.lengthOf(5);
            
            // Close index
            await index.close();
            
            // Create new index instance
            index = new LocalIndex(testDir);
            
            // Query after restart - should use persisted HNSW
            const resultsAfter = await index.queryItems(queryVector, '', 5);
            
            // Results should be the same
            expect(resultsAfter).to.have.lengthOf(5);
            expect(resultsAfter.map(r => r.item.id)).to.deep.equal(
                resultsBefore.map(r => r.item.id)
            );
        });

        it('should handle index rebuild', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            // Add items
            for (let i = 0; i < 20; i++) {
                await index.insertItem({
                    vector: Array(5).fill(i * 0.1),
                    metadata: { index: i }
                });
            }
            
            // Get stats before rebuild
            const statsBefore = await index.getHNSWStats();
            expect(statsBefore.elementCount).to.equal(20);
            
            // Rebuild with different options
            await index.rebuildHNSWIndex({
                M: 32,
                efConstruction: 400
            });
            
            // Get stats after rebuild
            const statsAfter = await index.getHNSWStats();
            expect(statsAfter.elementCount).to.equal(20);
            
            // Verify search still works
            const results = await index.queryItems([0.5, 0.5, 0.5, 0.5, 0.5], '', 3);
            expect(results).to.have.lengthOf(3);
        });

        it('should optimize index for search', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            // Add many items
            for (let i = 0; i < 100; i++) {
                await index.insertItem({
                    vector: Array(10).fill(0).map(() => Math.random()),
                    metadata: { index: i }
                });
            }
            
            // Optimize for search
            await index.optimizeHNSWIndex(50); // Set ef parameter
            
            // Verify optimization persisted
            const stats = await index.getHNSWStats();
            expect(stats.lastSaved).to.be.greaterThan(0);
        });

        it('should handle incremental updates', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            // Add initial batch
            await index.beginUpdate();
            for (let i = 0; i < 10; i++) {
                await index.insertItem({
                    vector: [i, i * 2, i * 3],
                    metadata: { batch: 1, index: i }
                });
            }
            await index.endUpdate();
            
            // Verify HNSW contains items
            let stats = await index.getHNSWStats();
            expect(stats.elementCount).to.equal(10);
            
            // Add more items
            await index.beginUpdate();
            for (let i = 10; i < 20; i++) {
                await index.insertItem({
                    vector: [i, i * 2, i * 3],
                    metadata: { batch: 2, index: i }
                });
            }
            await index.endUpdate();
            
            // Verify incremental update
            stats = await index.getHNSWStats();
            expect(stats.elementCount).to.equal(20);
            
            // Test search across both batches
            const results = await index.queryItems([9.5, 19, 28.5], '', 4);
            expect(results).to.have.lengthOf(4);
            const batches = results.map(r => r.item.metadata.batch);
            expect(batches).to.include(1);
            expect(batches).to.include(2);
        });

        it('should handle mixed operations with HNSW', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            // Add items
            const itemIds: string[] = [];
            for (let i = 0; i < 20; i++) {
                const item = await index.insertItem({
                    vector: [Math.cos(i), Math.sin(i), Math.cos(i) * Math.sin(i)],
                    metadata: { angle: i }
                });
                itemIds.push(item.id);
            }
            
            // Update some items
            for (let i = 0; i < 5; i++) {
                await index.upsertItem({
                    id: itemIds[i],
                    vector: [Math.cos(i * 2), Math.sin(i * 2), Math.cos(i * 2) * Math.sin(i * 2)],
                    metadata: { angle: i * 2, updated: true }
                });
            }
            
            // Delete some items
            for (let i = 15; i < 18; i++) {
                await index.deleteItem(itemIds[i]);
            }
            
            // Verify HNSW state
            const stats = await index.getHNSWStats();
            expect(stats.elementCount).to.equal(17); // 20 - 3 deleted
            
            // Search should work correctly
            const results = await index.queryItems([0, 1, 0], '', 5);
            expect(results).to.have.lengthOf(5);
            
            // Check that updated items are found
            const updatedResults = results.filter(r => r.item.metadata.updated);
            expect(updatedResults.length).to.be.greaterThan(0);
        });

        it('should handle errors gracefully', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            // Add items
            for (let i = 0; i < 10; i++) {
                await index.insertItem({
                    vector: Array(5).fill(i),
                    metadata: { index: i }
                });
            }
            
            // Corrupt HNSW index file
            const hnswPath = path.join(testDir, 'hnsw.index');
            await fs.writeFile(hnswPath, 'corrupted data');
            
            // Create new index instance - should rebuild
            const newIndex = new LocalIndex(testDir);
            
            // Query should still work (falls back to rebuild)
            const results = await newIndex.queryItems([5, 5, 5, 5, 5], '', 3);
            expect(results).to.have.lengthOf(3);
        });
    });

    describe('Performance', () => {
        it('should show performance improvement with HNSW', async function() {
            this.timeout(30000); // Longer timeout for performance test
            
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            // Add many items
            const itemCount = 1000;
            const dimensions = 50;
            console.log(`Adding ${itemCount} items with ${dimensions} dimensions...`);
            
            for (let i = 0; i < itemCount; i++) {
                await index.insertItem({
                    vector: Array(dimensions).fill(0).map(() => Math.random()),
                    metadata: { index: i }
                });
                
                if (i % 100 === 0) {
                    console.log(`Progress: ${i}/${itemCount}`);
                }
            }
            
            // Test query performance
            const queryVector = Array(dimensions).fill(0).map(() => Math.random());
            
            // Time HNSW search
            const hnswStart = Date.now();
            const hnswResults = await index.queryItems(queryVector, '', 10);
            const hnswTime = Date.now() - hnswStart;
            
            console.log(`HNSW search time: ${hnswTime}ms`);
            expect(hnswResults).to.have.lengthOf(10);
            expect(hnswTime).to.be.lessThan(100); // Should be fast
        });
    });
});