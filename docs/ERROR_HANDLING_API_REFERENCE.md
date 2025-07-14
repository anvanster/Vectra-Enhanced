# Error Handling API Reference

## Table of Contents

- [Classes](#classes)
  - [ErrorHandler](#errorhandler)
  - [LocalIndexWithErrorHandling](#localindexwitherrorhandling)
- [Enums](#enums)
  - [ErrorSeverity](#errorseverity)
  - [ErrorCategory](#errorcategory)
- [Interfaces](#interfaces)
  - [VectraError](#vectraerror)
  - [ErrorRecoveryStrategy](#errorrecoverystrategy)
  - [ErrorContext](#errorcontext)
  - [RecoveryResult](#recoveryresult)
- [Events](#events)
- [Error Codes](#error-codes)

## Classes

### ErrorHandler

The core error handling system that manages error categorization, recovery, and retry logic.

#### Constructor

```typescript
new ErrorHandler(options?: ErrorHandlerOptions)
```

##### Parameters

| Name | Type | Description |
|------|------|-------------|
| options | `ErrorHandlerOptions` | Optional configuration object |

##### ErrorHandlerOptions

```typescript
interface ErrorHandlerOptions {
    maxRetries?: number;              // Default: 3
    retryDelay?: number;              // Default: 1000 (ms)
    enableAutoRecovery?: boolean;     // Default: true
    logErrors?: boolean;              // Default: true
    errorLogPath?: string;            // Default: './errors.log'
    recoveryStrategies?: ErrorRecoveryStrategy[];  // Custom strategies
}
```

#### Methods

##### createError

Creates a properly formatted VectraError.

```typescript
createError(
    message: string,
    code: string,
    severity: ErrorSeverity,
    category: ErrorCategory,
    options?: {
        recoverable?: boolean;
        retryable?: boolean;
        context?: Record<string, any>;
        cause?: Error;
    }
): VectraError
```

###### Example

```typescript
const error = errorHandler.createError(
    'Database connection failed',
    'DB_CONNECTION_FAILED',
    ErrorSeverity.HIGH,
    ErrorCategory.IO,
    {
        recoverable: true,
        retryable: true,
        context: { host: 'localhost', port: 5432 }
    }
);
```

##### handleError

Processes an error with automatic recovery attempts.

```typescript
async handleError(error: Error, context: ErrorContext): Promise<void>
```

###### Parameters

| Name | Type | Description |
|------|------|-------------|
| error | `Error` | The error to handle |
| context | `ErrorContext` | Contextual information |

###### Throws

- `VectraError` if recovery fails or error is not recoverable

###### Example

```typescript
try {
    await riskyOperation();
} catch (error) {
    await errorHandler.handleError(error, {
        indexPath: './my-index',
        operation: 'riskyOperation',
        metadata: { userId: '123' }
    });
}
```

##### retryOperation

Wraps an operation with automatic retry logic and exponential backoff.

```typescript
async retryOperation<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    operationId?: string
): Promise<T>
```

###### Parameters

| Name | Type | Description |
|------|------|-------------|
| operation | `() => Promise<T>` | The async operation to retry |
| context | `ErrorContext` | Contextual information |
| operationId | `string` | Optional unique ID to prevent duplicate retries |

###### Returns

The result of the successful operation

###### Example

```typescript
const result = await errorHandler.retryOperation(
    async () => {
        return await database.query('SELECT * FROM users');
    },
    { indexPath: './index', operation: 'queryUsers' },
    'query-users-123'
);
```

##### getErrorStats

Retrieves error statistics from the error log.

```typescript
async getErrorStats(): Promise<{
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: VectraError[];
}>
```

###### Example

```typescript
const stats = await errorHandler.getErrorStats();
console.log(`Total errors: ${stats.totalErrors}`);
console.log(`Critical errors: ${stats.errorsBySeverity.critical || 0}`);
```

##### clearErrorLog

Clears the error log file.

```typescript
async clearErrorLog(): Promise<void>
```

### LocalIndexWithErrorHandling

A wrapper around LocalIndex that provides automatic error handling and recovery.

#### Constructor

```typescript
new LocalIndexWithErrorHandling<TMetadata>(
    folderPath: string,
    indexName?: string
)
```

#### Additional Methods

All methods from `LocalIndex` are available with automatic error handling. Additional methods:

##### verifyAndRepair

Verifies index integrity and attempts repairs if needed.

```typescript
async verifyAndRepair(): Promise<{
    valid: boolean;
    repaired: boolean;
    errors: string[];
    actions: string[];
}>
```

###### Example

```typescript
const result = await index.verifyAndRepair();
if (!result.valid && !result.repaired) {
    console.error('Manual intervention required:', result.errors);
}
```

##### handleCatastrophicFailure

Attempts best-effort recovery from catastrophic failures.

```typescript
async handleCatastrophicFailure(): Promise<void>
```

###### Example

```typescript
process.on('uncaughtException', async (error) => {
    console.error('Catastrophic error:', error);
    try {
        await index.handleCatastrophicFailure();
    } catch (e) {
        console.error('Recovery failed:', e);
        process.exit(1);
    }
});
```

##### getErrorStats

Gets error statistics for this index instance.

```typescript
async getErrorStats(): Promise<ErrorStats>
```

## Enums

### ErrorSeverity

Indicates the severity level of an error.

```typescript
enum ErrorSeverity {
    LOW = 'low',           // Minor issues
    MEDIUM = 'medium',     // Degraded functionality
    HIGH = 'high',         // Significant impact
    CRITICAL = 'critical'  // System-threatening
}
```

### ErrorCategory

Categorizes errors by type for targeted recovery.

```typescript
enum ErrorCategory {
    IO = 'io',                         // File system errors
    CORRUPTION = 'corruption',         // Data integrity issues
    CONCURRENCY = 'concurrency',       // Lock/concurrent access
    VALIDATION = 'validation',         // Input validation
    MEMORY = 'memory',                 // Memory issues
    CONFIGURATION = 'configuration',   // Config problems
    UNKNOWN = 'unknown'               // Uncategorized
}
```

## Interfaces

### VectraError

Extended Error interface with additional metadata.

```typescript
interface VectraError extends Error {
    name: 'VectraError';
    code: string;
    severity: ErrorSeverity;
    category: ErrorCategory;
    recoverable: boolean;
    retryable: boolean;
    context?: Record<string, any>;
    timestamp: Date;
    cause?: Error;
}
```

### ErrorRecoveryStrategy

Interface for implementing custom recovery strategies.

```typescript
interface ErrorRecoveryStrategy {
    canRecover(error: VectraError): boolean;
    recover(error: VectraError, context: ErrorContext): Promise<RecoveryResult>;
    priority: number;  // Higher = runs first
}
```

#### Example Implementation

```typescript
const customStrategy: ErrorRecoveryStrategy = {
    priority: 200,
    
    canRecover(error: VectraError): boolean {
        return error.code === 'CUSTOM_ERROR' && error.recoverable;
    },
    
    async recover(error: VectraError, context: ErrorContext): Promise<RecoveryResult> {
        try {
            // Perform recovery actions
            await cleanupTempFiles(context.indexPath);
            
            return {
                recovered: true,
                actions: ['Cleaned up temporary files']
            };
        } catch (e) {
            return {
                recovered: false,
                actions: ['Cleanup attempted but failed']
            };
        }
    }
};
```

### ErrorContext

Contextual information passed to error handlers.

```typescript
interface ErrorContext {
    indexPath: string;              // Path to the index
    operation?: string;             // Operation that failed
    itemId?: string;               // Related item ID
    metadata?: Record<string, any>; // Additional context
}
```

### RecoveryResult

Result returned by recovery strategies.

```typescript
interface RecoveryResult {
    recovered: boolean;        // Whether recovery succeeded
    actions: string[];        // Actions taken
    newError?: VectraError;   // New error if recovery failed
}
```

## Events

The ErrorHandler extends EventEmitter and emits the following events:

### 'error'

Emitted when an error is handled (only if listeners exist).

```typescript
errorHandler.on('error', (error: VectraError, context: ErrorContext) => {
    console.log(`Error in ${context.operation}: ${error.message}`);
});
```

### 'recovery'

Emitted when error recovery succeeds.

```typescript
errorHandler.on('recovery', (data: {
    error: VectraError;
    strategy: string;
    actions: string[];
}) => {
    console.log(`Recovered from ${data.error.code} using ${data.strategy}`);
});
```

### 'recoveryFailed'

Emitted when a recovery strategy fails.

```typescript
errorHandler.on('recoveryFailed', (data: {
    error: VectraError;
    strategy: string;
    recoveryError: Error;
}) => {
    console.log(`Recovery strategy ${data.strategy} failed:`, data.recoveryError);
});
```

### 'retry'

Emitted during retry attempts.

```typescript
errorHandler.on('retry', (data: {
    attempt: number;
    maxRetries: number;
    error: VectraError;
    context: ErrorContext;
}) => {
    console.log(`Retry ${data.attempt}/${data.maxRetries} for ${data.context.operation}`);
});
```

### 'logError'

Emitted when error logging fails.

```typescript
errorHandler.on('logError', (error: Error) => {
    console.error('Failed to log error:', error);
});
```

## Error Codes

### IO Errors

| Code | Description | Severity | Recoverable | Retryable |
|------|-------------|----------|-------------|-----------|
| FILE_NOT_FOUND | File or directory not found (ENOENT) | HIGH | No | No |
| PERMISSION_DENIED | Access denied (EACCES/EPERM) | HIGH | No | No |
| NO_SPACE | Disk full (ENOSPC) | CRITICAL | Yes | No |
| TOO_MANY_FILES | Too many open files (EMFILE) | HIGH | No | Yes |

### Corruption Errors

| Code | Description | Severity | Recoverable | Retryable |
|------|-------------|----------|-------------|-----------|
| DATA_CORRUPTION | Generic data corruption | CRITICAL | Yes | No |
| CHECKSUM_MISMATCH | Checksum verification failed | CRITICAL | Yes | No |
| INDEX_CORRUPTED | Index file corrupted | CRITICAL | Yes | No |

### Concurrency Errors

| Code | Description | Severity | Recoverable | Retryable |
|------|-------------|----------|-------------|-----------|
| LOCK_ERROR | Generic lock error | MEDIUM | No | Yes |
| LOCK_TIMEOUT | Failed to acquire lock | MEDIUM | Yes | Yes |

### Validation Errors

| Code | Description | Severity | Recoverable | Retryable |
|------|-------------|----------|-------------|-----------|
| VALIDATION_ERROR | Input validation failed | LOW | No | No |

### Memory Errors

| Code | Description | Severity | Recoverable | Retryable |
|------|-------------|----------|-------------|-----------|
| OUT_OF_MEMORY | Memory exhausted (ENOMEM) | CRITICAL | No | No |

### Recovery Errors

| Code | Description | Severity | Recoverable | Retryable |
|------|-------------|----------|-------------|-----------|
| WAL_RECOVERY_FAILED | WAL recovery failed | HIGH | No | No |
| CHECKSUM_REPAIR_FAILED | Checksum repair failed | HIGH | No | No |
| RECOVERY_FAILED | Generic recovery failure | CRITICAL | No | No |

## Usage Examples

### Basic Error Handling

```typescript
import { LocalIndexWithErrorHandling, errorHandler } from 'vectra-enhanced';

// Create index with automatic error handling
const index = new LocalIndexWithErrorHandling('./my-index');

// Errors are handled automatically
await index.createIndex();
await index.insertItem({ vector: [1, 2, 3], metadata: { text: 'hello' } });
```

### Custom Error Handling

```typescript
import { ErrorHandler, ErrorSeverity, ErrorCategory } from 'vectra-enhanced';

// Create custom error handler
const customHandler = new ErrorHandler({
    maxRetries: 5,
    retryDelay: 2000,
    errorLogPath: './custom-errors.log'
});

// Add custom recovery strategy
customHandler.addRecoveryStrategy({
    priority: 150,
    canRecover: (error) => error.code === 'MY_CUSTOM_ERROR',
    recover: async (error, context) => {
        // Custom recovery logic
        return { recovered: true, actions: ['Custom recovery'] };
    }
});

// Listen to events
customHandler.on('error', (error, context) => {
    myMonitoring.recordError(error);
});
```

### Production Setup

```typescript
import { LocalIndexWithErrorHandling, errorHandler, ErrorSeverity } from 'vectra-enhanced';

// Configure error handling
const index = new LocalIndexWithErrorHandling('./prod-index');

// Set up monitoring
errorHandler.on('error', async (error, context) => {
    // Log all errors
    await logger.error({
        error: error.toJSON(),
        context
    });
    
    // Alert on critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
        await pagerDuty.alert({
            title: error.code,
            message: error.message
        });
    }
});

// Set up metrics
errorHandler.on('retry', (data) => {
    metrics.increment('vectra.retries', {
        operation: data.context.operation
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    await index.close();
    process.exit(0);
});
```