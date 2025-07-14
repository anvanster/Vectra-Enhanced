import { expect } from 'chai';
import { AtomicOperations } from '../lib/AtomicOperations';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('Atomic Write Operations Tests', function() {
    this.timeout(10000);
    const testDir = path.join(__dirname, 'test-atomic');
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

    it('should write atomically with temp file', async () => {
        const data = JSON.stringify({ test: true, timestamp: Date.now() });
        
        await AtomicOperations.writeFile(testFile, data);
        
        const content = await fs.readFile(testFile, 'utf-8');
        expect(JSON.parse(content).test).to.be.true;
        
        // Ensure no temp files are left
        const files = await fs.readdir(testDir);
        const tempFiles = files.filter(f => f.includes('.tmp'));
        expect(tempFiles.length).to.equal(0);
    });

    it('should retry on transient failures', async () => {
        let attemptCount = 0;
        const originalWriteFile = fs.writeFile;
        
        // Mock fs.writeFile to fail twice then succeed
        (fs as any).writeFile = async (path: string, data: any, options: any) => {
            attemptCount++;
            if (attemptCount < 3 && path.includes('.tmp')) {
                throw new Error('ENOSPC: no space left on device');
            }
            return originalWriteFile(path, data, options);
        };

        try {
            const data = JSON.stringify({ test: 'retry' });
            await AtomicOperations.writeFile(testFile, data, { retries: 3, retryDelay: 50 });
            
            expect(attemptCount).to.equal(3);
            
            const content = await fs.readFile(testFile, 'utf-8');
            expect(JSON.parse(content).test).to.equal('retry');
        } finally {
            // Restore original function
            (fs as any).writeFile = originalWriteFile;
        }
    });

    it('should not retry on non-retriable errors', async () => {
        // Try to write to a file with invalid name
        const invalidPath = path.join(testDir, '\0invalid.json'); // Null character is invalid
        
        let error: any;
        try {
            await AtomicOperations.writeFile(invalidPath, 'test');
        } catch (err) {
            error = err;
        }
        
        expect(error).to.exist;
        expect(error.message).to.not.include('after 3 attempts'); // Should fail immediately
    });

    it('should handle concurrent atomic writes', async () => {
        const promises: Promise<void>[] = [];
        
        // Start 10 concurrent writes
        for (let i = 0; i < 10; i++) {
            const data = JSON.stringify({ index: i, timestamp: Date.now() });
            promises.push(AtomicOperations.writeFile(testFile, data));
        }
        
        await Promise.all(promises);
        
        // One of them should have won
        const content = await fs.readFile(testFile, 'utf-8');
        const result = JSON.parse(content);
        expect(result).to.have.property('index');
        expect(result.index).to.be.gte(0).and.lte(9);
    });

    it('should atomically update JSON files with retry', async () => {
        // Create initial file
        await AtomicOperations.writeFile(testFile, JSON.stringify({ count: 0 }));
        
        let updateAttempts = 0;
        
        // Update with simulated failures
        await AtomicOperations.updateJsonFile(testFile, (data: any) => {
            updateAttempts++;
            if (updateAttempts < 2) {
                throw new Error('Simulated update failure');
            }
            return { ...data, count: data.count + 1, updated: true };
        }, { retries: 3, retryDelay: 50 });
        
        const content = await fs.readFile(testFile, 'utf-8');
        const result = JSON.parse(content);
        
        expect(result.count).to.equal(1);
        expect(result.updated).to.be.true;
        expect(updateAttempts).to.equal(2);
    });

    it('should handle write failures with proper cleanup', async () => {
        const originalRename = fs.rename;
        
        // Mock fs.rename to always fail
        (fs as any).rename = async () => {
            throw new Error('EACCES: permission denied');
        };

        try {
            let error: any;
            try {
                await AtomicOperations.writeFile(testFile, 'test', { retries: 2, retryDelay: 50 });
            } catch (err) {
                error = err;
            }
            
            expect(error).to.exist;
            expect(error.message).to.include('permission denied');
            
            // Ensure no temp files are left
            const files = await fs.readdir(testDir);
            const tempFiles = files.filter(f => f.includes('.tmp'));
            expect(tempFiles.length).to.equal(0);
        } finally {
            // Restore original function
            (fs as any).rename = originalRename;
        }
    });

    it('should create and restore backups', async () => {
        // Create initial file
        const originalData = { version: 1, data: 'original' };
        await AtomicOperations.writeFile(testFile, JSON.stringify(originalData));
        
        // Create backup
        const backupPath = await AtomicOperations.createBackup(testFile);
        
        // Modify original file
        await AtomicOperations.writeFile(testFile, JSON.stringify({ version: 2, data: 'modified' }));
        
        // Verify file was modified
        let content = await fs.readFile(testFile, 'utf-8');
        expect(JSON.parse(content).version).to.equal(2);
        
        // Restore from backup
        await AtomicOperations.restoreBackup(backupPath, testFile);
        
        // Verify restoration
        content = await fs.readFile(testFile, 'utf-8');
        expect(JSON.parse(content).version).to.equal(1);
        expect(JSON.parse(content).data).to.equal('original');
        
        // Cleanup
        await fs.unlink(backupPath);
    });
});