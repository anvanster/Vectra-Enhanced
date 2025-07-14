# Lazy Loading and Pagination Implementation

## Overview

Vectra now supports lazy loading and pagination to optimize memory usage for large-scale vector databases. This feature allows you to work with indices containing millions of items without loading the entire dataset into memory.

## Problem Solved

Previously, the entire index was loaded into memory during operations, leading to:
- High memory consumption for large indices
- Slow startup times as index size grows
- Out-of-memory errors for very large datasets
- Poor performance when only accessing a subset of data

## Implementation

### 1. LazyIndex Class (`src/LazyIndex.ts`)

A new class that provides memory-efficient access to vector indices:

#### Key Features:
- **Chunked Storage**: Items are stored in chunks (default 1000 items/chunk)
- **LRU Cache**: Recently accessed items and chunks are cached
- **Streaming API**: Iterate through items without loading all data
- **Pagination**: Built-in support for paginated access
- **External Metadata Support**: Works seamlessly with external metadata files

#### Core Methods:
```typescript
// Get a single item
const item = await lazyIndex.getItem('item-id');

// List items with pagination
const page = await lazyIndex.listItems(pageNumber, pageSize);

// Stream all items
for await (const item of lazyIndex.iterateItems()) {
    // Process item
}

// Filter with pagination
const filtered = await lazyIndex.listItemsByMetadata(filter, page, size);
```

### 2. LocalIndex Integration

The LocalIndex class now supports lazy mode:

#### Creating a Lazy Index
```typescript
const index = new LocalIndex('./my-index');
await index.createIndex({
    version: 1,
    lazy: true,
    lazyOptions: {
        cacheSize: 1000,    // Number of items to cache
        pageSize: 100,      // Default page size
        preloadMetadata: false
    }
});
```

#### Converting Existing Index
```typescript
// Convert regular index to lazy format
await index.convertToLazy(chunkSize);
```

## Usage Examples

### 1. Large-Scale Data Processing
```typescript
const index = new LocalIndex('./large-index');
await index.createIndex({ version: 1, lazy: true });

// Process millions of items without memory issues
for (let i = 0; i < 1000000; i++) {
    await index.insertItem({
        vector: generateVector(),
        metadata: { index: i }
    });
}
```

### 2. Paginated Access
```typescript
const lazyIndex = new LazyIndex('./my-index');

// Get page 1 with 50 items
const page1 = await lazyIndex.listItems(1, 50);
console.log(`Showing ${page1.items.length} of ${page1.pageInfo.totalItems} items`);
console.log(`Page ${page1.pageInfo.pageNumber} of ${page1.pageInfo.totalPages}`);

// Check if more pages exist
if (page1.hasMore) {
    const page2 = await lazyIndex.listItems(2, 50);
}
```

### 3. Streaming Large Results
```typescript
// Process all items matching a filter without loading into memory
for await (const item of lazyIndex.filterItems({ category: 'products' })) {
    await processItem(item);
}
```

### 4. Cache Management
```typescript
const lazyIndex = new LazyIndex('./my-index', {
    cacheSize: 5000  // Cache up to 5000 items
});

// Check cache statistics
const stats = lazyIndex.getCacheStats();
console.log(`Items cached: ${stats.itemCacheSize}`);
console.log(`Chunks cached: ${stats.chunkCacheSize}`);

// Clear cache to free memory
lazyIndex.clearCache();
```

## CLI Commands

### Convert Existing Index
```bash
# Convert regular index to lazy format
vectra convert-lazy ./my-index --chunk-size 2000

# Output:
# converting index at ./my-index to lazy format
# Index converted to lazy format successfully
```

### Create Lazy Index Directly
When using the vectra CLI programmatically, specify lazy options during creation.

## Architecture

### Manifest File
```json
{
    "version": 1,
    "totalItems": 1000000,
    "chunks": [
        {
            "id": "chunk-uuid",
            "startIndex": 0,
            "endIndex": 999,
            "itemCount": 1000,
            "filename": "chunk-uuid.json"
        }
    ],
    "vectorDimensions": 384,
    "lastModified": "2024-01-01T00:00:00Z"
}
```

### Chunk Files
- Stored in `chunks/` subdirectory
- Each chunk contains array of items
- Loaded on-demand and cached

### Index Structure
```
my-index/
├── index.json          # Minimal index with lazy flag
├── manifest.json       # Chunk metadata
├── chunks/             # Chunk storage
│   ├── chunk-1.json
│   ├── chunk-2.json
│   └── ...
└── *.json             # External metadata files
```

## Performance Characteristics

### Memory Usage
- **Regular Index**: O(n) where n = total items
- **Lazy Index**: O(c) where c = cache size (configurable)

### Access Patterns
- **Sequential Access**: Optimal, chunks loaded in order
- **Random Access**: Good, with LRU cache for hot items
- **Filtered Access**: Efficient streaming without full load

### Startup Time
- **Regular Index**: O(n) - loads all items
- **Lazy Index**: O(1) - only loads manifest

## Best Practices

### 1. Choose Appropriate Chunk Size
```typescript
// Smaller chunks (100-500) for:
// - Frequently filtered data
// - Random access patterns
await index.convertToLazy(500);

// Larger chunks (1000-5000) for:
// - Sequential processing
// - Batch operations
await index.convertToLazy(2000);
```

### 2. Configure Cache Based on Access Pattern
```typescript
// High cache for random access
const randomAccess = new LazyIndex('./index', {
    cacheSize: 10000
});

// Low cache for streaming
const streaming = new LazyIndex('./index', {
    cacheSize: 100
});
```

### 3. Use Streaming for Large Operations
```typescript
// Good: Stream items
for await (const item of lazyIndex.iterateItems()) {
    await process(item);
}

// Avoid: Loading all items
const allItems = await index.listItems(); // May OOM
```

### 4. Monitor Cache Performance
```typescript
setInterval(() => {
    const stats = lazyIndex.getCacheStats();
    if (stats.itemCacheSize > 0.8 * cacheSize) {
        // Consider increasing cache size
    }
}, 60000);
```

## Migration Guide

### Converting Existing Indices
```typescript
// 1. Load existing index
const index = new LocalIndex('./existing-index');

// 2. Convert to lazy format
await index.convertToLazy(1000);

// 3. Index now operates in lazy mode
const items = await index.listItems(); // Uses lazy loading
```

### Compatibility
- Lazy indices are backward compatible
- All LocalIndex methods work with lazy indices
- External tools can read chunk files directly

## Limitations

1. **Write Performance**: Lazy indices require chunk management during writes
2. **Query Complexity**: Complex queries may require multiple chunk loads
3. **Cache Tuning**: Requires configuration based on use case

## Future Enhancements

1. **Smart Chunking**: Group related items in same chunk
2. **Compression**: Compress chunks for disk space savings
3. **Distributed Chunks**: Store chunks across multiple machines
4. **Query Optimization**: Chunk-level metadata for faster filtering

This implementation ensures Vectra can scale to handle massive vector databases while maintaining efficient memory usage and good performance characteristics.