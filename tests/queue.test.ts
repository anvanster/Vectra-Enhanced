import { expect } from 'chai';
import { LocalIndex } from '../lib/LocalIndex';
import { OperationQueue } from '../lib/OperationQueue';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('Operation Queue Tests', function() {
    this.timeout(30000);
    const testIndexPath = path.join(__dirname, 'test-queue-index');
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

    it('should handle high concurrency without timeouts', async () => {
        await index.createIndex({ version: 1 });

        const concurrentOps = 50;
        const promises: Promise<any>[] = [];

        // Create many concurrent operations
        for (let i = 0; i < concurrentOps; i++) {
            promises.push(
                index.insertItem({
                    id: `item-${i}`,
                    vector: [Math.random(), Math.random(), Math.random()],
                    metadata: { index: i, timestamp: Date.now() }
                })
            );
        }

        // All should complete without timeout
        const results = await Promise.all(promises);
        
        expect(results.length).to.equal(concurrentOps);
        
        // Verify all items exist
        const items = await index.listItems();
        expect(items.length).to.equal(concurrentOps);
    });

    it('should serialize operations in order', async () => {
        await index.createIndex({ version: 1 });

        const operations: number[] = [];
        const promises: Promise<any>[] = [];

        // Track operation order
        for (let i = 0; i < 10; i++) {
            const idx = i;
            promises.push(
                index.insertItem({
                    id: `order-${idx}`,
                    vector: [idx, idx, idx],
                    metadata: { order: idx }
                }).then(() => {
                    operations.push(idx);
                })
            );
        }

        await Promise.all(promises);

        // Operations should be processed in order (FIFO with same priority)
        expect(operations).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should handle mixed operations', async () => {
        await index.createIndex({ version: 1 });

        // Insert some initial items
        for (let i = 0; i < 5; i++) {
            await index.insertItem({
                id: `initial-${i}`,
                vector: [i, i, i],
                metadata: { type: 'initial' }
            });
        }

        // Mix of inserts, updates, and deletes
        const promises: Promise<any>[] = [];
        
        // Inserts
        for (let i = 0; i < 5; i++) {
            promises.push(
                index.insertItem({
                    id: `new-${i}`,
                    vector: [i * 2, i * 2, i * 2],
                    metadata: { type: 'new' }
                })
            );
        }

        // Updates
        for (let i = 0; i < 5; i++) {
            promises.push(
                index.upsertItem({
                    id: `initial-${i}`,
                    vector: [i * 3, i * 3, i * 3],
                    metadata: { type: 'updated' }
                })
            );
        }

        // Deletes
        for (let i = 0; i < 3; i++) {
            promises.push(
                index.deleteItem(`initial-${i}`)
            );
        }

        await Promise.all(promises);
        await index.flush();

        const items = await index.listItems();
        
        // Should have: 5 new items + 2 remaining initial items (3 were deleted)
        expect(items.length).to.equal(7);
        
        // Verify deletes worked
        expect(await index.getItem('initial-0')).to.be.undefined;
        expect(await index.getItem('initial-1')).to.be.undefined;
        expect(await index.getItem('initial-2')).to.be.undefined;
        
        // Verify updates worked
        const updated3 = await index.getItem('initial-3');
        expect(updated3).to.not.be.undefined;
        expect(updated3!.metadata.type).to.equal('updated');
    });

    it('should handle operation failures with retry', async () => {
        await index.createIndex({ version: 1 });

        let attemptCount = 0;
        const queue = new OperationQueue({ maxRetries: 3, retryDelay: 50 });
        
        // Set up a handler that fails twice then succeeds
        queue.setHandler('test', async (data: any) => {
            attemptCount++;
            if (attemptCount < 3) {
                throw new Error('Simulated failure');
            }
            return { success: true, attempts: attemptCount };
        });

        const result = await queue.enqueue('test', { data: 'test' });
        
        expect(result.success).to.be.true;
        expect(result.attempts).to.equal(3);
    });

    it('should process high-priority operations first', async () => {
        await index.createIndex({ version: 1 });

        const queue = new OperationQueue({ 
            maxConcurrency: 1,
            priorityQueue: true 
        });
        
        const processOrder: string[] = [];
        
        queue.setHandler('track', async (data: { id: string }) => {
            processOrder.push(data.id);
            await new Promise(resolve => setTimeout(resolve, 10));
            return data.id;
        });

        // Enqueue with different priorities
        const promises = [
            queue.enqueue('track', { id: 'low-1' }, 1),
            queue.enqueue('track', { id: 'high-1' }, 10),
            queue.enqueue('track', { id: 'low-2' }, 1),
            queue.enqueue('track', { id: 'high-2' }, 10),
            queue.enqueue('track', { id: 'medium' }, 5)
        ];

        await Promise.all(promises);

        // High priority items should be processed first
        expect(processOrder[0]).to.equal('low-1'); // Already processing
        expect(processOrder[1]).to.equal('high-1'); // Highest priority in queue
        expect(processOrder[2]).to.equal('high-2'); // Next highest
        expect(processOrder[3]).to.equal('medium'); // Medium priority
        expect(processOrder[4]).to.equal('low-2');  // Lowest priority
    });
});