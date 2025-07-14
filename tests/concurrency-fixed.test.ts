import { expect } from 'chai';
import { LocalIndex } from '../lib/LocalIndex';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('Fixed Concurrency Tests', function() {
    this.timeout(10000);
    const testIndexPath = path.join(__dirname, 'test-index-concurrent-fixed');
    let index: LocalIndex;

    beforeEach(async () => {
        try {
            await fs.rm(testIndexPath, { recursive: true });
        } catch (err) {
            // Ignore if doesn't exist
        }
        
        index = new LocalIndex(testIndexPath);
    });

    afterEach(async () => {
        try {
            await fs.rm(testIndexPath, { recursive: true });
        } catch (err) {
            // Ignore if doesn't exist
        }
    });

    it('should handle batch writes correctly', async () => {
        // Create index
        await index.createIndex({ version: 1 });

        // Batch write within a single update transaction
        await index.beginUpdate();
        
        const itemCount = 10;
        for (let i = 0; i < itemCount; i++) {
            await index.insertItem({
                id: `item-${i}`,
                vector: [i, i + 1, i + 2],
                metadata: { index: i }
            });
        }
        
        await index.endUpdate();

        // Verify all items were written
        const items = await index.listItems();
        expect(items.length).to.equal(itemCount);

        // Verify each item exists
        for (let i = 0; i < itemCount; i++) {
            const item = await index.getItem(`item-${i}`);
            expect(item).to.not.be.undefined;
            expect(item!.metadata.index).to.equal(i);
        }
    });

    it('should serialize concurrent writes', async () => {
        // Create index
        await index.createIndex({ version: 1 });

        // Create multiple write operations that should serialize
        const results: string[] = [];
        const promises: Promise<void>[] = [];

        for (let i = 0; i < 5; i++) {
            const promise = (async () => {
                try {
                    await index.insertItem({
                        id: `item-${i}`,
                        vector: [i, i + 1, i + 2],
                        metadata: { index: i }
                    });
                    results.push(`success-${i}`);
                } catch (err: any) {
                    results.push(`error-${i}: ${err.message}`);
                }
            })();
            promises.push(promise);
        }

        // Wait for all operations
        await Promise.all(promises);

        // Check results - all should succeed due to serialization
        const successCount = results.filter(r => r.startsWith('success')).length;
        expect(successCount).to.equal(5);

        // Verify items in index
        const items = await index.listItems();
        expect(items.length).to.equal(5);
    });

    it('should allow concurrent reads', async () => {
        // Create index with test data
        await index.createIndex({ version: 1 });
        
        const vectorCount = 20;
        await index.beginUpdate();
        for (let i = 0; i < vectorCount; i++) {
            await index.insertItem({
                id: `vector-${i}`,
                vector: [Math.random(), Math.random(), Math.random()],
                metadata: { index: i }
            });
        }
        await index.endUpdate();

        // Perform multiple concurrent reads
        const readPromises: Promise<any>[] = [];
        
        for (let i = 0; i < 10; i++) {
            readPromises.push(index.getItem(`vector-${i}`));
            readPromises.push(index.listItems());
        }

        const results = await Promise.all(readPromises);

        // Verify all reads succeeded
        for (const result of results) {
            expect(result).to.not.be.undefined;
        }
    });

    it('should handle write lock contention gracefully', async () => {
        await index.createIndex({ version: 1 });

        // Start a long-running update
        const longUpdate = (async () => {
            await index.beginUpdate();
            await new Promise(resolve => setTimeout(resolve, 100));
            await index.insertItem({
                id: 'long-item',
                vector: [1, 2, 3],
                metadata: { type: 'long' }
            });
            await index.endUpdate();
        })();

        // Try concurrent updates - they should wait
        await new Promise(resolve => setTimeout(resolve, 10)); // Let first update start
        
        const quickUpdate = (async () => {
            await index.insertItem({
                id: 'quick-item',
                vector: [4, 5, 6],
                metadata: { type: 'quick' }
            });
        })();

        // Both should complete
        await Promise.all([longUpdate, quickUpdate]);

        // Verify both items exist
        const items = await index.listItems();
        expect(items.length).to.equal(2);
        
        const longItem = await index.getItem('long-item');
        const quickItem = await index.getItem('quick-item');
        
        expect(longItem).to.not.be.undefined;
        expect(quickItem).to.not.be.undefined;
    });

    it('should handle multi-process simulation', async () => {
        await index.createIndex({ version: 1 });

        // Simulate multiple "processes" (really just multiple index instances)
        const index1 = new LocalIndex(testIndexPath);
        const index2 = new LocalIndex(testIndexPath);

        // Both try to write
        const write1 = index1.insertItem({
            id: 'process-1-item',
            vector: [1, 1, 1],
            metadata: { process: 1 }
        });

        const write2 = index2.insertItem({
            id: 'process-2-item',
            vector: [2, 2, 2],
            metadata: { process: 2 }
        });

        // Both should succeed
        await Promise.all([write1, write2]);

        // Verify both items exist
        const items = await index.listItems();
        expect(items.length).to.equal(2);
    });
});