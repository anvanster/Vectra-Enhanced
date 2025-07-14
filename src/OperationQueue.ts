import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface QueuedOperation<T = any> {
    id: string;
    type: 'insert' | 'update' | 'delete' | 'custom';
    data: T;
    priority: number;
    timestamp: number;
    retries: number;
    maxRetries: number;
    resolve: (value: any) => void;
    reject: (error: any) => void;
}

export interface QueueOptions {
    maxConcurrency?: number;
    maxRetries?: number;
    retryDelay?: number;
    priorityQueue?: boolean;
}

export class OperationQueue extends EventEmitter {
    private queue: QueuedOperation[] = [];
    private processing: Map<string, QueuedOperation> = new Map();
    private isProcessing: boolean = false;
    private options: Required<QueueOptions>;

    constructor(options: QueueOptions = {}) {
        super();
        this.options = {
            maxConcurrency: 1,
            maxRetries: 3,
            retryDelay: 100,
            priorityQueue: true,
            ...options
        };
    }

    async enqueue<T>(
        type: QueuedOperation['type'],
        data: T,
        priority: number = 0
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const operation: QueuedOperation<T> = {
                id: uuidv4(),
                type,
                data,
                priority,
                timestamp: Date.now(),
                retries: 0,
                maxRetries: this.options.maxRetries,
                resolve,
                reject
            };

            this.queue.push(operation);
            
            if (this.options.priorityQueue) {
                this.queue.sort((a, b) => {
                    // Higher priority first
                    if (a.priority !== b.priority) {
                        return b.priority - a.priority;
                    }
                    // Earlier timestamp first for same priority
                    return a.timestamp - b.timestamp;
                });
            }

            this.emit('enqueued', operation);
            this.processNext();
        });
    }

    private async processNext(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        if (this.processing.size >= this.options.maxConcurrency) {
            return;
        }

        this.isProcessing = true;

        try {
            while (this.queue.length > 0 && this.processing.size < this.options.maxConcurrency) {
                const operation = this.queue.shift()!;
                this.processing.set(operation.id, operation);
                
                // Process operation asynchronously
                this.processOperation(operation).catch(err => {
                    console.error(`Failed to process operation ${operation.id}:`, err);
                });
            }
        } finally {
            this.isProcessing = false;
        }
    }

    private async processOperation(operation: QueuedOperation): Promise<void> {
        try {
            this.emit('processing', operation);
            
            // The actual processing will be done by the handler passed to setHandler
            const handler = this.handlers.get(operation.type);
            if (!handler) {
                throw new Error(`No handler registered for operation type: ${operation.type}`);
            }

            const result = await handler(operation.data);
            
            this.processing.delete(operation.id);
            operation.resolve(result);
            this.emit('completed', operation, result);
            
        } catch (error) {
            operation.retries++;
            
            if (operation.retries < operation.maxRetries) {
                // Retry with exponential backoff
                const delay = this.options.retryDelay * Math.pow(2, operation.retries - 1);
                
                this.emit('retry', operation, error, operation.retries);
                
                setTimeout(() => {
                    this.processing.delete(operation.id);
                    this.queue.unshift(operation); // Add back to front of queue
                    this.processNext();
                }, delay);
                
            } else {
                // Max retries exceeded
                this.processing.delete(operation.id);
                operation.reject(error);
                this.emit('failed', operation, error);
            }
        } finally {
            // Always try to process the next item
            this.processNext();
        }
    }

    private handlers: Map<string, (data: any) => Promise<any>> = new Map();

    setHandler(type: string, handler: (data: any) => Promise<any>): void {
        this.handlers.set(type, handler);
    }

    getQueueLength(): number {
        return this.queue.length;
    }

    getProcessingCount(): number {
        return this.processing.size;
    }

    async drain(): Promise<void> {
        return new Promise((resolve) => {
            const checkDrained = () => {
                if (this.queue.length === 0 && this.processing.size === 0) {
                    resolve();
                } else {
                    setTimeout(checkDrained, 10);
                }
            };
            checkDrained();
        });
    }

    clear(): void {
        // Reject all pending operations
        for (const op of this.queue) {
            op.reject(new Error('Queue cleared'));
        }
        this.queue = [];
    }

    pause(): void {
        this.options.maxConcurrency = 0;
    }

    resume(maxConcurrency?: number): void {
        this.options.maxConcurrency = maxConcurrency ?? 1;
        this.processNext();
    }
}