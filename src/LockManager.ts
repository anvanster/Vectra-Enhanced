import * as lockfile from 'proper-lockfile';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface LockOptions {
    retries?: number;
    minTimeout?: number;
    maxTimeout?: number;
    stale?: number;
}

export interface Lock {
    release: () => Promise<void>;
    extend: (ms: number) => Promise<void>;
}

export class LockManager {
    private readonly defaultOptions: LockOptions = {
        retries: 10,
        minTimeout: 100,
        maxTimeout: 1000,
        stale: 30000
    };

    private readonly locks: Map<string, Lock> = new Map();

    async acquireWriteLock(indexPath: string, options?: LockOptions): Promise<Lock> {
        const indexFile = path.join(indexPath, 'index.json');
        const opts = { ...this.defaultOptions, ...options };

        // Ensure index file exists
        try {
            await fs.access(indexFile);
        } catch (err) {
            // If index doesn't exist, create a temporary lock file
            const lockFile = path.join(indexPath, '.vectra.lock');
            await fs.writeFile(lockFile, '', { flag: 'a' });
            
            const release = await lockfile.lock(lockFile, {
                retries: {
                    retries: opts.retries!,
                    minTimeout: opts.minTimeout,
                    maxTimeout: opts.maxTimeout,
                    factor: 2
                },
                stale: opts.stale,
                update: 5000
            });

            const lock: Lock = {
                release: async () => {
                    await release();
                    this.locks.delete(indexPath);
                },
                extend: async (ms: number) => {
                    // Extension not supported for temporary lock files
                }
            };

            this.locks.set(indexPath, lock);
            return lock;
        }

        const release = await lockfile.lock(indexFile, {
            retries: {
                retries: opts.retries!,
                minTimeout: opts.minTimeout,
                maxTimeout: opts.maxTimeout,
                factor: 2
            },
            stale: opts.stale,
            update: 5000
        });

        const lock: Lock = {
            release: async () => {
                await release();
                this.locks.delete(indexPath);
            },
            extend: async (ms: number) => {
                await lockfile.unlock(indexFile);
                const newRelease = await lockfile.lock(indexFile, {
                    retries: {
                        retries: opts.retries!,
                        minTimeout: opts.minTimeout,
                        maxTimeout: opts.maxTimeout,
                        factor: 2
                    },
                    stale: ms,
                    update: Math.min(ms / 2, 5000)
                });
                (lock as any).release = async () => {
                    await newRelease();
                    this.locks.delete(indexPath);
                };
            }
        };

        this.locks.set(indexPath, lock);
        return lock;
    }

    async acquireReadLock(indexPath: string, options?: LockOptions): Promise<Lock> {
        // For read locks, we'll use a simpler approach
        // In a real implementation, you might want to use reader-writer locks
        // For now, we'll just return a no-op lock for reads since they don't modify data
        
        return {
            release: async () => {
                // No-op for read locks
            },
            extend: async (ms: number) => {
                // No-op for read locks
            }
        };
    }

    async tryAcquireWriteLock(indexPath: string, options?: LockOptions): Promise<Lock | null> {
        try {
            const indexFile = path.join(indexPath, 'index.json');
            const opts = { ...this.defaultOptions, ...options, retries: 0 };

            // Check if file exists
            try {
                await fs.access(indexFile);
            } catch (err) {
                // If index doesn't exist, create a temporary lock file
                const lockFile = path.join(indexPath, '.vectra.lock');
                await fs.writeFile(lockFile, '', { flag: 'a' });
                
                const release = await lockfile.lock(lockFile, {
                    retries: 0,
                    stale: opts.stale,
                    update: 5000
                });

                const lock: Lock = {
                    release: async () => {
                        await release();
                        this.locks.delete(indexPath);
                    },
                    extend: async (ms: number) => {
                        // Extension not supported for temporary lock files
                    }
                };

                this.locks.set(indexPath, lock);
                return lock;
            }

            const release = await lockfile.lock(indexFile, {
                retries: 0,
                stale: opts.stale,
                update: 5000
            });

            const lock: Lock = {
                release: async () => {
                    await release();
                    this.locks.delete(indexPath);
                },
                extend: async (ms: number) => {
                    await lockfile.unlock(indexFile);
                    const newRelease = await lockfile.lock(indexFile, {
                        retries: 0,
                        stale: ms,
                        update: Math.min(ms / 2, 5000)
                    });
                    (lock as any).release = async () => {
                        await newRelease();
                        this.locks.delete(indexPath);
                    };
                }
            };

            this.locks.set(indexPath, lock);
            return lock;
        } catch (err) {
            return null;
        }
    }

    async isWriteLocked(indexPath: string): Promise<boolean> {
        const indexFile = path.join(indexPath, 'index.json');
        try {
            await fs.access(indexFile);
            return await lockfile.check(indexFile);
        } catch (err) {
            // Check temporary lock file
            const lockFile = path.join(indexPath, '.vectra.lock');
            try {
                await fs.access(lockFile);
                return await lockfile.check(lockFile);
            } catch (err2) {
                return false;
            }
        }
    }

    async releaseAllLocks(): Promise<void> {
        const releases = Array.from(this.locks.values()).map(lock => lock.release());
        await Promise.all(releases);
        this.locks.clear();
    }
}

export const lockManager = new LockManager();

process.on('exit', () => {
    lockManager.releaseAllLocks().catch(() => {});
});

process.on('SIGINT', async () => {
    await lockManager.releaseAllLocks();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await lockManager.releaseAllLocks();
    process.exit(0);
});