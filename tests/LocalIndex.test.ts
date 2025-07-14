import { expect } from 'chai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LocalIndex } from '../lib/LocalIndex';
import { IndexItem, DistanceMetric } from '../lib/types';

describe('LocalIndex', () => {
    const testIndexDir = path.join(__dirname, 'test_index');

    beforeEach(async () => {
        // Clean up before each test
        await fs.rm(testIndexDir, { recursive: true, force: true });
    });

    afterEach(async () => {
        // Clean up after each test
        await fs.rm(testIndexDir, { recursive: true, force: true });
    });

    it('should create a new index', async () => {
        const index = new LocalIndex(testIndexDir);
        await index.createIndex();
        const indexExists = await index.isIndexCreated();
        expect(indexExists).to.be.true;
        const indexFileContent = await fs.readFile(path.join(testIndexDir, 'index.json'), 'utf-8');
        const parsedContent = JSON.parse(indexFileContent);
        expect(parsedContent).to.have.property('version', 1);
        expect(parsedContent).to.have.property('distanceMetric', 'cosine');
        expect(parsedContent).to.have.property('items').that.is.an('array').and.is.empty;
    });

    it('should create a new index with a specified distance metric', async () => {
        const index = new LocalIndex(testIndexDir);
        const distanceMetric: DistanceMetric = 'l2';
        await index.createIndex({ version: 1, distanceMetric });
        const indexExists = await index.isIndexCreated();
        expect(indexExists).to.be.true;
        const indexFileContent = await fs.readFile(path.join(testIndexDir, 'index.json'), 'utf-8');
        const parsedContent = JSON.parse(indexFileContent);
        expect(parsedContent).to.have.property('distanceMetric', distanceMetric);
    });

    it('should throw an error if index already exists and deleteIfExists is false', async () => {
        const index = new LocalIndex(testIndexDir);
        await index.createIndex(); // Create once
        try {
            await index.createIndex(); // Try to create again without deleteIfExists
            expect.fail('Should have thrown an error');
        } catch (error: any) {
            expect(error.message).to.equal('Index already exists');
        }
    });

    it('should delete and recreate index if deleteIfExists is true', async () => {
        const index = new LocalIndex(testIndexDir);
        await index.createIndex(); // Create once
        await index.insertItem({ id: '1', vector: [1, 2, 3], metadata: {} }); // Add some data
        await index.createIndex({ version: 1, deleteIfExists: true }); // Recreate
        const indexExists = await index.isIndexCreated();
        expect(indexExists).to.be.true;
        const stats = await index.getIndexStats();
        expect(stats.items).to.equal(0); // Should be empty after recreation
    });

    it('should insert a new item', async () => {
        const index = new LocalIndex(testIndexDir);
        await index.createIndex();
        const item: IndexItem = { id: 'test1', vector: [0.1, 0.2, 0.3], metadata: { name: 'item1' }, norm: 0 };
        const insertedItem = await index.insertItem(item);
        expect(insertedItem.id).to.equal(item.id);
        expect(insertedItem.vector).to.deep.equal(item.vector);
        expect(insertedItem.metadata).to.deep.equal(item.metadata);

        const retrievedItem = await index.getItem('test1');
        expect(retrievedItem).to.deep.equal(insertedItem);
    });

    it('should throw error if inserting item with existing ID and unique is true', async () => {
        const index = new LocalIndex(testIndexDir);
        await index.createIndex();
        const item: IndexItem = { id: 'test1', vector: [0.1, 0.2, 0.3], metadata: { name: 'item1' }, norm: 0 };
        await index.insertItem(item);
        try {
            await index.insertItem(item); // Try to insert again
            expect.fail('Should have thrown an error');
        } catch (error: any) {
            expect(error.message).to.include('already exists');
        }
    });

    it('should upsert an item (insert new)', async () => {
        const index = new LocalIndex(testIndexDir);
        await index.createIndex();
        const item: IndexItem = { id: 'test1', vector: [0.1, 0.2, 0.3], metadata: { name: 'item1' }, norm: 0 };
        const upsertedItem = await index.upsertItem(item);
        expect(upsertedItem.id).to.equal(item.id);
        const retrievedItem = await index.getItem('test1');
        expect(retrievedItem).to.deep.equal(upsertedItem);
    });

    it('should upsert an item (update existing)', async () => {
        const index = new LocalIndex(testIndexDir);
        await index.createIndex();
        const item1: IndexItem = { id: 'test1', vector: [0.1, 0.2, 0.3], metadata: { name: 'item1' }, norm: 0 };
        await index.insertItem(item1);

        const updatedVector = [0.4, 0.5, 0.6];
        const updatedMetadata = { name: 'item1_updated', newProp: true };
        const item2: IndexItem = { id: 'test1', vector: updatedVector, metadata: updatedMetadata, norm: 0 };
        const upsertedItem = await index.upsertItem(item2);

        expect(upsertedItem.id).to.equal(item1.id);
        expect(upsertedItem.vector).to.deep.equal(updatedVector);
        expect(upsertedItem.metadata).to.deep.equal(updatedMetadata);

        const retrievedItem = await index.getItem('test1');
        expect(retrievedItem).to.deep.equal(upsertedItem);
    });

    it('should delete an item', async () => {
        const index = new LocalIndex(testIndexDir);
        await index.createIndex();
        const item: IndexItem = { id: 'test1', vector: [0.1, 0.2, 0.3], metadata: { name: 'item1' }, norm: 0 };
        await index.insertItem(item);
        let retrievedItem = await index.getItem('test1');
        expect(retrievedItem).to.exist;

        await index.deleteItem('test1');
        retrievedItem = await index.getItem('test1');
        expect(retrievedItem).to.be.undefined;
    });

    it('should query items and return topK results', async () => {
        const index = new LocalIndex(testIndexDir);
        await index.createIndex();
        await index.insertItem({ id: 'item1', vector: [1, 0, 0], metadata: { text: 'apple' } });
        await index.insertItem({ id: 'item2', vector: [0, 1, 0], metadata: { text: 'banana' } });
        await index.insertItem({ id: 'item3', vector: [0, 0, 1], metadata: { text: 'orange' } });

        const queryVector = [0.9, 0.1, 0.1]; // Closer to item1
        const results = await index.queryItems(queryVector, 'test query', 2); // Query for 2 items

        expect(results).to.have.lengthOf(2);
        expect(results[0].item.id).to.equal('item1');
        expect(results[1].item.id).to.be.oneOf(['item2', 'item3']); // Order might vary for similar scores
    });

    it('should query items with metadata filter', async () => {
        const index = new LocalIndex(testIndexDir);
        await index.createIndex();
        await index.insertItem({ id: 'item1', vector: [1, 0, 0], metadata: { type: 'fruit', color: 'red' } });
        await index.insertItem({ id: 'item2', vector: [0, 1, 0], metadata: { type: 'fruit', color: 'yellow' } });
        await index.insertItem({ id: 'item3', vector: [0, 0, 1], metadata: { type: 'vegetable', color: 'green' } });

        const queryVector = [1, 0, 0];
        const results = await index.queryItems(queryVector, 'test query', 3, { type: 'fruit' });

        expect(results).to.have.lengthOf(2);
        expect(results.some(r => r.item.id === 'item1')).to.be.true;
        expect(results.some(r => r.item.id === 'item2')).to.be.true;
        expect(results.every(r => r.item.metadata.type === 'fruit')).to.be.true;
    });

    it('should compact the index', async () => {
        const index = new LocalIndex(testIndexDir);
        await index.createIndex();
        await index.insertItem({ id: 'item1', vector: [1, 0, 0], metadata: {} });
        await index.deleteItem('item1'); // This will be in the log
        await index.insertItem({ id: 'item2', vector: [0, 1, 0], metadata: {} });

        // Before compact, item1 is logically deleted but might still be in main index file
        // and item2 is in log
        const initialStats = await index.getIndexStats();
        expect(initialStats.items).to.equal(1); // Only item2 should be counted

        await index.compact();

        // After compact, item1 should be gone from main index, item2 should be there, log should be empty
        const compactedStats = await index.getIndexStats();
        expect(compactedStats.items).to.equal(1);
        const retrievedItem = await index.getItem('item2');
        expect(retrievedItem).to.exist;
        const deletedItem = await index.getItem('item1');
        expect(deletedItem).to.be.undefined;

        // Verify operations log is truncated
        const logPath = path.join(testIndexDir, 'operations.log');
        let logContent = '';
        try {
            logContent = await fs.readFile(logPath, 'utf-8');
        } catch (e: any) {
            // Expected if file is truncated/deleted
            expect(e.code).to.equal('ENOENT');
        }
        expect(logContent).to.be.empty;
    });

    it('should create a snapshot of the index', async () => {
        const index = new LocalIndex(testIndexDir);
        await index.createIndex();
        await index.insertItem({ id: 'snap1', vector: [1, 1, 1], metadata: { test: 'snapshot' } });

        const snapshotPath = path.join(__dirname, 'snapshot_test_index');
        await fs.rm(snapshotPath, { recursive: true, force: true }); // Ensure clean slate

        await index.snapshot(snapshotPath);

        const snapshotIndex = new LocalIndex(snapshotPath);
        const snapshotExists = await snapshotIndex.isIndexCreated();
        expect(snapshotExists).to.be.true;

        const snapshotItem = await snapshotIndex.getItem('snap1');
        expect(snapshotItem).to.exist;
        expect(snapshotItem!.metadata.test).to.equal('snapshot');

        // Clean up snapshot
        await fs.rm(snapshotPath, { recursive: true, force: true });
    });
});