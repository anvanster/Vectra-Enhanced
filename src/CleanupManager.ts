import * as fs from 'fs/promises';
import * as path from 'path';

export interface CleanupStats {
    metadataFilesDeleted: number;
    orphanedFilesDeleted: number;
    bytesReclaimed: number;
    errors: string[];
}

export class CleanupManager {
    /**
     * Deletes a metadata file safely
     */
    static async deleteMetadataFile(folderPath: string, metadataFile: string): Promise<void> {
        if (!metadataFile) return;
        
        const metadataPath = path.join(folderPath, metadataFile);
        try {
            await fs.unlink(metadataPath);
        } catch (err: any) {
            // Ignore if file doesn't exist
            if (err.code !== 'ENOENT') {
                throw new Error(`Failed to delete metadata file ${metadataFile}: ${err.message}`);
            }
        }
    }

    /**
     * Finds orphaned metadata files (files not referenced in the index)
     */
    static async findOrphanedMetadataFiles(
        folderPath: string, 
        referencedFiles: Set<string>
    ): Promise<string[]> {
        const orphaned: string[] = [];
        
        try {
            const files = await fs.readdir(folderPath);
            
            for (const file of files) {
                // Check if it's a metadata file (UUID.json pattern)
                if (file.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$/i)) {
                    if (!referencedFiles.has(file)) {
                        orphaned.push(file);
                    }
                }
            }
        } catch (err) {
            // Directory might not exist
            return [];
        }
        
        return orphaned;
    }

    /**
     * Cleans up orphaned metadata files
     */
    static async cleanupOrphanedFiles(
        folderPath: string,
        orphanedFiles: string[]
    ): Promise<CleanupStats> {
        const stats: CleanupStats = {
            metadataFilesDeleted: 0,
            orphanedFilesDeleted: 0,
            bytesReclaimed: 0,
            errors: []
        };

        for (const file of orphanedFiles) {
            try {
                const filePath = path.join(folderPath, file);
                const stat = await fs.stat(filePath);
                await fs.unlink(filePath);
                
                stats.orphanedFilesDeleted++;
                stats.bytesReclaimed += stat.size;
            } catch (err: any) {
                stats.errors.push(`Failed to delete ${file}: ${err.message}`);
            }
        }

        return stats;
    }

    /**
     * Gets all referenced metadata files from index items
     */
    static getReferencedMetadataFiles(items: Map<string, any>): Set<string> {
        const referenced = new Set<string>();
        
        for (const item of items.values()) {
            if (item.metadataFile) {
                referenced.add(item.metadataFile);
            }
        }
        
        return referenced;
    }

    /**
     * Performs a full cleanup of the index
     */
    static async performFullCleanup(
        folderPath: string,
        items: Map<string, any>
    ): Promise<CleanupStats> {
        const referenced = this.getReferencedMetadataFiles(items);
        const orphaned = await this.findOrphanedMetadataFiles(folderPath, referenced);
        return await this.cleanupOrphanedFiles(folderPath, orphaned);
    }

    /**
     * Validates that all referenced metadata files exist
     */
    static async validateMetadataFiles(
        folderPath: string,
        items: Map<string, any>
    ): Promise<string[]> {
        const missing: string[] = [];
        
        for (const [id, item] of items.entries()) {
            if (item.metadataFile) {
                const metadataPath = path.join(folderPath, item.metadataFile);
                try {
                    await fs.access(metadataPath);
                } catch (err) {
                    missing.push(`Item ${id} references missing file: ${item.metadataFile}`);
                }
            }
        }
        
        return missing;
    }

    /**
     * Cleans up old backup files
     */
    static async cleanupOldBackups(
        folderPath: string,
        pattern: RegExp = /\.(backup|tmp)$/,
        maxAge: number = 7 * 24 * 60 * 60 * 1000 // 7 days
    ): Promise<number> {
        let deletedCount = 0;
        const now = Date.now();
        
        try {
            const files = await fs.readdir(folderPath);
            
            for (const file of files) {
                if (pattern.test(file)) {
                    const filePath = path.join(folderPath, file);
                    try {
                        const stat = await fs.stat(filePath);
                        if (now - stat.mtime.getTime() > maxAge) {
                            await fs.unlink(filePath);
                            deletedCount++;
                        }
                    } catch (err) {
                        // Ignore individual file errors
                    }
                }
            }
        } catch (err) {
            // Directory might not exist
        }
        
        return deletedCount;
    }

    /**
     * Estimates disk space used by metadata files
     */
    static async getMetadataStorageStats(
        folderPath: string,
        items: Map<string, any>
    ): Promise<{
        totalFiles: number;
        totalBytes: number;
        averageFileSize: number;
    }> {
        let totalFiles = 0;
        let totalBytes = 0;
        
        for (const item of items.values()) {
            if (item.metadataFile) {
                try {
                    const metadataPath = path.join(folderPath, item.metadataFile);
                    const stat = await fs.stat(metadataPath);
                    totalFiles++;
                    totalBytes += stat.size;
                } catch (err) {
                    // File might be missing
                }
            }
        }
        
        return {
            totalFiles,
            totalBytes,
            averageFileSize: totalFiles > 0 ? Math.round(totalBytes / totalFiles) : 0
        };
    }
}