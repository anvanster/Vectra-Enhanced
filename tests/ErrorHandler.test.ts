import { expect } from 'chai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ErrorHandler, ErrorSeverity, ErrorCategory, VectraError, errorHandler } from '../lib/ErrorHandler';
import { LocalIndexWithErrorHandling } from '../lib/LocalIndexWithErrorHandling';

describe('Error Handler Tests', () => {
    const testDir = './test-errors';
    const errorLogPath = path.join(testDir, 'test-errors.log');
    
    let handler: ErrorHandler;
    
    beforeEach(async () => {
        await fs.rm(testDir, { recursive: true }).catch(() => {});
        await fs.mkdir(testDir, { recursive: true });
        
        handler = new ErrorHandler({
            errorLogPath,
            maxRetries: 2,
            retryDelay: 10,
            enableAutoRecovery: true
        });
    });

    afterEach(async () => {
        await fs.rm(testDir, { recursive: true }).catch(() => {});
    });

    describe('Error Creation', () => {
        it('should create VectraError with all properties', () => {
            const error = handler.createError(
                'Test error',
                'TEST_ERROR',
                ErrorSeverity.MEDIUM,
                ErrorCategory.IO,
                {
                    recoverable: true,
                    retryable: true,
                    context: { test: true }
                }
            );

            expect(error).to.be.instanceOf(Error);
            expect(error.name).to.equal('VectraError');
            expect(error.message).to.equal('Test error');
            expect(error.code).to.equal('TEST_ERROR');
            expect(error.severity).to.equal(ErrorSeverity.MEDIUM);
            expect(error.category).to.equal(ErrorCategory.IO);
            expect(error.recoverable).to.be.true;
            expect(error.retryable).to.be.true;
            expect(error.context).to.deep.equal({ test: true });
            expect(error.timestamp).to.be.instanceOf(Date);
        });

        it('should normalize regular errors to VectraError', async () => {
            const regularError = new Error('ENOENT: no such file or directory');
            (regularError as any).code = 'ENOENT';

            let capturedError: VectraError | undefined;
            handler.on('error', (error) => {
                capturedError = error;
            });

            try {
                await handler.handleError(regularError, { indexPath: testDir });
            } catch (e) {
                // Expected
            }

            expect(capturedError).to.exist;
            expect(capturedError!.code).to.equal('FILE_NOT_FOUND');
            expect(capturedError!.category).to.equal(ErrorCategory.IO);
            expect(capturedError!.severity).to.equal(ErrorSeverity.HIGH);
        });
    });

    describe('Retry Logic', () => {
        it('should retry failed operations', async () => {
            let attempts = 0;
            const operation = async () => {
                attempts++;
                if (attempts < 3) {
                    const error = handler.createError(
                        'Temporary failure',
                        'TEMP_ERROR',
                        ErrorSeverity.LOW,
                        ErrorCategory.IO,
                        { retryable: true }
                    );
                    throw error;
                }
                return 'success';
            };

            const result = await handler.retryOperation(
                operation,
                { indexPath: testDir, operation: 'test' }
            );

            expect(result).to.equal('success');
            expect(attempts).to.equal(3);
        });

        it('should respect max retries', async () => {
            let attempts = 0;
            const operation = async () => {
                attempts++;
                const error = handler.createError(
                    'Permanent failure',
                    'PERM_ERROR',
                    ErrorSeverity.HIGH,
                    ErrorCategory.IO,
                    { retryable: true }
                );
                throw error;
            };

            let error: Error | undefined;
            try {
                await handler.retryOperation(
                    operation,
                    { indexPath: testDir, operation: 'test' }
                );
            } catch (e) {
                error = e as Error;
            }

            expect(error).to.exist;
            expect(attempts).to.equal(3); // initial + 2 retries
        });

        it('should emit retry events', async () => {
            const retryEvents: any[] = [];
            handler.on('retry', (data) => {
                retryEvents.push(data);
            });

            let attempts = 0;
            const operation = async () => {
                attempts++;
                if (attempts < 2) {
                    const error = handler.createError(
                        'Retryable error',
                        'RETRY_TEST',
                        ErrorSeverity.LOW,
                        ErrorCategory.IO,
                        { retryable: true }
                    );
                    throw error;
                }
                return 'success';
            };

            await handler.retryOperation(
                operation,
                { indexPath: testDir, operation: 'test' }
            );

            expect(retryEvents).to.have.lengthOf(1);
            expect(retryEvents[0].attempt).to.equal(1);
            expect(retryEvents[0].maxRetries).to.equal(2);
        });
    });

    describe('Error Logging', () => {
        it('should log errors to file', async () => {
            const error = handler.createError(
                'Test logging',
                'LOG_TEST',
                ErrorSeverity.LOW,
                ErrorCategory.VALIDATION
            );

            try {
                await handler.handleError(error, { indexPath: testDir });
            } catch (e) {
                // Expected
            }

            const logContent = await fs.readFile(errorLogPath, 'utf-8');
            const logEntry = JSON.parse(logContent.trim());

            expect(logEntry.code).to.equal('LOG_TEST');
            expect(logEntry.message).to.equal('Test logging');
            expect(logEntry.severity).to.equal(ErrorSeverity.LOW);
            expect(logEntry.category).to.equal(ErrorCategory.VALIDATION);
        });

        it('should get error statistics', async () => {
            // Log some errors
            for (let i = 0; i < 5; i++) {
                const error = handler.createError(
                    `Error ${i}`,
                    `ERROR_${i}`,
                    i % 2 === 0 ? ErrorSeverity.LOW : ErrorSeverity.HIGH,
                    i % 3 === 0 ? ErrorCategory.IO : ErrorCategory.VALIDATION
                );

                try {
                    await handler.handleError(error, { indexPath: testDir });
                } catch (e) {
                    // Expected
                }
            }

            const stats = await handler.getErrorStats();

            expect(stats.totalErrors).to.equal(5);
            expect(stats.errorsBySeverity[ErrorSeverity.LOW]).to.equal(3);
            expect(stats.errorsBySeverity[ErrorSeverity.HIGH]).to.equal(2);
            expect(stats.errorsByCategory[ErrorCategory.IO]).to.equal(2);
            expect(stats.errorsByCategory[ErrorCategory.VALIDATION]).to.equal(3);
            expect(stats.recentErrors).to.have.lengthOf(5);
        });
    });

    describe('Recovery Strategies', () => {
        it('should attempt recovery for recoverable errors', async () => {
            let recoveryAttempted = false;
            
            // Add custom recovery strategy
            const customHandler = new ErrorHandler({
                errorLogPath,
                enableAutoRecovery: true,  // Make sure auto recovery is enabled
                recoveryStrategies: [{
                    canRecover: (error) => error.code === 'CUSTOM_RECOVERABLE',
                    recover: async () => {
                        recoveryAttempted = true;
                        return { recovered: true, actions: ['Custom recovery'] };
                    },
                    priority: 100
                }]
            });

            // Add error listener to prevent Node.js from throwing on error event
            customHandler.on('error', () => {});

            const error = customHandler.createError(
                'Recoverable error',
                'CUSTOM_RECOVERABLE',
                ErrorSeverity.HIGH,
                ErrorCategory.UNKNOWN,
                { recoverable: true }
            );


            // Should not throw when recovery succeeds
            await customHandler.handleError(error, { indexPath: testDir });
            
            expect(recoveryAttempted).to.be.true;
        });

        it('should emit recovery events', async () => {
            let recoveryEvent: any;
            
            const customHandler = new ErrorHandler({
                errorLogPath,
                recoveryStrategies: [{
                    canRecover: () => true,
                    recover: async () => ({ 
                        recovered: true, 
                        actions: ['Test recovery action'] 
                    }),
                    priority: 100
                }]
            });

            customHandler.on('recovery', (data) => {
                recoveryEvent = data;
            });

            // Add error listener to prevent Node.js from throwing on error event
            customHandler.on('error', () => {});

            const error = customHandler.createError(
                'Test',
                'TEST',
                ErrorSeverity.HIGH,
                ErrorCategory.UNKNOWN,
                { recoverable: true }
            );

            // Should not throw when recovery succeeds
            await customHandler.handleError(error, { indexPath: testDir });

            expect(recoveryEvent).to.exist;
            expect(recoveryEvent.actions).to.include('Test recovery action');
        });
    });

    describe('LocalIndex Error Handling Integration', () => {
        it('should handle index creation errors', async () => {
            const index = new LocalIndexWithErrorHandling(testDir);
            
            // Create index
            await index.createIndex({ version: 1 });
            
            // Try to create again without deleteIfExists
            let error: Error | undefined;
            try {
                await index.createIndex({ version: 1 });
            } catch (e) {
                error = e as Error;
            }
            
            expect(error).to.exist;
            expect(error!.message).to.include('already exists');
        });

        it('should recover from corruption errors', async () => {
            const index = new LocalIndexWithErrorHandling(testDir);
            await index.createIndex({ version: 1, wal: true });
            
            // Insert some items
            await index.beginUpdate();
            await index.insertItem({
                vector: [1, 2, 3],
                metadata: { test: true }
            });
            await index.endUpdate();
            
            // Corrupt the index file
            const indexPath = path.join(testDir, 'index.json');
            await fs.writeFile(indexPath, 'invalid json');
            
            // Try to verify and repair
            const result = await index.verifyAndRepair();
            
            expect(result.errors).to.have.length.greaterThan(0);
            // Recovery depends on WAL being available
        });

        it('should handle query errors gracefully', async () => {
            const index = new LocalIndexWithErrorHandling(testDir);
            await index.createIndex({ version: 1 });
            
            await index.beginUpdate();
            await index.insertItem({
                vector: [1, 2, 3],
                metadata: { test: true }
            });
            await index.endUpdate();
            
            // Query with mismatched dimensions should be handled
            const results = await index.queryItems([1, 2, 3, 4, 5], 'test query', 5);
            
            // Should either return results or handle dimension mismatch gracefully
            expect(results).to.be.an('array');
        });

        it('should get error statistics from index', async () => {
            const index = new LocalIndexWithErrorHandling(testDir);
            
            const stats = await index.getErrorStats();
            
            expect(stats).to.have.property('totalErrors');
            expect(stats).to.have.property('errorsByCategory');
            expect(stats).to.have.property('errorsBySeverity');
        });

        it('should handle catastrophic failure', async () => {
            const index = new LocalIndexWithErrorHandling(testDir);
            await index.createIndex({ version: 1 });
            
            // This should attempt recovery without throwing
            await index.handleCatastrophicFailure();
            
            // Index should still be usable
            const stats = await index.getIndexStats();
            expect(stats).to.exist;
        });
    });

    describe('Error Categories', () => {
        it('should categorize IO errors correctly', async () => {
            const errors = [
                { code: 'ENOENT', expected: 'FILE_NOT_FOUND' },
                { code: 'EACCES', expected: 'PERMISSION_DENIED' },
                { code: 'ENOSPC', expected: 'NO_SPACE' },
                { code: 'EMFILE', expected: 'TOO_MANY_FILES' }
            ];

            for (const { code, expected } of errors) {
                const error = new Error('Test');
                (error as any).code = code;

                let vectraError: VectraError | undefined;
                handler.once('error', (e) => { vectraError = e; });

                try {
                    await handler.handleError(error, { indexPath: testDir });
                } catch (e) {
                    // Expected
                }

                expect(vectraError).to.exist;
                expect(vectraError?.code).to.equal(expected);
                expect(vectraError?.category).to.equal(ErrorCategory.IO);
            }
        });

        it('should categorize corruption errors', async () => {
            const error = new Error('Checksum mismatch detected');
            
            let vectraError: VectraError | undefined;
            handler.once('error', (e) => { vectraError = e; });

            try {
                await handler.handleError(error, { indexPath: testDir });
            } catch (e) {
                // Expected
            }

            expect(vectraError).to.exist;
            expect(vectraError?.category).to.equal(ErrorCategory.CORRUPTION);
            expect(vectraError?.recoverable).to.be.true;
        });
    });
});