# Error Handling and Recovery

## Overview

Vectra's comprehensive error handling system provides automatic recovery, detailed error categorization, and robust retry mechanisms to ensure data reliability and system resilience.

## Documentation

- **[Implementation Guide](ERROR_HANDLING_IMPLEMENTATION.md)** - Technical deep-dive into the error handling architecture
- **[API Reference](ERROR_HANDLING_API_REFERENCE.md)** - Complete API documentation for all error handling classes and methods
- **User Guide** - This document, focused on practical usage

## Features

### 1. Error Categorization
- **IO Errors**: File system issues (ENOENT, EACCES, ENOSPC)
- **Corruption Errors**: Data integrity issues, checksum mismatches
- **Concurrency Errors**: Lock timeouts, concurrent access conflicts
- **Validation Errors**: Invalid data, schema violations
- **Memory Errors**: Out of memory conditions
- **Configuration Errors**: Invalid settings or parameters

### 2. Error Severity Levels
- **LOW**: Minor issues that don't affect functionality
- **MEDIUM**: Issues that may impact performance or specific features
- **HIGH**: Serious issues requiring attention
- **CRITICAL**: System-threatening issues requiring immediate action

### 3. Automatic Recovery Strategies
- **WAL Recovery**: Replay Write-Ahead Log for corruption recovery
- **Checksum Repair**: Fix data integrity issues
- **Lock Recovery**: Handle stale locks and timeouts
- **Space Recovery**: Compact logs when disk space is low

## Usage

### Basic Error Handling

```typescript
import { LocalIndexWithErrorHandling } from 'vectra-enhanced';

const index = new LocalIndexWithErrorHandling('./my-index');

// Safe by default - no crash even without error handlers!
// Errors will be logged to console automatically

// All operations automatically include error handling
try {
    await index.createIndex({ version: 1 });
    
    await index.beginUpdate();
    await index.insertItem({
        vector: [1, 2, 3],
        metadata: { text: 'example' }
    });
    await index.endUpdate();
} catch (error) {
    // Errors are already categorized and recovery attempted
    console.error('Operation failed:', error);
}
```

### Safety Features

The error handler includes built-in safety to prevent crashes:

1. **No Crash on Missing Listeners**: If no error event listeners are attached, errors are logged to console instead of crashing
2. **Warning Messages**: A helpful warning is displayed if no error listeners are detected
3. **Default Handlers**: LocalIndexWithErrorHandling provides sensible default handlers

```typescript
// This is now SAFE - won't crash your app
const index = new LocalIndexWithErrorHandling('./my-index');
await index.queryItems([1,2,3], 'query', 10); // Errors logged to console

// You'll see a warning after 1 second:
// [Vectra Warning] No error event listeners detected. Errors will be logged to console instead.
```

### Custom Error Handling

```typescript
import { errorHandler, ErrorSeverity, ErrorCategory } from 'vectra-enhanced';

// Listen to error events
errorHandler.on('error', (error, context) => {
    console.log(`Error in ${context.operation}: ${error.message}`);
    
    // Send to monitoring service
    monitoring.recordError({
        code: error.code,
        severity: error.severity,
        category: error.category,
        context
    });
});

// Listen to recovery events
errorHandler.on('recovery', (data) => {
    console.log('Recovered from error:', data.error.code);
    console.log('Actions taken:', data.actions);
});

// Listen to retry events
errorHandler.on('retry', (data) => {
    console.log(`Retry attempt ${data.attempt}/${data.maxRetries}`);
});
```

### Manual Error Creation

```typescript
// Create custom errors with full context
const error = errorHandler.createError(
    'Custom validation failed',
    'CUSTOM_VALIDATION',
    ErrorSeverity.MEDIUM,
    ErrorCategory.VALIDATION,
    {
        recoverable: false,
        retryable: true,
        context: { field: 'vector', reason: 'dimension mismatch' }
    }
);

// Handle the error
await errorHandler.handleError(error, {
    indexPath: './my-index',
    operation: 'validateVector'
});
```

### Retry Operations

```typescript
// Wrap any operation with automatic retry logic
const result = await errorHandler.retryOperation(
    async () => {
        // Your operation that might fail
        return await riskyOperation();
    },
    {
        indexPath: './my-index',
        operation: 'riskyOperation'
    },
    'operation-id' // Optional operation ID for tracking
);
```

## Recovery Strategies

### 1. WAL Recovery
Automatically triggered for index corruption:

```typescript
// Automatic WAL recovery on corruption
const index = new LocalIndexWithErrorHandling('./my-index');

// If index is corrupted, WAL recovery is attempted automatically
await index.verifyAndRepair();
```

### 2. Checksum Repair
Fixes data integrity issues:

```typescript
// Verify and repair integrity issues
const result = await index.verifyAndRepair();

if (result.repaired) {
    console.log('Repairs performed:', result.actions);
} else if (!result.valid) {
    console.log('Manual intervention required:', result.errors);
}
```

