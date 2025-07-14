import { expect } from 'chai';
import { LocalIndex } from '../lib/LocalIndex';
import { lockManager } from '../lib/LockManager';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('Lock Tests', function() {
    this.timeout(10000);
    const testIndexPath = path.join(__dirname, 'test-lock-index');

    beforeEach(async () => {
        try {
            await fs.rm(testIndexPath, { recursive: true });
        } catch (err) {
            // Ignore
        }
    });

    afterEach(async () => {
        try {
            await fs.rm(testIndexPath, { recursive: true });
        } catch (err) {
            // Ignore
        }
    });

    it('should acquire and release a write lock', async () => {
        await fs.mkdir(testIndexPath, { recursive: true });
        await fs.writeFile(path.join(testIndexPath, 'index.json'), '{}');

        const lock = await lockManager.acquireWriteLock(testIndexPath);
        expect(lock).to.not.be.null;

        const isLocked = await lockManager.isWriteLocked(testIndexPath);
        expect(isLocked).to.be.true;

        await lock.release();

        const isLockedAfter = await lockManager.isWriteLocked(testIndexPath);
        expect(isLockedAfter).to.be.false;
    });

    it('should prevent concurrent write locks', async () => {
        await fs.mkdir(testIndexPath, { recursive: true });
        await fs.writeFile(path.join(testIndexPath, 'index.json'), '{}');

        const lock1 = await lockManager.acquireWriteLock(testIndexPath);
        
        // Try to acquire second lock with no retries
        const lock2 = await lockManager.tryAcquireWriteLock(testIndexPath);
        expect(lock2).to.be.null;

        await lock1.release();
    });

    it('should handle index creation with locking', async () => {
        const index = new LocalIndex(testIndexPath);
        await index.createIndex({ version: 1 });

        const exists = await index.isIndexCreated();
        expect(exists).to.be.true;
    });

    it('should handle single item insertion', async () => {
        const index = new LocalIndex(testIndexPath);
        await index.createIndex({ version: 1 });

        const item = await index.insertItem({
            id: 'test-1',
            vector: [1, 2, 3],
            metadata: { test: true }
        });

        expect(item.id).to.equal('test-1');
        
        const retrieved = await index.getItem('test-1');
        expect(retrieved).to.not.be.undefined;
        expect(retrieved!.metadata.test).to.be.true;
    });

    it('should handle sequential updates', async () => {
        const index = new LocalIndex(testIndexPath);
        await index.createIndex({ version: 1 });

        // Insert items sequentially
        for (let i = 0; i < 5; i++) {
            await index.insertItem({
                id: `seq-${i}`,
                vector: [i, i + 1, i + 2],
                metadata: { index: i }
            });
        }

        const items = await index.listItems();
        expect(items.length).to.equal(5);
    });
});