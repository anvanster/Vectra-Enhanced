import { expect } from 'chai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LocalIndex } from '../lib/LocalIndex';
import { DataIntegrity, dataIntegrity } from '../lib/DataIntegrity';

describe('Data Integrity Tests', () => {
    const testDir = './test-integrity';
    
    beforeEach(async () => {
        await fs.rm(testDir, { recursive: true }).catch(() => {});
        await fs.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        await fs.rm(testDir, { recursive: true }).catch(() => {});
    });

    describe('DataIntegrity Core', () => {
        it('should calculate file checksums', async () => {
            const testFile = path.join(testDir, 'test.txt');
            await fs.writeFile(testFile, 'Hello, World!');
            
            const checksum = await dataIntegrity.calculateFileChecksum(testFile);
            expect(checksum).to.be.a('string');
            expect(checksum).to.have.lengthOf(64); // SHA-256 hex
        });

        it('should calculate object checksums consistently', () => {
            const obj = { name: 'test', value: 42, items: [1, 2, 3] };
            
            const checksum1 = dataIntegrity.calculateObjectChecksum(obj);
            const checksum2 = dataIntegrity.calculateObjectChecksum(obj);
            
            expect(checksum1).to.equal(checksum2);
            
            // Different order should produce same checksum
            const obj2 = { value: 42, items: [1, 2, 3], name: 'test' };
            const checksum3 = dataIntegrity.calculateObjectChecksum(obj2);
            expect(checksum3).to.equal(checksum1);
        });

        it('should verify index integrity', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            await index.insertItem({
                vector: [1, 2, 3],
                metadata: { test: true }
            });
            
            await index.beginUpdate();
            await index.endUpdate();
            
            const result = await dataIntegrity.verifyIndexIntegrity(testDir, {
                validateStructure: true,
                validateReferences: true
            });
            
            expect(result.valid).to.be.true;
            expect(result.errors).to.have.lengthOf(0);
            expect(result.checksums.index).to.be.a('string');
        });

        it('should detect invalid index structure', async () => {
            // Create invalid index
            const indexPath = path.join(testDir, 'index.json');
            await fs.writeFile(indexPath, JSON.stringify({
                // Missing required fields
                items: []
            }));
            
            const result = await dataIntegrity.verifyIndexIntegrity(testDir, {
                validateStructure: true
            });
            
            expect(result.valid).to.be.false;
            expect(result.errors.some(e => e.includes('version'))).to.be.true;
            expect(result.errors.some(e => e.includes('distanceMetric'))).to.be.true;
        });

        it('should detect missing metadata files', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            // Insert item with metadata
            const item = await index.insertItem({
                vector: [1, 2, 3],
                metadata: { large: 'x'.repeat(1000) }
            });
            
            await index.beginUpdate();
            await index.endUpdate();
            
            // Force external metadata and then delete it
            const indexPath = path.join(testDir, 'index.json');
            const indexData = JSON.parse(await fs.readFile(indexPath, 'utf-8'));
            
            // Check if metadata is external
            if (indexData.items[0].metadataFile) {
                await fs.unlink(path.join(testDir, indexData.items[0].metadataFile));
            } else {
                // Force external metadata
                const metadata = indexData.items[0].metadata;
                const metadataFile = 'test.metadata';
                await fs.writeFile(path.join(testDir, metadataFile), JSON.stringify(metadata));
                indexData.items[0].metadataFile = metadataFile;
                delete indexData.items[0].metadata;
                await fs.writeFile(indexPath, JSON.stringify(indexData));
                
                // Now delete it
                await fs.unlink(path.join(testDir, metadataFile));
            }
            
            const result = await dataIntegrity.verifyIndexIntegrity(testDir, {
                validateReferences: true
            });
            
            expect(result.warnings.some(w => w.includes('Missing metadata file'))).to.be.true;
        });

        it('should verify WAL integrity', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ 
                version: 1,
                wal: true,
                walOptions: { checksumEnabled: true }
            });
            
            await index.insertItem({
                vector: [1, 2, 3],
                metadata: { test: true }
            });
            
            // Ensure WAL is flushed
            await index.beginUpdate();
            await index.endUpdate();
            await index.close();
            
            const result = await dataIntegrity.verifyIndexIntegrity(testDir, {
                validateChecksums: true
            });
            
            // WAL directory should exist
            const walPath = path.join(testDir, 'wal');
            const walExists = await fs.access(walPath).then(() => true).catch(() => false);
            expect(walExists).to.be.true;
            
            if (result.checksums.wal) {
                expect(result.checksums.wal).to.be.a('string');
            }
        });

        it('should verify HNSW integrity', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ 
                version: 1,
                hnswOptions: { M: 16 }
            });
            
            for (let i = 0; i < 5; i++) {
                await index.insertItem({
                    vector: [i, i, i],
                    metadata: { index: i }
                });
            }
            
            await index.close();
            
            const result = await dataIntegrity.verifyIndexIntegrity(testDir, {
                validateChecksums: true
            });
            
            expect(result.checksums.hnsw).to.be.a('string');
        });

        it('should generate integrity report', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            await index.insertItem({
                vector: [1, 2, 3],
                metadata: { test: true }
            });
            
            const report = await dataIntegrity.generateIntegrityReport(testDir);
            
            expect(report).to.include('Data Integrity Report');
            expect(report).to.include('Status: VALID');
            expect(report).to.include('Checksums:');
            expect(report).to.include('index.json:');
        });

        it('should find and repair orphaned metadata files', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            await index.insertItem({
                vector: [1, 2, 3],
                metadata: { large: 'x'.repeat(1000) }
            });
            
            // Create orphaned metadata file with UUID name
            const orphanedFile = '12345678-1234-1234-1234-123456789abc.json';
            await fs.writeFile(path.join(testDir, orphanedFile), '{}');
            
            // Ensure the index is saved first
            await index.beginUpdate();
            await index.endUpdate();
            
            const repairResult = await dataIntegrity.repairIndex(testDir, {
                repairMode: true
            });
            
            expect(repairResult.repaired).to.be.true;
            expect(repairResult.actions.some(a => a.includes(orphanedFile))).to.be.true;
            
            // Verify file was removed
            const files = await fs.readdir(testDir);
            expect(files).to.not.include(orphanedFile);
        });
    });

    describe('LocalIndex Integration', () => {
        it('should update and verify checksums', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            // Add items
            for (let i = 0; i < 3; i++) {
                await index.insertItem({
                    vector: [i, i, i],
                    metadata: { index: i, data: 'x'.repeat(1000) }
                });
            }
            
            // Update checksums
            await index.updateChecksums();
            
            // Verify checksums
            const verification = await index.verifyChecksums();
            expect(verification.valid).to.be.true;
            expect(verification.mismatches).to.have.lengthOf(0);
        });

        it('should detect checksum mismatches', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            await index.insertItem({
                vector: [1, 2, 3],
                metadata: { test: true }
            });
            
            await index.updateChecksums();
            
            // Modify index
            await index.insertItem({
                vector: [4, 5, 6],
                metadata: { test: false }
            });
            
            // Verify should fail
            const verification = await index.verifyChecksums();
            expect(verification.valid).to.be.false;
            expect(verification.mismatches).to.include('index');
        });

        it('should verify integrity through LocalIndex', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            await index.insertItem({
                vector: [1, 2, 3],
                metadata: { test: true }
            });
            
            const result = await index.verifyIntegrity({
                validateStructure: true,
                validateReferences: true,
                validateChecksums: true
            });
            
            expect(result.valid).to.be.true;
            expect(result.errors).to.have.lengthOf(0);
        });

        it('should generate report through LocalIndex', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            await index.insertItem({
                vector: [1, 2, 3],
                metadata: { test: true }
            });
            
            const report = await index.generateIntegrityReport();
            
            expect(report).to.include('Data Integrity Report');
            expect(report).to.include('Status: VALID');
        });

        it('should repair through LocalIndex', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            await index.insertItem({
                vector: [1, 2, 3],
                metadata: { large: 'x'.repeat(1000) }
            });
            
            // Create orphaned file with UUID pattern
            const orphanedFile = 'abcdef12-3456-7890-abcd-ef1234567890.json';
            await fs.writeFile(path.join(testDir, orphanedFile), '{}');
            
            const result = await index.repairIndex();
            
            expect(result.repaired).to.be.true;
            expect(result.actions).to.have.length.greaterThan(0);
        });

        it('should handle concurrent integrity checks', async () => {
            const index = new LocalIndex(testDir);
            await index.createIndex({ version: 1 });
            
            // Add multiple items
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(index.insertItem({
                    vector: [i, i, i],
                    metadata: { index: i }
                }));
            }
            await Promise.all(promises);
            
            // Concurrent integrity checks
            const checks = await Promise.all([
                index.verifyIntegrity(),
                index.verifyIntegrity(),
                index.verifyIntegrity()
            ]);
            
            checks.forEach(result => {
                expect(result.valid).to.be.true;
            });
        });
    });
});