# Operation Queue Implementation for Concurrent Writes

## Overview

The Vectra vector database now includes a robust operation queue system that handles concurrent write operations gracefully without timeouts. This implementation ensures data integrity while maximizing throughput.

## Key Features

### 1. Automatic Queuing
All write operations (insert, upsert, delete) are automatically queued:
- No more timeout errors on concurrent writes
- Operations are processed sequentially to maintain consistency
- Automatic retry on transient failures

### 2. Retry Mechanism
- Default 5 retries with exponential backoff
- Configurable retry count and delays
- Failed operations emit events for monitoring

### 3. Priority Support
- Operations can be assigned priorities
- Higher priority operations are processed first
- Same priority operations maintain FIFO order

### 4. Zero Configuration
- Works out of the box with sensible defaults
- No changes required to existing code
- Backward compatible API

## Architecture

### OperationQueue Class
```typescript
class OperationQueue extends EventEmitter {
    // Manages queued operations
    // Handles retries and priorities
    // Emits events for monitoring
}
```

### Integration with LocalIndex
- All write methods now use the queue internally
- Read operations bypass the queue for performance
- Flush method available to wait for queue completion

## Usage Examples

### Basic Concurrent Writes
```typescript
const index = new LocalIndex('./my-index');
await index.createIndex({ version: 1 });

// Fire off many concurrent writes - no timeouts!
const promises = [];
for (let i = 0; i < 100; i++) {
    promises.push(index.insertItem({
        id: `item-${i}`,
        vector: [i, i+1, i+2],
        metadata: { index: i }
    }));
}

// All operations complete successfully
await Promise.all(promises);
```

### Ensuring Completion
```typescript
// Queue operations
await index.insertItem(item1);
await index.insertItem(item2);
await index.deleteItem('old-item');

// Wait for all queued operations to complete
await index.flush();
```

### Mixed Operations
```typescript
// These all queue appropriately
const results = await Promise.all([
    index.insertItem(newItem),
    index.upsertItem(existingItem),
    index.deleteItem('item-to-remove'),
    index.getItem('some-id'), // Read operations are not queued
]);
```

## Performance Characteristics

- **Throughput**: Sequential processing ensures consistent performance
- **Latency**: Minimal overhead for single operations
- **Concurrency**: Handles hundreds of concurrent operations
- **Memory**: Queue size limited only by available memory

## Configuration Options

The queue can be configured during LocalIndex construction:

```typescript
const index = new LocalIndex('./my-index');
// Default configuration:
// - maxConcurrency: 1 (serialized writes)
// - maxRetries: 5
// - retryDelay: 100ms
// - priorityQueue: true
```

## Events

The operation queue emits events for monitoring:
- `enqueued`: Operation added to queue
- `processing`: Operation started
- `completed`: Operation succeeded
- `retry`: Operation failed, retrying
- `failed`: Operation failed after all retries

## Comparison: Before vs After

### Before (Timeouts and Failures)
```typescript
// Multiple concurrent writes would timeout or fail
for (let i = 0; i < 50; i++) {
    index.insertItem(item); // ❌ Timeout errors!
}
```

### After (Smooth Operation)
```typescript
// All operations complete successfully
for (let i = 0; i < 50; i++) {
    index.insertItem(item); // ✅ Queued and processed!
}
```

## Best Practices

1. **Batch Operations**: For best performance, use transactions for bulk operations
2. **Monitor Queue Length**: Check queue length in high-throughput scenarios
3. **Handle Errors**: Operations can still fail after retries
4. **Use Flush**: Call flush() before shutdown to ensure all operations complete

## Implementation Details

- Queue is in-memory (not persisted)
- Operations are processed in a single Node.js process
- Write operations acquire file locks for multi-process safety
- Retries use exponential backoff to avoid thundering herd

## Future Enhancements

1. **Persistent Queue**: Store queue on disk for crash recovery
2. **Distributed Queue**: Redis-backed queue for multi-node deployments
3. **Batch Processing**: Group operations for better performance
4. **Metrics Collection**: Built-in performance monitoring

This queue implementation provides a robust foundation for handling concurrent operations while maintaining the simplicity and reliability of the Vectra vector database.