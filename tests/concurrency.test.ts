import { expect } from 'chai';
import { LocalIndex } from '../lib/LocalIndex';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('Concurrency Tests', function() {
    this.timeout(10000); // Increase timeout for concurrent operations
    const testIndexPath = path.join(__dirname, 'test-index-concurrent');
    let index: LocalIndex;

    beforeEach(async () => {
        // Clean up any existing test index
        try {
            await fs.rm(testIndexPath, { recursive: true });
        } catch (err) {
            // Ignore if doesn't exist
        }
        
        index = new LocalIndex(testIndexPath);
    });

    afterEach(async () => {
        // Clean up test index
        try {
            await fs.rm(testIndexPath, { recursive: true });
        } catch (err) {
            // Ignore if doesn't exist
        }
    });

    it('should handle concurrent writes safely', async () => {
        // Create index
        await index.createIndex({ version: 1 });

        // Create multiple concurrent write operations
        const promises: Promise<void>[] = [];
        const itemCount = 10;

        for (let i = 0; i < itemCount; i++) {
            promises.push(
                index.insertItem({
                    id: `item-${i}`,
                    vector: [i, i + 1, i + 2],
                    metadata: { index: i }
                }).then(() => {})
            );
        }

        // Wait for all writes to complete
        await Promise.all(promises);
        
        // Ensure all queued operations are processed
        await index.flush();

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

    it('should handle concurrent reads during writes', async () => {
        // Create index with some initial data
        await index.createIndex({ version: 1 });
        await index.insertItem({
            id: 'initial-item',
            vector: [1, 2, 3],
            metadata: { type: 'initial' }
        });

        // Start a long-running write operation
        const writePromise = (async () => {
            await index.beginUpdate();
            // Simulate slow write
            await new Promise(resolve => setTimeout(resolve, 100));
            await index.insertItem({
                id: 'new-item',
                vector: [4, 5, 6],
                metadata: { type: 'new' }
            });
            await index.endUpdate();
        })();

        // Perform concurrent reads
        const readPromises: Promise<any>[] = [];
        for (let i = 0; i < 5; i++) {
            readPromises.push(index.getItem('initial-item'));
            readPromises.push(index.listItems());
        }

        // Wait for all operations
        const [writeResult, ...readResults] = await Promise.all([
            writePromise,
            ...readPromises
        ]);

        // Verify reads succeeded
        for (let i = 0; i < readResults.length; i++) {
            expect(readResults[i]).to.not.be.undefined;
        }
    });

    it('should prevent multiple concurrent updates', async () => {
        await index.createIndex({ version: 1 });

        // Start first update
        await index.beginUpdate();

        // Try to start second update - should fail
        let errorCaught = false;
        try {
            await index.beginUpdate();
        } catch (err: any) {
            errorCaught = true;
            expect(err.message).to.include('Update already in progress');
        }

        expect(errorCaught).to.be.true;

        // Complete first update
        await index.endUpdate();
    });

    it('should handle concurrent queries safely', async () => {
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

        // Create a fresh index instance to ensure data is loaded
        const queryIndex = new LocalIndex(testIndexPath);
        
        // Perform multiple concurrent queries
        const queryPromises: Promise<any>[] = [];
        const queryVector = [0.5, 0.5, 0.5];
        
        for (let i = 0; i < 10; i++) {
            queryPromises.push(
                queryIndex.queryItems(queryVector, '', 5)
            );
        }

        const results = await Promise.all(queryPromises);

        // Verify all queries returned results
        for (const result of results) {
            expect(result).to.be.an('array');
            expect(result.length).to.be.greaterThan(0);
            expect(result.length).to.be.lessThanOrEqual(5);
        }
    });

    it('should handle index creation race condition', async () => {
        // Try to create index concurrently
        const createPromises = [
            index.createIndex({ version: 1, deleteIfExists: false }),
            index.createIndex({ version: 1, deleteIfExists: false })
        ];

        let successCount = 0;
        let errorCount = 0;

        for (const promise of createPromises) {
            try {
                await promise;
                successCount++;
            } catch (err: any) {
                if (err.message.includes('already exists')) {
                    errorCount++;
                } else {
                    throw err;
                }
            }
        }

        // At least one should succeed
        expect(successCount).to.be.at.least(1);
        // This test is less deterministic with queuing - both might succeed if timed right
        expect(successCount + errorCount).to.equal(2);
    });

    it('should properly release locks on error', async () => {
        await index.createIndex({ version: 1 });

        // Try to insert an item with invalid data
        let errorCaught = false;
        try {
            await index.insertItem({
                id: 'test-item',
                vector: null as any, // Invalid vector
                metadata: {}
            });
        } catch (err) {
            errorCaught = true;
        }

        expect(errorCaught).to.be.true;

        // Verify we can still perform operations (lock was released)
        const item = await index.insertItem({
            id: 'valid-item',
            vector: [1, 2, 3],
            metadata: { valid: true }
        });
        
        expect(item.id).to.equal('valid-item');
    });
});