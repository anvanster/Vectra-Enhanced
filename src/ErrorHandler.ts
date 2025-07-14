import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import { LocalIndex } from './LocalIndex';
import { dataIntegrity } from './DataIntegrity';
import { walManager } from './WAL';
import { operationsLogManager } from './OperationsLog';

export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export enum ErrorCategory {
    IO = 'io',
    CORRUPTION = 'corruption',
    CONCURRENCY = 'concurrency',
    VALIDATION = 'validation',
    MEMORY = 'memory',
    CONFIGURATION = 'configuration',
    UNKNOWN = 'unknown'
}

export interface VectraError extends Error {
    code: string;
    severity: ErrorSeverity;
    category: ErrorCategory;
    recoverable: boolean;
    context?: Record<string, any>;
    timestamp: Date;
    retryable: boolean;
    cause?: Error;
}

export interface ErrorRecoveryStrategy {
    canRecover(error: VectraError): boolean;
    recover(error: VectraError, context: ErrorContext): Promise<RecoveryResult>;
    priority: number;
}

export interface RecoveryResult {
    recovered: boolean;
    actions: string[];
    newError?: VectraError;
}

export interface ErrorContext {
    indexPath: string;
    operation?: string;
    itemId?: string;
    metadata?: Record<string, any>;
}

export interface ErrorHandlerOptions {
    maxRetries?: number;
    retryDelay?: number;
    enableAutoRecovery?: boolean;
    logErrors?: boolean;
    errorLogPath?: string;
    recoveryStrategies?: ErrorRecoveryStrategy[];
}

export class ErrorHandler extends EventEmitter {
    private options: Required<ErrorHandlerOptions>;
    private errorLog: string[] = [];
    private recoveryStrategies: ErrorRecoveryStrategy[] = [];
    private retryCount: Map<string, number> = new Map();

    constructor(options: ErrorHandlerOptions = {}) {
        super();
        this.options = {
            maxRetries: options.maxRetries ?? 3,
            retryDelay: options.retryDelay ?? 1000,
            enableAutoRecovery: options.enableAutoRecovery ?? true,
            logErrors: options.logErrors ?? true,
            errorLogPath: options.errorLogPath ?? './errors.log',
            recoveryStrategies: options.recoveryStrategies ?? []
        };

        // Initialize default recovery strategies
        this.initializeDefaultStrategies();
        
        // Add custom strategies
        this.recoveryStrategies.push(...this.options.recoveryStrategies);
        
        // Sort by priority
        this.recoveryStrategies.sort((a, b) => b.priority - a.priority);
        
        // Add a safety warning after a short delay to allow setup
        setTimeout(() => {
            if (this.listenerCount('error') === 0 && this.options.logErrors) {
                console.warn(
                    '[Vectra Warning] No error event listeners detected. ' +
                    'Errors will be logged to console instead. ' +
                    'Consider adding: errorHandler.on("error", (err) => { /* handle */ })'
                );
            }
        }, 1000);
    }

    /**
     * Create a VectraError with full context
     */
    createError(
        message: string,
        code: string,
        severity: ErrorSeverity,
        category: ErrorCategory,
        options: {
            recoverable?: boolean;
            retryable?: boolean;
            context?: Record<string, any>;
            cause?: Error;
        } = {}
    ): VectraError {
        const error = new Error(message) as VectraError;
        error.name = 'VectraError';
        error.code = code;
        error.severity = severity;
        error.category = category;
        error.recoverable = options.recoverable ?? false;
        error.retryable = options.retryable ?? false;
        error.context = options.context;
        error.timestamp = new Date();
        
        if (options.cause) {
            error.cause = options.cause;
        }

        return error;
    }

    /**
     * Handle an error with automatic recovery attempts
     */
    async handleError(error: Error, context: ErrorContext): Promise<void> {
        const vectraError = this.normalizeError(error);
        
        // Log the error
        if (this.options.logErrors) {
            await this.logError(vectraError, context);
        }

        // Emit error event safely
        // Check if there are error listeners to prevent Node.js from throwing
        if (this.listenerCount('error') > 0) {
            this.emit('error', vectraError, context);
        } else {
            // No error listeners - log to console instead of crashing
            console.error(`[Vectra Error] ${vectraError.code}: ${vectraError.message}`);
            if (vectraError.stack) {
                console.error(vectraError.stack);
            }
        }

        // Attempt recovery if enabled
        if (this.options.enableAutoRecovery && vectraError.recoverable) {
            const recovered = await this.attemptRecovery(vectraError, context);
            if (!recovered) {
                throw vectraError;
            }
            // If recovered successfully, return without throwing
            return;
        } else {
            throw vectraError;
        }
    }

