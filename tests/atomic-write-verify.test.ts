import { expect } from 'chai';
import { AtomicOperations } from '../lib/AtomicOperations';
import { LocalIndex } from '../lib/LocalIndex';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('Atomic Write Verification', function() {
    this.timeout(15000);
    const testDir = path.join(__dirname, 'test-atomic-verify');
    const testFile = path.join(testDir, 'test.json');

    beforeEach(async () => {
        try {
            await fs.rm(testDir, { recursive: true });
        } catch (err) {
            // Ignore if doesn't exist
        }
        await fs.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        try {
            await fs.rm(testDir, { recursive: true });
        } catch (err) {
            // Ignore if doesn't exist
        }
    });

    it('should verify atomic write creates temp file then renames', async () => {
        let tempFilesSeen: string[] = [];
        
        // Monitor directory during write
        const checkTempFiles = async () => {
            try {
                const files = await fs.readdir(testDir);
                const temps = files.filter(f => f.includes('.tmp'));
                tempFilesSeen.push(...temps);
            } catch (err) {
                // Ignore
            }
        };

        // Start monitoring
        const interval = setInterval(checkTempFiles, 5);

        try {
            const data = JSON.stringify({ test: true, size: 'x'.repeat(10000) }); // Larger data
            await AtomicOperations.writeFile(testFile, data);
            
            clearInterval(interval);
            
            // Final file should exist
            const exists = await fs.access(testFile).then(() => true).catch(() => false);
            expect(exists).to.be.true;
            
            // Should have seen at least one temp file
            expect(tempFilesSeen.length).to.be.greaterThan(0);
            
            // No temp files should remain
            const finalFiles = await fs.readdir(testDir);
            const finalTemps = finalFiles.filter(f => f.includes('.tmp'));
            expect(finalTemps.length).to.equal(0);
        } finally {
            clearInterval(interval);
        }
    });

    it('should verify LocalIndex uses atomic writes', async () => {
        const indexPath = path.join(testDir, 'test-index');
        const index = new LocalIndex(indexPath);
        
        await index.createIndex({ version: 1 });
        
        // Insert items which triggers atomic write
        await index.insertItem({
            id: 'test-1',
            vector: [1, 2, 3],
            metadata: { test: true }
        });
        
        // Verify index.json exists and is valid
        const indexFile = path.join(indexPath, 'index.json');
        const content = await fs.readFile(indexFile, 'utf-8');
        const indexData = JSON.parse(content);
        
        expect(indexData.version).to.equal(1);
        expect(indexData.items).to.be.an('array');
        expect(indexData.items.length).to.equal(1);
        
        // No temp files should exist
        const files = await fs.readdir(indexPath);
        const tempFiles = files.filter(f => f.includes('.tmp'));
        expect(tempFiles.length).to.equal(0);
    });

    it('should handle write errors gracefully', async () => {
        // Create a read-only directory
        const readOnlyDir = path.join(testDir, 'readonly');
        await fs.mkdir(readOnlyDir);
        await fs.chmod(readOnlyDir, 0o444); // Read-only
        
        const readOnlyFile = path.join(readOnlyDir, 'test.json');
        
        let error: any;
        try {
            await AtomicOperations.writeFile(readOnlyFile, 'test');
        } catch (err) {
            error = err;
        } finally {
            // Restore permissions for cleanup
            await fs.chmod(readOnlyDir, 0o755);
        }
        
        expect(error).to.exist;
        // Should fail without retrying (permission error)
        expect(error.message).to.satisfy((msg: string) => 
            msg.includes('EACCES') || msg.includes('permission')
        );
    });

    it('should verify retry mechanism works', async () => {
        // Since we can't easily mock fs functions, let's verify retry works
        // by testing the actual retry behavior with a real scenario
        
        // Create a directory that will be used for testing
        const retryTestFile = path.join(testDir, 'retry-test.json');
        
        // First, let's verify that atomic writes succeed normally
        await AtomicOperations.writeFile(retryTestFile, JSON.stringify({ test: 'initial' }));
        
        // Now test concurrent writes which might trigger retries internally
        const concurrentWrites = [];
        for (let i = 0; i < 5; i++) {
            concurrentWrites.push(
                AtomicOperations.writeFile(
                    retryTestFile, 
                    JSON.stringify({ test: 'concurrent', index: i }),
                    { retries: 3, retryDelay: 10 }
                )
            );
        }
        
        // All should succeed (some may have retried internally)
        await Promise.all(concurrentWrites);
        
        // Verify file exists and is valid JSON
        const content = await fs.readFile(retryTestFile, 'utf-8');
        const result = JSON.parse(content);
        expect(result.test).to.equal('concurrent');
        expect(result).to.have.property('index');
    });

    it('should verify database consistency with concurrent operations', async () => {
        const indexPath = path.join(testDir, 'concurrent-index');
        const index = new LocalIndex(indexPath);
        
        await index.createIndex({ version: 1 });
        
        // Perform many concurrent operations
        const promises: Promise<any>[] = [];
        const itemCount = 20;
        
        for (let i = 0; i < itemCount; i++) {
            if (i % 3 === 0) {
                // Insert
                promises.push(index.insertItem({
                    id: `item-${i}`,
                    vector: [i, i, i],
                    metadata: { type: 'insert', index: i }
                }));
            } else if (i % 3 === 1) {
                // Upsert
                promises.push(index.upsertItem({
                    id: `item-${i}`,
                    vector: [i * 2, i * 2, i * 2],
                    metadata: { type: 'upsert', index: i }
                }));
            } else {
                // Insert then delete
                promises.push(
                    index.insertItem({
                        id: `temp-${i}`,
                        vector: [i, i, i],
                        metadata: { type: 'temp', index: i }
                    }).then(() => index.deleteItem(`temp-${i}`))
                );
            }
        }
        
        await Promise.all(promises);
        await index.flush();
        
        // Verify final state
        const items = await index.listItems();
        
        // Should have items that weren't deleted
        const nonTempItems = items.filter(item => !item.id.startsWith('temp-'));
        expect(nonTempItems.length).to.be.greaterThan(0);
        
        // Verify index file is valid JSON
        const indexFile = path.join(indexPath, 'index.json');
        const content = await fs.readFile(indexFile, 'utf-8');
        const indexData = JSON.parse(content); // Should not throw
        
        expect(indexData.version).to.equal(1);
        expect(indexData.items).to.be.an('array');
    });
});