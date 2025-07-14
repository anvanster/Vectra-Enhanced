import { LocalIndex, CreateIndexConfig } from './LocalIndex';
import { errorHandler, ErrorContext, ErrorSeverity, ErrorCategory } from './ErrorHandler';
import { IndexItem, MetadataFilter, MetadataTypes, QueryResult, IndexStats } from './types';
import { DataIntegrityOptions, IntegrityCheckResult } from './DataIntegrity';

/**
 * LocalIndex with comprehensive error handling and recovery
 */
export class LocalIndexWithErrorHandling<TMetadata extends Record<string, MetadataTypes> = Record<string, MetadataTypes>> extends LocalIndex<TMetadata> {
    private errorContext: ErrorContext;

    constructor(folderPath: string, indexName?: string) {
        super(folderPath, indexName);
        this.errorContext = {
            indexPath: folderPath
        };

        // Set up error event listeners
        this.setupErrorHandlers();
    }

    private setupErrorHandlers(): void {
        // Only add default handlers if none exist
        if (errorHandler.listenerCount('error') === 0) {
            errorHandler.on('error', (error, context) => {
                console.error(`[Vectra Error] ${error.code}: ${error.message}`);
            });
        }

        if (errorHandler.listenerCount('recovery') === 0) {
            errorHandler.on('recovery', (data) => {
                console.log(`[Vectra Recovery] Successfully recovered from ${data.error.code}`);
                console.log(`Actions taken: ${data.actions.join(', ')}`);
            });
        }

        if (errorHandler.listenerCount('retry') === 0) {
            errorHandler.on('retry', (data) => {
                console.log(`[Vectra Retry] Attempt ${data.attempt}/${data.maxRetries} for ${data.context.operation}`);
            });
        }
    }

    /**
     * Create index with error handling
     */
    public async createIndex(config: CreateIndexConfig = { version: 1, distanceMetric: 'cosine' }): Promise<void> {
        return await errorHandler.retryOperation(
            async () => {
                try {
                    await super.createIndex(config);
                } catch (error) {
                    // Check if it's a specific error we can handle
                    if ((error as Error).message === 'Index already exists' && config.deleteIfExists) {
                        await this.deleteIndex();
                        await super.createIndex(config);
                    } else {
                        throw error;
                    }
                }
            },
            { ...this.errorContext, operation: 'createIndex' }
        );
    }

    /**
     * Begin update with error handling
     */
    public async beginUpdate(): Promise<void> {
        return await errorHandler.retryOperation(
            async () => await super.beginUpdate(),
            { ...this.errorContext, operation: 'beginUpdate' }
        );
    }

    /**
     * End update with error handling and integrity check
     */
    public async endUpdate(): Promise<void> {
        try {
            await super.endUpdate();
            
            // Verify integrity after update
            const integrityCheck = await this.verifyIntegrity({
                validateStructure: true,
                validateReferences: true
            });
            
            if (!integrityCheck.valid) {
                const error = errorHandler.createError(
                    'Integrity check failed after update',
                    'INTEGRITY_CHECK_FAILED',
                    ErrorSeverity.HIGH,
                    ErrorCategory.CORRUPTION,
                    {
                        recoverable: true,
                        context: { errors: integrityCheck.errors }
                    }
                );
                
                await errorHandler.handleError(error, this.errorContext);
            }
        } catch (error) {
            await errorHandler.handleError(error as Error, {
                ...this.errorContext,
                operation: 'endUpdate'
            });
        }
    }

    /**
     * Insert item with error handling and validation
     */
    public async insertItem<TItemMetadata extends TMetadata = TMetadata>(
        item: Partial<IndexItem<TItemMetadata>>
    ): Promise<IndexItem<TItemMetadata>> {
        return await errorHandler.retryOperation(
            async () => {
                try {
                    return await super.insertItem(item);
                } catch (error) {
                    const err = error as Error;
                    
                    // Handle specific validation errors
                    if (err.message.includes('validation')) {
                        throw errorHandler.createError(
                            err.message,
                            'VALIDATION_ERROR',
                            ErrorSeverity.LOW,
                            ErrorCategory.VALIDATION,
                            {
                                recoverable: false,
                                retryable: false,
                                context: { item }
                            }
                        );
                    }
                    
                    throw error;
                }
            },
            { ...this.errorContext, operation: 'insertItem', itemId: item.id }
        );
    }

    /**
     * Upsert item with error handling
     */
    public async upsertItem<TItemMetadata extends TMetadata = TMetadata>(
        item: Partial<IndexItem<TItemMetadata>>
    ): Promise<IndexItem<TItemMetadata>> {
        return await errorHandler.retryOperation(
            async () => await super.upsertItem(item),
            { ...this.errorContext, operation: 'upsertItem', itemId: item.id }
        );
    }

    /**
     * Delete item with error handling
     */
    public async deleteItem(id: string): Promise<void> {
        return await errorHandler.retryOperation(
            async () => await super.deleteItem(id),
            { ...this.errorContext, operation: 'deleteItem', itemId: id }
        );
    }

