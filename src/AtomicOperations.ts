import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class AtomicOperations {
    /**
     * Atomically write data to a file by writing to a temporary file first
     * then renaming it to the target path.
     */
    static async writeFile(
        filePath: string, 
        data: string | Buffer,
        options: { retries?: number; retryDelay?: number } = {}
    ): Promise<void> {
        const { retries = 3, retryDelay = 100 } = options;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await this.performAtomicWrite(filePath, data);
                return; // Success!
            } catch (err: any) {
                const isLastAttempt = attempt === retries;
                
                // Don't retry on certain errors
                if (this.isNonRetriableError(err)) {
                    throw err;
                }
                
                if (isLastAttempt) {
                    throw new Error(`Atomic write failed after ${retries} attempts: ${err.message}`);
                }
                
                // Exponential backoff
                const delay = retryDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    private static async performAtomicWrite(filePath: string, data: string | Buffer): Promise<void> {
        const dir = path.dirname(filePath);
        const tempPath = path.join(dir, `.${path.basename(filePath)}.${uuidv4()}.tmp`);

        try {
            // Write to temporary file
            await fs.writeFile(tempPath, data, { flag: 'w' });
            
            // Ensure data is written to disk
            const fd = await fs.open(tempPath, 'r');
            await fd.sync();
            await fd.close();
            
            // Atomically rename temp file to target
            await fs.rename(tempPath, filePath);
        } catch (err) {
            // Clean up temp file on error
            try {
                await fs.unlink(tempPath);
            } catch (cleanupErr) {
                // Ignore cleanup errors
            }
            throw err;
        }
    }

    private static isNonRetriableError(err: any): boolean {
        // Don't retry on these errors
        const nonRetriableCodes = [
            'EACCES',  // Permission denied
            'EISDIR',  // Is a directory
            'ENOTDIR', // Not a directory
            'EINVAL',  // Invalid argument
            'ENOENT',  // No such file or directory (for parent dir)
        ];
        
        // If error doesn't have a code, check message
        if (!err.code) {
            // Don't retry on validation errors
            if (err.message && err.message.includes('Invalid')) {
                return true;
            }
            return false;
        }
        
        return nonRetriableCodes.includes(err.code);
    }

    /**
     * Read file with retry logic for handling concurrent access
     */
    static async readFile(filePath: string, retries: number = 3): Promise<Buffer> {
        for (let i = 0; i < retries; i++) {
            try {
                return await fs.readFile(filePath);
            } catch (err: any) {
                if (err.code === 'ENOENT' && i < retries - 1) {
                    // File doesn't exist yet, wait a bit and retry
                    await new Promise(resolve => setTimeout(resolve, 10 * (i + 1)));
                    continue;
                }
                throw err;
            }
        }
        throw new Error(`Failed to read file after ${retries} attempts`);
    }

    /**
     * Atomically update a JSON file
     */
    static async updateJsonFile<T>(
        filePath: string, 
        updateFn: (data: T) => T | Promise<T>,
        options: { retries?: number; retryDelay?: number } = {}
    ): Promise<void> {
        const { retries = 3, retryDelay = 100 } = options;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const data = await this.readFile(filePath);
                const json = JSON.parse(data.toString()) as T;
                const updated = await updateFn(json);
                await this.writeFile(filePath, JSON.stringify(updated), options);
                return; // Success!
            } catch (err: any) {
                const isLastAttempt = attempt === retries;
                
                if (this.isNonRetriableError(err)) {
                    throw err;
                }
                
                if (isLastAttempt) {
                    throw new Error(`Atomic JSON update failed after ${retries} attempts: ${err.message}`);
                }
                
                // Exponential backoff
                const delay = retryDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    /**
     * Create a backup of a file before modifying it
     */
    static async createBackup(filePath: string): Promise<string> {
        const backupPath = `${filePath}.${Date.now()}.backup`;
        await fs.copyFile(filePath, backupPath);
        return backupPath;
    }

    /**
     * Restore from a backup file
     */
    static async restoreBackup(backupPath: string, targetPath: string): Promise<void> {
        await fs.copyFile(backupPath, targetPath);
    }

    /**
     * Clean up old backup files
     */
    static async cleanupBackups(
        dir: string, 
        pattern: RegExp, 
        maxAge: number = 7 * 24 * 60 * 60 * 1000 // 7 days
    ): Promise<void> {
        const files = await fs.readdir(dir);
        const now = Date.now();

        for (const file of files) {
            if (pattern.test(file)) {
                const filePath = path.join(dir, file);
                const stats = await fs.stat(filePath);
                if (now - stats.mtime.getTime() > maxAge) {
                    await fs.unlink(filePath);
                }
            }
        }
    }
}