import { expect } from 'chai';
import { LocalIndex } from '../lib/LocalIndex';
import { CleanupManager } from '../lib/CleanupManager';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

describe('Cleanup Tests', function() {
    this.timeout(10000);
    const testIndexPath = path.join(__dirname, 'test-cleanup-index');
    let index: LocalIndex;

    beforeEach(async () => {
        try {
            await fs.rm(testIndexPath, { recursive: true });
        } catch (err) {
            // Ignore if doesn't exist
        }
    });

    afterEach(async () => {
        try {
            await fs.rm(testIndexPath, { recursive: true });
        } catch (err) {
            // Ignore if doesn't exist
        }
    });

    describe('Metadata File Cleanup', () => {
        it('should delete metadata files when items are deleted', async () => {
            index = new LocalIndex(testIndexPath);
            await index.createIndex({ 
                version: 1,
                metadata_config: {
                    indexed: ['id'] // Force external metadata storage
                }
            });

            // Insert item with metadata
            await index.insertItem({
                id: 'test-1',
                vector: [1, 2, 3],
                metadata: {
                    id: 'test-1',
                    name: 'Test Item',
                    description: 'This is a test item with external metadata'
                }
            });

            // Verify metadata file exists
            const files1 = await fs.readdir(testIndexPath);
            const metadataFiles1 = files1.filter(f => f.match(/^[0-9a-f-]+\.json$/));
            expect(metadataFiles1.length).to.equal(1);

            // Delete the item
            await index.deleteItem('test-1');

            // Verify metadata file is deleted
            const files2 = await fs.readdir(testIndexPath);
            const metadataFiles2 = files2.filter(f => f.match(/^[0-9a-f-]+\.json$/));
            expect(metadataFiles2.length).to.equal(0);
        });

        it('should find and clean orphaned metadata files', async () => {
            index = new LocalIndex(testIndexPath);
            await index.createIndex({ 
                version: 1,
                metadata_config: {
                    indexed: ['id']
                }
            });

            // Insert some items
            for (let i = 0; i < 5; i++) {
                await index.insertItem({
                    id: `item-${i}`,
                    vector: [i, i, i],
                    metadata: {
                        id: `item-${i}`,
                        data: 'x'.repeat(100) // Some data to create metadata files
                    }
                });
            }

            // Create orphaned metadata files
            const orphanedFiles: string[] = [];
            for (let i = 0; i < 3; i++) {
                const filename = `${uuidv4()}.json`;
                orphanedFiles.push(filename);
                await fs.writeFile(
                    path.join(testIndexPath, filename),
                    JSON.stringify({ orphaned: true, index: i })
                );
            }

            // Run cleanup
            const stats = await index.cleanup();

            expect(stats.orphanedFilesDeleted).to.equal(3);
            expect(stats.bytesReclaimed).to.be.greaterThan(0);
            expect(stats.errors.length).to.equal(0);

            // Verify orphaned files are gone
            const remainingFiles = await fs.readdir(testIndexPath);
            for (const orphaned of orphanedFiles) {
                expect(remainingFiles).to.not.include(orphaned);
            }
        });

        it('should cleanup during compact operation', async () => {
            index = new LocalIndex(testIndexPath);
            await index.createIndex({ 
                version: 1,
                metadata_config: {
                    indexed: ['type']
                }
            });

            // Insert and delete items to create orphans
            const itemIds: string[] = [];
            for (let i = 0; i < 10; i++) {
                const item = await index.insertItem({
                    id: `temp-${i}`,
                    vector: [i, i, i],
                    metadata: {
                        type: 'temporary',
                        data: 'x'.repeat(200)
                    }
                });
                itemIds.push(item.id);
            }

            // Delete half of them
            for (let i = 0; i < 5; i++) {
                await index.deleteItem(itemIds[i]);
            }

            // Manually create some orphaned files
            for (let i = 0; i < 3; i++) {
                await fs.writeFile(
                    path.join(testIndexPath, `${uuidv4()}.json`),
                    JSON.stringify({ orphaned: true })
                );
            }

            // Run compact
            const stats = await index.compact();

            expect(stats.orphanedFilesDeleted).to.be.at.least(3);
            
            // Verify operations log has been compacted to only contain remaining items
            const logPath = path.join(testIndexPath, 'operations.log');
            const logContent = await fs.readFile(logPath, 'utf-8');
            const entries = logContent.trim().split('\n').filter(line => line);
            expect(entries.length).to.equal(5); // Should have 5 remaining items
        });
    });

    describe('Validation and Statistics', () => {
        it('should validate metadata file integrity', async () => {
            index = new LocalIndex(testIndexPath);
            await index.createIndex({ 
                version: 1,
                metadata_config: {
                    indexed: ['id']
                }
            });

            // Insert items
            await index.insertItem({
                id: 'valid-1',
                vector: [1, 2, 3],
                metadata: {
                    id: 'valid-1',
                    description: 'Valid item with metadata file'
                }
            });

            // Validate - should be no missing files
            let missing = await index.validateMetadataFiles();
            expect(missing.length).to.equal(0);

            // Manually delete a metadata file to simulate corruption
            await index.beginUpdate();
            const items = (index as any)._update.items;
            const item = items.get('valid-1');
            if (item.metadataFile) {
                await fs.unlink(path.join(testIndexPath, item.metadataFile));
            }
            await index.endUpdate();

            // Validate again - should find missing file
            missing = await index.validateMetadataFiles();
            expect(missing.length).to.equal(1);
            expect(missing[0]).to.include('valid-1');
        });

        it('should report metadata storage statistics', async () => {
            index = new LocalIndex(testIndexPath);
            await index.createIndex({ 
                version: 1,
                metadata_config: {
                    indexed: ['id']
                }
            });

            // Insert items with varying metadata sizes
            const itemCount = 10;
            for (let i = 0; i < itemCount; i++) {
                await index.insertItem({
                    id: `item-${i}`,
                    vector: [i, i, i],
                    metadata: {
                        id: `item-${i}`,
                        data: 'x'.repeat((i + 1) * 100) // Increasing sizes
                    }
                });
            }

            const stats = await index.getMetadataStats();

            expect(stats.totalFiles).to.equal(itemCount);
            expect(stats.totalBytes).to.be.greaterThan(0);
            expect(stats.averageFileSize).to.be.greaterThan(0);
            expect(stats.averageFileSize).to.be.lessThan(stats.totalBytes);
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle cleanup during concurrent operations', async () => {
            index = new LocalIndex(testIndexPath);
            await index.createIndex({ 
                version: 1,
                metadata_config: {
                    indexed: ['type']
                }
            });

            // Create many operations concurrently
            const promises: Promise<any>[] = [];
            
            // Inserts
            for (let i = 0; i < 20; i++) {
                promises.push(
                    index.insertItem({
                        id: `item-${i}`,
                        vector: [i, i, i],
                        metadata: {
                            type: i % 2 === 0 ? 'even' : 'odd',
                            data: 'x'.repeat(100)
                        }
                    })
                );
            }

            await Promise.all(promises);

            // Concurrent deletes and cleanup
            const deletePromises: Promise<any>[] = [];
            
            // Delete some items
            for (let i = 0; i < 10; i++) {
                deletePromises.push(index.deleteItem(`item-${i}`));
            }

            // Run cleanup concurrently
            deletePromises.push(
                index.cleanup().catch(err => ({ error: err.message }))
            );

            const results = await Promise.all(deletePromises);

            // Verify no errors
            for (const result of results) {
                if (result && result.error) {
                    expect(result.error).to.not.include('Cannot compact');
                }
            }

            // Final cleanup should work
            const finalStats = await index.cleanup();
            expect(finalStats.errors.length).to.equal(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle cleanup on empty index', async () => {
            index = new LocalIndex(testIndexPath);
            await index.createIndex({ version: 1 });

            const stats = await index.cleanup();
            
            expect(stats.orphanedFilesDeleted).to.equal(0);
            expect(stats.bytesReclaimed).to.equal(0);
            expect(stats.errors.length).to.equal(0);
        });

        it('should handle missing metadata files gracefully', async () => {
            index = new LocalIndex(testIndexPath);
            await index.createIndex({ 
                version: 1,
                metadata_config: {
                    indexed: ['id']
                }
            });

            // Insert item
            const item = await index.insertItem({
                id: 'test-1',
                vector: [1, 2, 3],
                metadata: {
                    id: 'test-1',
                    data: 'test'
                }
            });

            // Get the metadata file reference
            const indexData = await fs.readFile(
                path.join(testIndexPath, 'index.json'),
                'utf-8'
            );
            const parsedIndex = JSON.parse(indexData);
            const metadataFile = parsedIndex.items[0].metadataFile;

            // Delete metadata file manually
            if (metadataFile) {
                await fs.unlink(path.join(testIndexPath, metadataFile));
            }

            // Delete should still work
            await index.deleteItem('test-1');

            // Verify item is deleted
            const remainingItem = await index.getItem('test-1');
            expect(remainingItem).to.be.undefined;
        });

        it('should cleanup old backup files', async () => {
            index = new LocalIndex(testIndexPath);
            await index.createIndex({ version: 1 });

            // Create old backup files
            const oldDate = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago
            const backupFiles = [
                'index.json.backup',
                'index.json.tmp',
                `index.json.${oldDate}.backup`
            ];

            for (const file of backupFiles) {
                await fs.writeFile(path.join(testIndexPath, file), '{}');
                // Set old modification time
                await fs.utimes(
                    path.join(testIndexPath, file),
                    new Date(oldDate),
                    new Date(oldDate)
                );
            }

            // Create a recent backup (should not be deleted)
            const recentBackup = 'index.json.recent.backup';
            await fs.writeFile(path.join(testIndexPath, recentBackup), '{}');

            // Run compact which includes backup cleanup
            await index.compact();

            // Check that old backups are deleted
            const remainingFiles = await fs.readdir(testIndexPath);
            for (const oldFile of backupFiles) {
                expect(remainingFiles).to.not.include(oldFile);
            }

            // Recent backup should remain
            expect(remainingFiles).to.include(recentBackup);
        });
    });
});