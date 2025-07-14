import { expect } from 'chai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { LazyIndex, PagedResult } from '../lib/LazyIndex';
import { LocalIndex } from '../lib/LocalIndex';
import { IndexItem, MetadataTypes } from '../lib/types';

describe('LazyIndex', () => {
    const testDir = './test-lazy-index';
    const tempIndexPath = './test-lazy-temp';
    
    beforeEach(async () => {
        // Clean up test directories
        await fs.rm(testDir, { recursive: true }).catch(() => {});
        await fs.rm(tempIndexPath, { recursive: true }).catch(() => {});
    });

    afterEach(async () => {
        // Clean up test directories
        await fs.rm(testDir, { recursive: true }).catch(() => {});
        await fs.rm(tempIndexPath, { recursive: true }).catch(() => {});
    });

    describe('LazyIndex creation', () => {
        it('should create a lazy index from an existing index', async () => {
            // Create regular index with items
            const index = new LocalIndex(tempIndexPath);
            await index.createIndex({ version: 1 });
            
            // Add test items
            const items: IndexItem[] = [];
            for (let i = 0; i < 25; i++) {
                const item = await index.insertItem({
                    id: `item-${i}`,
                    vector: Array(10).fill(0).map(() => Math.random()),
                    metadata: {
                        index: i,
                        category: i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C',
                        score: Math.random() * 100
                    }
                });
                items.push(item);
            }
            
            // Convert to lazy index
            await LazyIndex.createFromIndex(tempIndexPath, testDir, 10);
            
            // Verify structure
            const manifestPath = path.join(testDir, 'manifest.json');
            const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
            
            expect(manifest.totalItems).to.equal(25);
            expect(manifest.chunks).to.have.lengthOf(3); // 25 items / 10 chunk size = 3 chunks
            expect(manifest.chunks[0].itemCount).to.equal(10);
            expect(manifest.chunks[1].itemCount).to.equal(10);
            expect(manifest.chunks[2].itemCount).to.equal(5);
            
            // Verify chunks exist
            const chunksDir = path.join(testDir, 'chunks');
            const chunkFiles = await fs.readdir(chunksDir);
            expect(chunkFiles).to.have.lengthOf(3);
        });
    });

    describe('Item retrieval', () => {
        let lazyIndex: LazyIndex;
        
        beforeEach(async () => {
            // Create test index
            const index = new LocalIndex(tempIndexPath);
            await index.createIndex({ version: 1 });
            
            // Add items
            for (let i = 0; i < 50; i++) {
                await index.insertItem({
                    id: `item-${i}`,
                    vector: Array(10).fill(0).map(() => Math.random()),
                    metadata: {
                        index: i,
                        category: ['A', 'B', 'C'][i % 3],
                        score: i * 2
                    }
                });
            }
            
            // Convert to lazy index
            await LazyIndex.createFromIndex(tempIndexPath, testDir, 20);
            lazyIndex = new LazyIndex(testDir);
        });

        it('should retrieve a single item by ID', async () => {
            const item = await lazyIndex.getItem('item-5');
            expect(item).to.exist;
            expect(item!.id).to.equal('item-5');
            expect(item!.metadata.index).to.equal(5);
            expect(item!.metadata.category).to.equal('C');
        });

        it('should return undefined for non-existent item', async () => {
            const item = await lazyIndex.getItem('non-existent');
            expect(item).to.be.undefined;
        });

        it('should list items with pagination', async () => {
            const page1 = await lazyIndex.listItems(1, 15);
            expect(page1.items).to.have.lengthOf(15);
            expect(page1.pageInfo.totalItems).to.equal(50);
            expect(page1.pageInfo.totalPages).to.equal(4);
            expect(page1.hasMore).to.be.true;
            
            const page2 = await lazyIndex.listItems(2, 15);
            expect(page2.items).to.have.lengthOf(15);
            expect(page2.items[0].metadata.index).to.equal(15);
            
            const page4 = await lazyIndex.listItems(4, 15);
            expect(page4.items).to.have.lengthOf(5); // Only 5 items on last page
            expect(page4.hasMore).to.be.false;
        });

        it('should handle empty page request gracefully', async () => {
            const page = await lazyIndex.listItems(10, 15); // Page beyond data
            expect(page.items).to.have.lengthOf(0);
            expect(page.hasMore).to.be.false;
        });
    });

    describe('Filtering', () => {
        let lazyIndex: LazyIndex;
        
        beforeEach(async () => {
            // Create test index with diverse metadata
            const index = new LocalIndex(tempIndexPath);
            await index.createIndex({ version: 1 });
            
            for (let i = 0; i < 100; i++) {
                await index.insertItem({
                    id: `item-${i}`,
                    vector: Array(10).fill(0).map(() => Math.random()),
                    metadata: {
                        index: i,
                        category: ['A', 'B', 'C', 'D'][i % 4],
                        score: i,
                        active: i % 2 === 0
                    }
                });
            }
            
            await LazyIndex.createFromIndex(tempIndexPath, testDir, 25);
            lazyIndex = new LazyIndex(testDir);
        });

        it('should filter items by metadata with pagination', async () => {
            const result = await lazyIndex.listItemsByMetadata({ category: { $eq: 'A' } }, 1, 10);
            expect(result.items).to.have.lengthOf(10);
            expect(result.items.every(item => item.metadata.category === 'A')).to.be.true;
            expect(result.pageInfo.totalItems).to.equal(25); // 100 items / 4 categories
        });

        it('should support complex filters', async () => {
            const result = await lazyIndex.listItemsByMetadata({
                $and: [
                    { category: { $in: ['A', 'B'] } },
                    { score: { $gte: 50 } },
                    { active: { $eq: true } }
                ]
            }, 1, 20);
            
            expect(result.items.every(item => 
                ['A', 'B'].includes(item.metadata.category as string) &&
                (item.metadata.score as number) >= 50 &&
                item.metadata.active === true
            )).to.be.true;
        });

        it('should stream filtered items', async () => {
            const items: IndexItem[] = [];
            for await (const item of lazyIndex.filterItems({ category: { $eq: 'B' } })) {
                items.push(item);
            }
            expect(items).to.have.lengthOf(25);
            expect(items.every(item => item.metadata.category === 'B')).to.be.true;
        });
    });

    describe('Cache management', () => {
        it('should cache accessed items', async () => {
            const index = new LocalIndex(tempIndexPath);
            await index.createIndex({ version: 1 });
            
            // Add items
            for (let i = 0; i < 30; i++) {
                await index.insertItem({
                    id: `item-${i}`,
                    vector: Array(10).fill(i * 0.1),
                    metadata: { index: i }
                });
            }
            
            await LazyIndex.createFromIndex(tempIndexPath, testDir, 10);
            const lazyIndex = new LazyIndex(testDir, { cacheSize: 20 });
            
            // Access items
            await lazyIndex.getItem('item-5');
            await lazyIndex.getItem('item-15');
            
            const stats = lazyIndex.getCacheStats();
            expect(stats.itemCacheSize).to.be.at.least(2);
            expect(stats.chunkCacheSize).to.be.at.least(2);
            
            // Clear cache
            lazyIndex.clearCache();
            const clearedStats = lazyIndex.getCacheStats();
            expect(clearedStats.itemCacheSize).to.equal(0);
            expect(clearedStats.chunkCacheSize).to.equal(0);
        });
    });

    describe('External metadata', () => {
        it('should handle items with external metadata files', async () => {
            const index = new LocalIndex(tempIndexPath);
            await index.createIndex({ 
                version: 1,
                metadata_config: {
                    indexed: ['type'] // Only 'type' is indexed
                }
            });
            
            // Add item with large metadata
            const largeMetadata = {
                type: 'document',
                content: 'x'.repeat(1000),
                tags: Array(100).fill('tag'),
                scores: Array(100).fill(0).map(() => Math.random())
            };
            
            await index.insertItem({
                id: 'large-item',
                vector: Array(10).fill(0.5),
                metadata: largeMetadata
            });
            
            // Convert to lazy
            await LazyIndex.createFromIndex(tempIndexPath, testDir, 10);
            const lazyIndex = new LazyIndex(testDir);
            
            // Retrieve item
            const item = await lazyIndex.getItem('large-item');
            expect(item).to.exist;
            expect(item!.metadata.type).to.equal('document');
            expect(item!.metadata.content).to.equal(largeMetadata.content);
            expect(item!.metadata.tags).to.deep.equal(largeMetadata.tags);
        });
    });

    describe('Stream iteration', () => {
        it('should iterate through all items', async () => {
            const index = new LocalIndex(tempIndexPath);
            await index.createIndex({ version: 1 });
            
            const expectedItems = [];
            for (let i = 0; i < 35; i++) {
                const item = await index.insertItem({
                    id: `item-${i}`,
                    vector: Array(5).fill(i),
                    metadata: { index: i }
                });
                expectedItems.push(item);
            }
            
            await LazyIndex.createFromIndex(tempIndexPath, testDir, 15);
            const lazyIndex = new LazyIndex(testDir);
            
            const items: IndexItem[] = [];
            for await (const item of lazyIndex.iterateItems()) {
                items.push(item);
            }
            
            expect(items).to.have.lengthOf(35);
            expect(items.map(i => i.metadata.index).sort((a, b) => (a as number) - (b as number)))
                .to.deep.equal(Array(35).fill(0).map((_, i) => i));
        });
    });

    describe('LocalIndex integration', () => {
        it('should create a lazy index directly', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({
                version: 1,
                lazy: true,
                lazyOptions: {
                    cacheSize: 500,
                    pageSize: 50
                }
            });
            
            // Verify lazy structure created
            const manifestPath = path.join(testDir, 'manifest.json');
            const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
            expect(manifest.totalItems).to.equal(0);
            expect(manifest.chunks).to.deep.equal([]);
            
            const indexPath = path.join(testDir, 'index.json');
            const indexData = JSON.parse(await fs.readFile(indexPath, 'utf-8'));
            expect(indexData.lazy).to.be.true;
        });

        it('should convert existing index to lazy format', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            // Add items
            for (let i = 0; i < 20; i++) {
                await index.insertItem({
                    id: `item-${i}`,
                    vector: Array(8).fill(i * 0.1),
                    metadata: { index: i }
                });
            }
            
            // Convert to lazy
            await index.convertToLazy(10);
            
            // Verify conversion
            const manifestPath = path.join(testDir, 'manifest.json');
            const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
            expect(manifest.totalItems).to.equal(20);
            expect(manifest.chunks).to.have.lengthOf(2);
            
            // Index should still work
            const items = await index.listItems();
            expect(items).to.have.lengthOf(20);
        });
    });
});