    /**
     * Retry an operation with exponential backoff
     */
    async retryOperation<T>(
        operation: () => Promise<T>,
        context: ErrorContext,
        operationId?: string
    ): Promise<T> {
        const id = operationId || `${context.operation}-${Date.now()}`;
        let lastError: Error | undefined;
        
        for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
            try {
                const result = await operation();
                this.retryCount.delete(id);
                return result;
            } catch (error) {
                lastError = error as Error;
                const vectraError = this.normalizeError(error as Error);
                
                if (!vectraError.retryable || attempt === this.options.maxRetries) {
                    this.retryCount.delete(id);
                    await this.handleError(vectraError, context);
                }
                
                // Exponential backoff
                const delay = this.options.retryDelay * Math.pow(2, attempt);
                await this.sleep(delay);
                
                this.emit('retry', {
                    attempt: attempt + 1,
                    maxRetries: this.options.maxRetries,
                    error: vectraError,
                    context
                });
            }
        }
        
        throw lastError;
    }

    /**
     * Attempt to recover from an error
     */
    private async attemptRecovery(
        error: VectraError,
        context: ErrorContext
    ): Promise<boolean> {
        for (const strategy of this.recoveryStrategies) {
            if (strategy.canRecover(error)) {
                try {
                    const result = await strategy.recover(error, context);
                    if (result.recovered) {
                        this.emit('recovery', {
                            error,
                            strategy: strategy.constructor?.name || 'CustomStrategy',
                            actions: result.actions
                        });
                        return true;
                    }
                } catch (recoveryError) {
                    // Recovery strategy failed
                    this.emit('recoveryFailed', {
                        error,
                        strategy: strategy.constructor?.name || 'CustomStrategy',
                        recoveryError
                    });
                }
            }
        }
        
        return false;
    }

    /**
     * Initialize default recovery strategies
     */
    private initializeDefaultStrategies(): void {
        // WAL Recovery Strategy
        this.recoveryStrategies.push({
            canRecover: (error) => 
                error.category === ErrorCategory.CORRUPTION &&
                error.context?.component === 'index',
            recover: async (error, context) => {
                const actions: string[] = [];
                
                try {
                    // Try WAL recovery
                    const walPath = path.join(context.indexPath, 'wal');
                    const wal = await walManager.getWAL(walPath);
                    
                    if (wal) {
                        const replayedCount = await wal.replay(async (entry) => {
                            // Handler will be implemented by the index
                            console.log(`Replaying WAL entry: ${entry.operation}`);
                        });
                        actions.push(`Replayed ${replayedCount} WAL entries`);
                        
                        return {
                            recovered: true,
                            actions
                        };
                    }
                } catch (e) {
                    return {
                        recovered: false,
                        actions,
                        newError: this.createError(
                            'WAL recovery failed',
                            'WAL_RECOVERY_FAILED',
                            ErrorSeverity.HIGH,
                            ErrorCategory.CORRUPTION,
                            { cause: e as Error }
                        )
                    };
                }
                
                return { recovered: false, actions };
            },
            priority: 100
        });

        // Checksum Repair Strategy
        this.recoveryStrategies.push({
            canRecover: (error) => 
                error.category === ErrorCategory.CORRUPTION &&
                error.code === 'CHECKSUM_MISMATCH',
            recover: async (error, context) => {
                const actions: string[] = [];
                
                try {
                    const result = await dataIntegrity.repairIndex(context.indexPath, {
                        repairMode: true
                    });
                    
                    actions.push(...result.actions);
                    
                    return {
                        recovered: result.repaired,
                        actions
                    };
                } catch (e) {
                    return {
                        recovered: false,
                        actions,
                        newError: this.createError(
                            'Checksum repair failed',
                            'CHECKSUM_REPAIR_FAILED',
                            ErrorSeverity.HIGH,
                            ErrorCategory.CORRUPTION,
                            { cause: e as Error }
                        )
                    };
                }
            },
            priority: 90
        });

        // Lock Recovery Strategy
        this.recoveryStrategies.push({
            canRecover: (error) => 
                error.category === ErrorCategory.CONCURRENCY &&
                error.code === 'LOCK_TIMEOUT',
            recover: async (error, context) => {
                const actions: string[] = [];
                
                try {
                    // Check for stale locks
                    const lockFile = path.join(context.indexPath, '.lock');
                    const stats = await fs.stat(lockFile).catch(() => null);
                    
                    if (stats) {
                        const age = Date.now() - stats.mtimeMs;
                        if (age > 300000) { // 5 minutes
                            await fs.unlink(lockFile);
                            actions.push('Removed stale lock file');
                            return { recovered: true, actions };
                        }
                    }
                } catch (e) {
                    // Ignore
                }
                
                return { recovered: false, actions };
            },
            priority: 80
        });

        // Operations Log Compaction Strategy
        this.recoveryStrategies.push({
            canRecover: (error) => 
                error.category === ErrorCategory.IO &&
                error.code === 'ENOSPC',
            recover: async (error, context) => {
                const actions: string[] = [];
                
                try {
                    // Try to free space by compacting operations log
                    const logPath = path.join(context.indexPath, 'operations.log');
                    const log = await operationsLogManager.getLog(logPath);
                    
                    if (log) {
                        const result = await log.compact();
                        actions.push(`Compacted operations log, freed ${result.bytesReclaimed} bytes`);
                        
                        if (result.compactedEntries > 0) {
                            return { recovered: true, actions };
                        }
                    }
                } catch (e) {
                    // Ignore
                }
                
                return { recovered: false, actions };
            },
            priority: 70
        });
    }

    /**
     * Normalize any error to VectraError
     */
    private normalizeError(error: Error): VectraError {
        if (this.isVectraError(error)) {
            return error;
        }

        // Categorize common errors
        let category = ErrorCategory.UNKNOWN;
        let severity = ErrorSeverity.MEDIUM;
        let recoverable = false;
        let retryable = false;
        let code = 'UNKNOWN_ERROR';

        const message = error.message.toLowerCase();
        const errorCode = (error as any).code;

        // IO Errors
        if (errorCode === 'ENOENT') {
            category = ErrorCategory.IO;
            code = 'FILE_NOT_FOUND';
            severity = ErrorSeverity.HIGH;
        } else if (errorCode === 'EACCES' || errorCode === 'EPERM') {
            category = ErrorCategory.IO;
            code = 'PERMISSION_DENIED';
            severity = ErrorSeverity.HIGH;
        } else if (errorCode === 'ENOSPC') {
            category = ErrorCategory.IO;
            code = 'NO_SPACE';
            severity = ErrorSeverity.CRITICAL;
            recoverable = true;
        } else if (errorCode === 'EMFILE') {
            category = ErrorCategory.IO;
            code = 'TOO_MANY_FILES';
            severity = ErrorSeverity.HIGH;
            retryable = true;
        }
        // Corruption Errors
        else if (message.includes('checksum') || message.includes('corrupt')) {
            category = ErrorCategory.CORRUPTION;
            code = 'DATA_CORRUPTION';
            severity = ErrorSeverity.CRITICAL;
            recoverable = true;
        }
        // Concurrency Errors
        else if (message.includes('lock') || message.includes('locked')) {
            category = ErrorCategory.CONCURRENCY;
            code = 'LOCK_ERROR';
            severity = ErrorSeverity.MEDIUM;
            retryable = true;
        }
        // Validation Errors
        else if (message.includes('invalid') || message.includes('validation')) {
            category = ErrorCategory.VALIDATION;
            code = 'VALIDATION_ERROR';
            severity = ErrorSeverity.LOW;
        }
        // Memory Errors
        else if (message.includes('memory') || errorCode === 'ENOMEM') {
            category = ErrorCategory.MEMORY;
            code = 'OUT_OF_MEMORY';
            severity = ErrorSeverity.CRITICAL;
        }

        return this.createError(
            error.message,
            code,
            severity,
            category,
            {
                recoverable,
                retryable,
                cause: error
            }
        );
    }

    /**
     * Check if error is already a VectraError
     */
    private isVectraError(error: any): error is VectraError {
        const isVectra = error.name === 'VectraError' && 
               error.code !== undefined &&
               error.severity !== undefined &&
               error.category !== undefined &&
               error.recoverable !== undefined &&
               error.retryable !== undefined;
        
        
        return isVectra;
    }

    /**
     * Log error to file
     */
    private async logError(error: VectraError, context: ErrorContext): Promise<void> {
        const logEntry = {
            timestamp: error.timestamp,
            code: error.code,
            severity: error.severity,
            category: error.category,
            message: error.message,
            context,
            stack: error.stack
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        
        try {
            await fs.appendFile(this.options.errorLogPath, logLine);
        } catch (e) {
            // Can't log to file, emit event instead
            this.emit('logError', e);
        }
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get error statistics
     */
    async getErrorStats(): Promise<{
        totalErrors: number;
        errorsByCategory: Record<ErrorCategory, number>;
        errorsBySeverity: Record<ErrorSeverity, number>;
        recentErrors: VectraError[];
    }> {
        const stats = {
            totalErrors: 0,
            errorsByCategory: {} as Record<ErrorCategory, number>,
            errorsBySeverity: {} as Record<ErrorSeverity, number>,
            recentErrors: [] as VectraError[]
        };

        try {
            const logContent = await fs.readFile(this.options.errorLogPath, 'utf-8');
            const lines = logContent.trim().split('\n').filter(line => line);
            
            for (const line of lines) {
                try {
                    const entry = JSON.parse(line);
                    stats.totalErrors++;
                    
                    // Count by category
                    const category = entry.category as ErrorCategory;
                    stats.errorsByCategory[category] = 
                        (stats.errorsByCategory[category] || 0) + 1;
                    
                    // Count by severity
                    const severity = entry.severity as ErrorSeverity;
                    stats.errorsBySeverity[severity] = 
                        (stats.errorsBySeverity[severity] || 0) + 1;
                } catch (e) {
                    // Ignore malformed log entries
                }
            }
            
            // Get recent errors (last 10)
            const recentLines = lines.slice(-10).reverse();
            for (const line of recentLines) {
                try {
                    const entry = JSON.parse(line);
                    stats.recentErrors.push(entry);
                } catch (e) {
                    // Ignore
                }
            }
        } catch (e) {
            // Log file doesn't exist yet
        }

        return stats;
    }

    /**
     * Clear error log
     */
    async clearErrorLog(): Promise<void> {
        try {
            await fs.unlink(this.options.errorLogPath);
        } catch (e) {
            // Ignore if doesn't exist
        }
    }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();