### 3. Lock Recovery
Handles stale locks:

```typescript
// Stale locks are automatically detected and removed
// after 5 minutes of inactivity
await index.beginUpdate(); // Will remove stale lock if needed
```

### 4. Space Recovery
Automatically compacts logs when disk space is low:

```typescript
// Automatic log compaction on ENOSPC errors
// No manual intervention needed
```

## Error Statistics

Monitor error patterns and trends:

```typescript
const stats = await index.getErrorStats();

console.log('Total errors:', stats.totalErrors);
console.log('Errors by category:', stats.errorsByCategory);
console.log('Errors by severity:', stats.errorsBySeverity);
console.log('Recent errors:', stats.recentErrors);

// Clear error log if needed
await errorHandler.clearErrorLog();
```

## Catastrophic Failure Handling

For severe failures, use the emergency recovery:

```typescript
try {
    // Normal operations
    await index.queryItems(vector, 10);
} catch (error) {
    if (isCatastrophic(error)) {
        // Attempts multiple recovery strategies
        await index.handleCatastrophicFailure();
        
        // Index should be usable again
        await index.queryItems(vector, 10);
    }
}
```

## Configuration

Configure error handling behavior:

```typescript
import { ErrorHandler } from 'vectra-enhanced';

const customHandler = new ErrorHandler({
    maxRetries: 5,              // Maximum retry attempts
    retryDelay: 2000,           // Base delay between retries (ms)
    enableAutoRecovery: true,   // Enable automatic recovery
    logErrors: true,            // Log errors to file
    errorLogPath: './errors.log', // Error log location
    recoveryStrategies: [       // Custom recovery strategies
        {
            canRecover: (error) => error.code === 'MY_ERROR',
            recover: async (error, context) => {
                // Custom recovery logic
                return {
                    recovered: true,
                    actions: ['Custom recovery performed']
                };
            },
            priority: 150
        }
    ]
});
```

## Best Practices

### 1. Use LocalIndexWithErrorHandling
Always use the error-handling version for production:

```typescript
// ✅ Good - includes error handling
const index = new LocalIndexWithErrorHandling('./my-index');

// ❌ Avoid - no automatic error handling
const index = new LocalIndex('./my-index');
```

### 2. Monitor Error Events
Set up monitoring for production systems:

```typescript
errorHandler.on('error', async (error, context) => {
    // Log to monitoring service
    await logger.error({
        timestamp: new Date(),
        error: {
            code: error.code,
            message: error.message,
            severity: error.severity,
            category: error.category
        },
        context
    });
    
    // Alert on critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
        await alerting.sendAlert({
            title: `Critical Error: ${error.code}`,
            message: error.message,
            context
        });
    }
});
```

### 3. Regular Integrity Checks
Schedule periodic integrity verification:

```typescript
setInterval(async () => {
    try {
        const result = await index.verifyAndRepair();
        if (!result.valid) {
            console.warn('Integrity issues found:', result.errors);
        }
    } catch (error) {
        console.error('Integrity check failed:', error);
    }
}, 3600000); // Every hour
```

### 4. Graceful Shutdown
Always close indices properly:

```typescript
process.on('SIGTERM', async () => {
    try {
        await index.close();
        console.log('Index closed gracefully');
    } catch (error) {
        console.error('Error during shutdown:', error);
    } finally {
        process.exit(0);
    }
});
```

## Error Types Reference

### VectraError
```typescript
interface VectraError extends Error {
    code: string;                    // Error code (e.g., 'FILE_NOT_FOUND')
    severity: ErrorSeverity;         // LOW, MEDIUM, HIGH, CRITICAL
    category: ErrorCategory;         // IO, CORRUPTION, etc.
    recoverable: boolean;           // Can be automatically recovered
    retryable: boolean;            // Should be retried
    context?: Record<string, any>;  // Additional context
    timestamp: Date;               // When error occurred
}
```

### Common Error Codes
- `FILE_NOT_FOUND`: Index or metadata file not found
- `PERMISSION_DENIED`: Insufficient permissions
- `NO_SPACE`: Disk space exhausted
- `DATA_CORRUPTION`: Checksum mismatch or invalid data
- `LOCK_TIMEOUT`: Unable to acquire lock
- `VALIDATION_ERROR`: Data validation failed
- `OUT_OF_MEMORY`: Memory limit exceeded

## Troubleshooting

### "Too many retries" errors
Increase max retries or check for persistent issues:
```typescript
const handler = new ErrorHandler({ maxRetries: 10 });
```

### "Recovery failed" errors
Check WAL and backup availability:
```typescript
const hasWAL = await index.isWALEnabled();
const hasBackup = await fs.access('./backup').then(() => true).catch(() => false);
```

### Performance impact
Disable auto-recovery for performance-critical paths:
```typescript
const handler = new ErrorHandler({ enableAutoRecovery: false });
```