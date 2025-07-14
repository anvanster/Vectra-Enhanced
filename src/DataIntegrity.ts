import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IndexItem, MetadataTypes } from './types';

export interface IntegrityCheckResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    checksums: {
        index?: string;
        metadata?: Map<string, string>;
        wal?: string;
        operationsLog?: string;
        hnsw?: string;
    };
}

export interface DataIntegrityOptions {
    validateChecksums?: boolean;
    validateStructure?: boolean;
    validateReferences?: boolean;
    repairMode?: boolean;
    verbose?: boolean;
}

export class DataIntegrity {
    private readonly checksumAlgorithm = 'sha256';

    /**
     * Calculate checksum for a file
     */
    async calculateFileChecksum(filePath: string): Promise<string> {
        const data = await fs.readFile(filePath);
        return crypto.createHash(this.checksumAlgorithm).update(data).digest('hex');
    }

    /**
     * Calculate checksum for an object
     */
    calculateObjectChecksum(obj: any): string {
        const data = JSON.stringify(obj, Object.keys(obj).sort());
        return crypto.createHash(this.checksumAlgorithm).update(data).digest('hex');
    }

    /**
     * Calculate checksum for index data
     */
    calculateIndexChecksum(items: Map<string, IndexItem>): string {
        const sortedItems = Array.from(items.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        const data = JSON.stringify(sortedItems);
        return crypto.createHash(this.checksumAlgorithm).update(data).digest('hex');
    }

    /**
     * Verify index integrity
     */
    async verifyIndexIntegrity(
        folderPath: string,
        options: DataIntegrityOptions = {}
    ): Promise<IntegrityCheckResult> {
        const result: IntegrityCheckResult = {
            valid: true,
            errors: [],
            warnings: [],
            checksums: {}
        };

        try {
            // Check index.json
            const indexPath = path.join(folderPath, 'index.json');
            const indexExists = await this.fileExists(indexPath);
            
            if (!indexExists) {
                result.valid = false;
                result.errors.push('index.json not found');
                return result;
            }

            // Read and validate index structure
            const indexData = await fs.readFile(indexPath, 'utf-8');
            let index: any;
            
            try {
                index = JSON.parse(indexData);
            } catch (err) {
                result.valid = false;
                result.errors.push(`Invalid JSON in index.json: ${err}`);
                return result;
            }

            // Calculate index checksum
            result.checksums.index = await this.calculateFileChecksum(indexPath);

            // Validate index structure
            if (options.validateStructure) {
                const structureErrors = this.validateIndexStructure(index);
                if (structureErrors.length > 0) {
                    result.valid = false;
                    result.errors.push(...structureErrors);
                }
            }

            // Check metadata files
            if (options.validateReferences) {
                result.checksums.metadata = new Map();
                const metadataErrors = await this.validateMetadataFiles(folderPath, index.items);
                if (metadataErrors.length > 0) {
                    result.warnings.push(...metadataErrors);
                }
            }

            // Check WAL integrity
            const walPath = path.join(folderPath, 'wal');
            if (await this.fileExists(walPath)) {
                const walResult = await this.verifyWALIntegrity(walPath, options);
                if (!walResult.valid) {
                    result.warnings.push(...walResult.errors);
                }
                result.checksums.wal = walResult.checksum;
            }

            // Check operations log
            const opsLogPath = path.join(folderPath, 'operations.log');
            if (await this.fileExists(opsLogPath)) {
                result.checksums.operationsLog = await this.calculateFileChecksum(opsLogPath);
            }

            // Check HNSW index
            const hnswIndexPath = path.join(folderPath, 'hnsw.index');
            const hnswMetaPath = path.join(folderPath, 'hnsw.meta');
            if (await this.fileExists(hnswIndexPath) && await this.fileExists(hnswMetaPath)) {
                const hnswResult = await this.verifyHNSWIntegrity(folderPath, options);
                if (!hnswResult.valid) {
                    result.warnings.push(...hnswResult.errors);
                }
                result.checksums.hnsw = hnswResult.checksum;
            }

        } catch (err) {
            result.valid = false;
            result.errors.push(`Unexpected error during integrity check: ${err}`);
        }

        return result;
    }

    /**
     * Validate index structure
     */
    private validateIndexStructure(index: any): string[] {
        const errors: string[] = [];

        // Check required fields
        if (!index.version) {
            errors.push('Missing required field: version');
        }
        if (!index.items || !Array.isArray(index.items)) {
            errors.push('Missing or invalid field: items');
        }
        if (!index.distanceMetric) {
            errors.push('Missing required field: distanceMetric');
        }

        // Validate items
        if (Array.isArray(index.items)) {
            index.items.forEach((item: any, i: number) => {
                if (!item.id) {
                    errors.push(`Item at index ${i} missing id`);
                }
                if (!item.vector || !Array.isArray(item.vector)) {
                    errors.push(`Item ${item.id || i} has invalid vector`);
                }
                if (item.norm !== undefined && typeof item.norm !== 'number') {
                    errors.push(`Item ${item.id || i} has invalid norm`);
                }
            });
        }

        return errors;
    }

    /**
     * Validate metadata files
     */
    private async validateMetadataFiles(
        folderPath: string,
        items: any[]
    ): Promise<string[]> {
        const errors: string[] = [];
        const metadataFiles = new Set<string>();

        // Collect all referenced metadata files
        for (const item of items) {
            if (item.metadataFile) {
                metadataFiles.add(item.metadataFile);
            }
        }

        // Check each metadata file exists
        for (const metadataFile of metadataFiles) {
            const metadataPath = path.join(folderPath, metadataFile);
            if (!(await this.fileExists(metadataPath))) {
                errors.push(`Missing metadata file: ${metadataFile}`);
            }
        }

        return errors;
    }

    /**
     * Verify WAL integrity
     */
    private async verifyWALIntegrity(
        walPath: string,
        options: DataIntegrityOptions
    ): Promise<{ valid: boolean; errors: string[]; checksum?: string }> {
        const result = {
            valid: true,
            errors: [] as string[],
            checksum: undefined as string | undefined
        };

        try {
            // List WAL files
            const files = await fs.readdir(walPath);
            const walFiles = files.filter(f => f.endsWith('.wal')).sort();

            if (walFiles.length === 0) {
                return result;
            }

            // Check current WAL
            const currentWalPath = path.join(walPath, walFiles[walFiles.length - 1]);
            result.checksum = await this.calculateFileChecksum(currentWalPath);

            if (options.validateChecksums) {
                // Read and validate entries
                const content = await fs.readFile(currentWalPath, 'utf-8');
                const lines = content.trim().split('\n').filter(line => line.length > 0);

                for (let i = 0; i < lines.length; i++) {
                    try {
                        const entry = JSON.parse(lines[i]);
                        if (entry.checksum) {
                            // Recalculate checksum
                            const calculated = this.calculateObjectChecksum({
                                id: entry.id,
                                timestamp: entry.timestamp,
                                operation: entry.operation,
                                data: entry.data
                            });
                            
                            if (calculated !== entry.checksum) {
                                result.valid = false;
                                result.errors.push(`WAL entry ${i} checksum mismatch`);
                            }
                        }
                    } catch (err) {
                        result.valid = false;
                        result.errors.push(`Invalid WAL entry at line ${i}: ${err}`);
                    }
                }
            }
        } catch (err) {
            result.valid = false;
            result.errors.push(`Error reading WAL: ${err}`);
        }

        return result;
    }

    /**
     * Verify HNSW integrity
     */
    private async verifyHNSWIntegrity(
        folderPath: string,
        options: DataIntegrityOptions
    ): Promise<{ valid: boolean; errors: string[]; checksum?: string }> {
        const result = {
            valid: true,
            errors: [] as string[],
            checksum: undefined as string | undefined
        };

        try {
            const metadataPath = path.join(folderPath, 'hnsw.meta');
            const indexPath = path.join(folderPath, 'hnsw.index');

            // Read metadata
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(metadataContent);

            // Calculate index checksum
            result.checksum = await this.calculateFileChecksum(indexPath);

            // Verify stored checksum if present
            if (options.validateChecksums && metadata.checksum) {
                if (metadata.checksum !== result.checksum) {
                    result.valid = false;
                    result.errors.push('HNSW index checksum mismatch');
                }
            }

            // Validate metadata structure
            if (!metadata.dimensions || !metadata.distanceMetric) {
                result.valid = false;
                result.errors.push('Invalid HNSW metadata structure');
            }

        } catch (err) {
            result.valid = false;
            result.errors.push(`Error verifying HNSW: ${err}`);
        }

        return result;
    }

    /**
     * Repair index issues
     */
    async repairIndex(
        folderPath: string,
        options: DataIntegrityOptions = {}
    ): Promise<{ repaired: boolean; actions: string[] }> {
        const result = {
            repaired: false,
            actions: [] as string[]
        };

        const integrityCheck = await this.verifyIndexIntegrity(folderPath, {
            ...options,
            validateStructure: true,
            validateReferences: true
        });

        // Attempt repairs even if integrity check passes
        // (orphaned files don't affect validity but should still be cleaned)
        if (options.repairMode) {
            // Remove orphaned metadata files
            const orphanedFiles = await this.findOrphanedMetadataFiles(folderPath);
            for (const file of orphanedFiles) {
                try {
                    await fs.unlink(path.join(folderPath, file));
                    result.actions.push(`Removed orphaned metadata file: ${file}`);
                    result.repaired = true;
                } catch (err) {
                    result.actions.push(`Failed to remove ${file}: ${err}`);
                }
            }

            // TODO: Add more repair actions as needed
        }

        return result;
    }

    /**
     * Find orphaned metadata files
     */
    private async findOrphanedMetadataFiles(folderPath: string): Promise<string[]> {
        const orphaned: string[] = [];

        try {
            // Read index
            const indexPath = path.join(folderPath, 'index.json');
            const indexData = await fs.readFile(indexPath, 'utf-8');
            const index = JSON.parse(indexData);

            // Get referenced metadata files
            const referenced = new Set<string>();
            for (const item of index.items || []) {
                if (item.metadataFile) {
                    referenced.add(item.metadataFile);
                }
            }

            // Check all metadata files (.json files that are not index.json)
            const files = await fs.readdir(folderPath);
            for (const file of files) {
                if (file.endsWith('.json') && file !== 'index.json' && !referenced.has(file)) {
                    // Check if it's likely a metadata file (UUID pattern)
                    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$/i;
                    if (uuidPattern.test(file)) {
                        orphaned.push(file);
                    }
                }
            }
        } catch (err) {
            // Ignore errors
        }

        return orphaned;
    }

    /**
     * Generate integrity report
     */
    async generateIntegrityReport(
        folderPath: string,
        options: DataIntegrityOptions = {}
    ): Promise<string> {
        const result = await this.verifyIndexIntegrity(folderPath, {
            ...options,
            validateStructure: true,
            validateReferences: true,
            validateChecksums: true
        });

        let report = `Data Integrity Report for ${folderPath}\n`;
        report += `${'='.repeat(60)}\n\n`;
        report += `Status: ${result.valid ? 'VALID' : 'INVALID'}\n`;
        report += `Generated: ${new Date().toISOString()}\n\n`;

        if (result.errors.length > 0) {
            report += `Errors (${result.errors.length}):\n`;
            result.errors.forEach(err => report += `  - ${err}\n`);
            report += '\n';
        }

        if (result.warnings.length > 0) {
            report += `Warnings (${result.warnings.length}):\n`;
            result.warnings.forEach(warn => report += `  - ${warn}\n`);
            report += '\n';
        }

        report += 'Checksums:\n';
        if (result.checksums.index) {
            report += `  - index.json: ${result.checksums.index}\n`;
        }
        if (result.checksums.wal) {
            report += `  - WAL: ${result.checksums.wal}\n`;
        }
        if (result.checksums.operationsLog) {
            report += `  - operations.log: ${result.checksums.operationsLog}\n`;
        }
        if (result.checksums.hnsw) {
            report += `  - HNSW index: ${result.checksums.hnsw}\n`;
        }

        return report;
    }

    /**
     * Check if file exists
     */
    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

// Export singleton instance
export const dataIntegrity = new DataIntegrity();