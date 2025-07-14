# Atomic Write Operations with Retry Mechanism

## Overview

The Vectra vector database now includes atomic write operations with built-in retry mechanisms to handle transient failures gracefully.

## Features

### 1. Atomic File Writes
- **Temp File Pattern**: Writes to temporary file first, then atomically renames
- **Data Durability**: Uses fsync to ensure data is on disk before rename
- **Automatic Cleanup**: Temp files cleaned up on failure

### 2. Retry Mechanism
- **Default 3 Retries**: Configurable retry count
- **Exponential Backoff**: Delays between retries increase exponentially
- **Smart Error Handling**: Some errors trigger retries, others fail immediately

### 3. Error Classification
**Retriable Errors:**
- `ENOSPC`: No space left on device
- `EAGAIN`: Resource temporarily unavailable
- `EBUSY`: Resource busy
- Network timeouts
- Transient I/O errors

**Non-Retriable Errors:**
- `EACCES`: Permission denied
- `EISDIR`: Is a directory
- `ENOTDIR`: Not a directory
- `EINVAL`: Invalid argument

## API

### Basic Atomic Write
```typescript
// Simple write with default retry (3 attempts)
await AtomicOperations.writeFile(filePath, data);

// Custom retry configuration
await AtomicOperations.writeFile(filePath, data, {
    retries: 5,        // Try up to 5 times
    retryDelay: 200    // Start with 200ms delay
});
```

### Atomic JSON Update
```typescript
// Read-modify-write with automatic retry
await AtomicOperations.updateJsonFile(filePath, (data) => {
    data.count++;
    return data;
}, {
    retries: 3,
    retryDelay: 100
});
```

### Backup Operations
```typescript
// Create backup before risky operation
const backupPath = await AtomicOperations.createBackup(filePath);

try {
    // Perform risky operation
    await riskyOperation();
} catch (err) {
    // Restore from backup on failure
    await AtomicOperations.restoreBackup(backupPath, filePath);
    throw err;
}
```

## How It Works

### Write Process
1. Generate unique temp file name: `.index.json.{uuid}.tmp`
2. Write data to temp file
3. Flush to disk with fsync
4. Atomically rename temp file to target
5. On failure: clean up temp file and retry if appropriate

### Retry Logic
```
Attempt 1: immediate
Attempt 2: wait 100ms (100 * 2^0)
Attempt 3: wait 200ms (100 * 2^1)
Attempt 4: wait 400ms (100 * 2^2)
...
```

## Integration with LocalIndex

All index write operations use atomic writes:
- `createIndex()`: Index creation with retry
- `endUpdate()`: Save changes atomically
- Metadata file writes: All use atomic operations

## Benefits

1. **No Corruption**: Partial writes impossible
2. **Automatic Recovery**: Transient failures handled transparently
3. **Production Ready**: Handles common I/O issues gracefully
4. **Configurable**: Tune retry behavior for your environment

## Best Practices

1. **Use Default Settings**: The defaults work well for most cases
2. **Monitor Failures**: Log when retries occur frequently
3. **Adjust for Environment**: Increase retries for unreliable storage
4. **Handle Final Failures**: Always handle the case where all retries fail

## Example: Handling Concurrent Updates

```typescript
// Multiple processes trying to update the same index
async function safeUpdate(index: LocalIndex, item: any) {
    try {
        // Operation queue handles concurrency
        // Atomic writes handle I/O failures
        await index.insertItem(item);
    } catch (err) {
        if (err.message.includes('after 3 attempts')) {
            // All retries failed - serious issue
            console.error('Persistent write failure:', err);
            // Consider alerting ops team
        }
        throw err;
    }
}
```

## Testing

The atomic write implementation is thoroughly tested:
- ✅ Basic atomic writes
- ✅ Concurrent write handling
- ✅ Retry on transient failures
- ✅ Immediate failure on permanent errors
- ✅ Temp file cleanup
- ✅ Backup/restore functionality

This implementation provides a robust foundation for reliable data persistence in production environments.