    /**
     * Query items with error handling
     */
    public async queryItems<TItemMetadata extends TMetadata = TMetadata>(
        vector: number[],
        query: string,
        topK: number,
        filter?: MetadataFilter,
        isBm25?: boolean,
        alpha: number = 1.0
    ): Promise<QueryResult<TItemMetadata>[]> {
        return await errorHandler.retryOperation(
            async () => {
                try {
                    return await super.queryItems(vector, query, topK, filter, isBm25, alpha);
                } catch (error) {
                    const err = error as Error;
                    
                    // Handle HNSW-specific errors
                    if (err.message.includes('HNSW') || err.message.includes('dimension')) {
                        // Try to rebuild HNSW index
                        console.log('HNSW error detected, attempting to rebuild index...');
                        await this.rebuildHNSWIndex();
                        
                        // Retry query
                        return await super.queryItems(vector, query, topK, filter, isBm25, alpha);
                    }
                    
                    throw error;
                }
            },
            { ...this.errorContext, operation: 'queryItems' }
        );
    }

    /**
     * Load index with error recovery
     */
    protected async loadIndexDataWithRecovery(): Promise<void> {
        try {
            // Call the parent's protected method
            await (this as any).loadIndexData();
        } catch (error) {
            const err = error as Error;
            
            // Handle corruption errors
            if (err.message.includes('JSON') || err.message.includes('parse')) {
                const vectraError = errorHandler.createError(
                    'Index file corrupted',
                    'INDEX_CORRUPTED',
                    ErrorSeverity.CRITICAL,
                    ErrorCategory.CORRUPTION,
                    {
                        recoverable: true,
                        context: { component: 'index' }
                    }
                );
                
                await errorHandler.handleError(vectraError, this.errorContext);
            } else {
                throw error;
            }
        }
    }

    /**
     * Get index stats with error handling
     */
    public async getIndexStats(): Promise<IndexStats> {
        return await errorHandler.retryOperation(
            async () => await super.getIndexStats(),
            { ...this.errorContext, operation: 'getIndexStats' }
        );
    }

    /**
     * Verify and repair index
     */
    public async verifyAndRepair(): Promise<{
        valid: boolean;
        repaired: boolean;
        errors: string[];
        actions: string[];
    }> {
        const result = {
            valid: true,
            repaired: false,
            errors: [] as string[],
            actions: [] as string[]
        };

        try {
            // Check integrity
            const integrityCheck = await this.verifyIntegrity({
                validateStructure: true,
                validateReferences: true,
                validateChecksums: true
            });

            result.valid = integrityCheck.valid;
            result.errors = integrityCheck.errors;

            if (!integrityCheck.valid) {
                // Attempt repair
                const repairResult = await this.repairIndex();
                result.repaired = repairResult.repaired;
                result.actions = repairResult.actions;

                if (!repairResult.repaired) {
                    // Try WAL recovery
                    console.log('Attempting WAL recovery...');
                    try {
                        await this.recoverFromWAL();
                        result.actions.push('Recovered from WAL');
                        result.repaired = true;
                    } catch (walError) {
                        result.errors.push(`WAL recovery failed: ${(walError as Error).message}`);
                    }
                }
            }

            return result;
        } catch (error) {
            await errorHandler.handleError(error as Error, {
                ...this.errorContext,
                operation: 'verifyAndRepair'
            });
            throw error;
        }
    }

    /**
     * Safe close with error handling
     */
    public async close(): Promise<void> {
        try {
            await super.close();
        } catch (error) {
            console.error('Error during index close:', error);
            // Don't rethrow - we want to ensure cleanup happens
        }
    }

    /**
     * Get error statistics for this index
     */
    public async getErrorStats(): Promise<any> {
        return await errorHandler.getErrorStats();
    }

    /**
     * Handle catastrophic failure with best-effort recovery
     */
    public async handleCatastrophicFailure(): Promise<void> {
        console.error('Catastrophic failure detected, attempting recovery...');
        
        const actions: string[] = [];
        
        try {
            // 1. Try to save current state if possible
            try {
                await this.endUpdate();
                actions.push('Saved current state');
            } catch (e) {
                // Ignore
            }
            
            // 2. Close all resources
            try {
                await this.close();
                actions.push('Closed resources');
            } catch (e) {
                // Ignore
            }
            
            // 3. Verify and repair
            const repairResult = await this.verifyAndRepair();
            if (repairResult.repaired) {
                actions.push('Repaired index');
            }
            
            // 4. Rebuild HNSW if needed
            try {
                await this.rebuildHNSWIndex();
                actions.push('Rebuilt HNSW index');
            } catch (e) {
                // Ignore
            }
            
            console.log('Recovery actions completed:', actions);
        } catch (error) {
            console.error('Recovery failed:', error);
            throw errorHandler.createError(
                'Catastrophic failure recovery failed',
                'RECOVERY_FAILED',
                ErrorSeverity.CRITICAL,
                ErrorCategory.UNKNOWN,
                {
                    recoverable: false,
                    context: { actions, error: (error as Error).message }
                }
            );
        }
    }
}