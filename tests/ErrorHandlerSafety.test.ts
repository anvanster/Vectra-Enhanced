import { expect } from 'chai';
import { ErrorHandler, ErrorSeverity, ErrorCategory } from '../lib/ErrorHandler';

describe('Error Handler Safety Tests', () => {
    let originalConsoleError: typeof console.error;
    let originalConsoleWarn: typeof console.warn;
    let consoleErrors: any[] = [];
    let consoleWarnings: any[] = [];
    
    beforeEach(() => {
        // Save original console methods
        originalConsoleError = console.error;
        originalConsoleWarn = console.warn;
        
        // Replace with test spies
        consoleErrors = [];
        consoleWarnings = [];
        
        console.error = (...args: any[]) => {
            consoleErrors.push(args);
        };
        
        console.warn = (...args: any[]) => {
            consoleWarnings.push(args);
        };
    });

    afterEach(() => {
        // Restore original console methods
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
    });

    it('should not crash when no error listeners are attached', async () => {
        const handler = new ErrorHandler({
            logErrors: false // Disable file logging for test
        });

        const error = handler.createError(
            'Test error',
            'TEST_ERROR',
            ErrorSeverity.HIGH,
            ErrorCategory.UNKNOWN
        );

        // This should NOT throw even without error listeners
        try {
            await handler.handleError(error, { indexPath: '.' });
        } catch (e) {
            // Error is still thrown after being logged (expected behavior)
        }

        // Should have logged to console instead
        expect(consoleErrors.length).to.be.greaterThan(0);
        expect(consoleErrors[0][0]).to.include('[Vectra Error] TEST_ERROR: Test error');
    });

    it('should emit error event when listeners are attached', async () => {
        const handler = new ErrorHandler({
            logErrors: false
        });

        let emittedError: any;
        handler.on('error', (error) => {
            emittedError = error;
        });

        const error = handler.createError(
            'Test error',
            'TEST_ERROR',
            ErrorSeverity.HIGH,
            ErrorCategory.UNKNOWN
        );

        try {
            await handler.handleError(error, { indexPath: '.' });
        } catch (e) {
            // Expected - error is still thrown
        }

        // Should have emitted the error
        expect(emittedError).to.exist;
        expect(emittedError.code).to.equal('TEST_ERROR');
        
        // Should NOT have logged to console
        expect(consoleErrors.length).to.equal(0);
    });

    it('should warn about missing error listeners', (done) => {
        new ErrorHandler({
            logErrors: true
        });

        // Wait for the warning timeout
        setTimeout(() => {
            expect(consoleWarnings.length).to.be.greaterThan(0);
            expect(consoleWarnings[0][0]).to.include('No error event listeners detected');
            done();
        }, 1100);
    });

    it('should not warn when error listeners exist', (done) => {
        const handler = new ErrorHandler({
            logErrors: true
        });

        // Add a listener immediately
        handler.on('error', () => {});

        // Wait for the warning timeout
        setTimeout(() => {
            expect(consoleWarnings.length).to.equal(0);
            done();
        }, 1100);
    });

    it('should handle errors gracefully in production-like scenario', async () => {
        const handler = new ErrorHandler({
            maxRetries: 3,
            enableAutoRecovery: true,
            logErrors: false
        });

        // Simulate multiple errors without listeners
        const errors = [
            { code: 'IO_ERROR', severity: ErrorSeverity.HIGH, category: ErrorCategory.IO },
            { code: 'VALIDATION_ERROR', severity: ErrorSeverity.LOW, category: ErrorCategory.VALIDATION },
            { code: 'CORRUPTION_ERROR', severity: ErrorSeverity.CRITICAL, category: ErrorCategory.CORRUPTION }
        ];

        for (const errorConfig of errors) {
            const error = handler.createError(
                `Test ${errorConfig.code}`,
                errorConfig.code,
                errorConfig.severity,
                errorConfig.category
            );

            // None of these should crash the process
            try {
                await handler.handleError(error, { indexPath: '.' });
            } catch (e) {
                // Expected - error is still thrown after logging
            }
        }

        // All errors should have been logged to console
        expect(consoleErrors.length).to.be.at.least(errors.length);
    });
});