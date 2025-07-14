# Vectra Enhanced API Reference

## Table of Contents

- [Core Classes](#core-classes)
  - [LocalIndex](#localindex)
  - [LocalIndexWithErrorHandling](#localindexwitherrorhandling)
  - [LazyIndex](#lazyindex)
- [Main Methods](#main-methods)
  - [Index Management](#index-management)
  - [Data Operations](#data-operations)
  - [Query Operations](#query-operations)
  - [Maintenance Operations](#maintenance-operations)
- [Configuration](#configuration)
- [Types and Interfaces](#types-and-interfaces)

## Core Classes

### LocalIndex

The base class for creating and managing a vector index.

```typescript
import { LocalIndex } from 'vectra-enhanced';

const index = new LocalIndex(folderPath: string, indexName?: string);
```

#### Parameters
- `folderPath` (string): Path to the folder where index data will be stored
- `indexName` (string, optional): Name of the index file (default: 'index.json')

### LocalIndexWithErrorHandling

Enhanced version with automatic error recovery and safety features.

```typescript
import { LocalIndexWithErrorHandling } from 'vectra-enhanced';

const index = new LocalIndexWithErrorHandling(folderPath: string, indexName?: string);
```

Includes all LocalIndex methods plus automatic error handling, recovery strategies, and safety features.

### LazyIndex

Memory-efficient index for large datasets.

```typescript
import { LazyIndex } from 'vectra-enhanced';

const index = new LazyIndex(folderPath: string, options?: LazyIndexOptions);
```

#### LazyIndexOptions
```typescript
interface LazyIndexOptions {
    cacheSize?: number;      // Max items to keep in memory (default: 1000)
    pageSize?: number;       // Items per page for pagination (default: 100)
    preloadPages?: number;   // Pages to preload (default: 1)
}
```

## Main Methods

### Index Management

#### createIndex

Creates a new index with optional configuration.

```typescript
await index.createIndex(config?: CreateIndexConfig): Promise<void>
```

##### CreateIndexConfig
```typescript
interface CreateIndexConfig {
    version?: number;                    // Index version (default: 1)
    deleteIfExists?: boolean;            // Delete existing index (default: false)
    distanceMetric?: 'cosine' | 'euclidean' | 'dotProduct'; // (default: 'cosine')
    metadata_config?: {
        indexed?: string[];              // Properties to index for filtering
        dynamic?: boolean;               // Allow arbitrary metadata fields
    };
    hnswConfig?: {
        M?: number;                      // HNSW connectivity (default: 16)
        efConstruction?: number;         // Construction quality (default: 200)
        efSearch?: number;               // Search quality (default: 50)
    };
}
```

##### Example
```typescript
await index.createIndex({
    version: 1,
    deleteIfExists: true,
    distanceMetric: 'cosine',
    metadata_config: {
        indexed: ['category', 'tags'],
        dynamic: true
    }
});
```

#### isIndexCreated

Checks if an index exists.

```typescript
await index.isIndexCreated(): Promise<boolean>
```

#### deleteIndex

Deletes the index and all associated data.

```typescript
await index.deleteIndex(): Promise<void>
```

### Data Operations

#### beginUpdate / endUpdate

Start and commit a transaction for multiple operations.

```typescript
await index.beginUpdate(): Promise<void>
await index.endUpdate(): Promise<void>
```

##### Example
```typescript
await index.beginUpdate();
try {
    await index.insertItem({ vector: [...], metadata: {...} });
    await index.insertItem({ vector: [...], metadata: {...} });
    await index.endUpdate();
} catch (error) {
    await index.cancelUpdate();
    throw error;
}
```

#### insertItem

Inserts a new item into the index.

```typescript
await index.insertItem(item: Partial<IndexItem>): Promise<IndexItem>
```

##### Parameters
```typescript
interface IndexItem {
    id?: string;              // Auto-generated if not provided
    vector: number[];         // Embedding vector
    metadata?: Record<string, any>;  // Associated metadata
    norm?: number;           // Vector norm (auto-calculated)
}
```

##### Example
```typescript
const item = await index.insertItem({
    vector: [0.1, 0.2, 0.3, ...],
    metadata: {
        text: 'Sample document',
        category: 'example',
        timestamp: Date.now()
    }
});
console.log(item.id); // Generated ID
```

#### upsertItem

Insert or update an item.

```typescript
await index.upsertItem(item: Partial<IndexItem>): Promise<IndexItem>
```

#### updateItem

Update an existing item.

```typescript
await index.updateItem(update: Partial<IndexItem> & { id: string }): Promise<void>
```

#### deleteItem

Delete an item by ID.

```typescript
await index.deleteItem(id: string): Promise<void>
```

#### deleteItems

Delete multiple items by IDs.

```typescript
await index.deleteItems(ids: string[]): Promise<void>
```

#### getItem

Retrieve a single item by ID.

```typescript
await index.getItem(id: string): Promise<IndexItem | undefined>
```

#### listItems

List all items with optional pagination.

```typescript
await index.listItems(options?: ListOptions): Promise<IndexItem[]>
```

##### ListOptions
```typescript
interface ListOptions {
    page?: number;      // Page number (1-based)
    pageSize?: number;  // Items per page
}
```

#### listItemsByMetadata

List items filtered by metadata.

```typescript
await index.listItemsByMetadata(filter: MetadataFilter): Promise<IndexItem[]>
```

### Query Operations

#### queryItems

Search for similar vectors.

```typescript
await index.queryItems(
    vector: number[],
    topK: number,
    filter?: MetadataFilter,
    includeVectors?: boolean
): Promise<QueryResult[]>
```

##### Parameters
- `vector`: Query embedding vector
- `topK`: Number of results to return
- `filter`: Optional metadata filter
- `includeVectors`: Include vectors in results (default: true)

##### QueryResult
```typescript
interface QueryResult {
    item: IndexItem;
    score: number;  // Similarity score (0-1, higher is better)
}
```

##### Example
```typescript
const results = await index.queryItems(
    queryVector,
    10,
    { category: 'example' }
);

results.forEach(result => {
    console.log(`Score: ${result.score}, ID: ${result.item.id}`);
});
```

### Maintenance Operations

#### compact

Optimize storage by removing deleted items and compacting files.

```typescript
await index.compact(): Promise<CompactionStats>
```

##### CompactionStats
```typescript
interface CompactionStats {
    orphanedFilesDeleted: number;
    logEntriesCompacted: number;
    bytesReclaimed: number;
    duration: number;
}
```

#### getIndexStats

Get index statistics.

```typescript
await index.getIndexStats(): Promise<IndexStats>
```

##### IndexStats
```typescript
interface IndexStats {
    version: number;
    dimensions: number;
    size: number;        // Total size in bytes
    items: number;       // Number of items
    metadata_config: {
        indexed: string[];
    };
    distanceMetric: string;
}
```

#### rebuildHNSWIndex

Rebuild the HNSW index for optimal performance.

```typescript
await index.rebuildHNSWIndex(): Promise<void>
```

## Data Integrity Methods

#### verifyIntegrity

Verify index integrity.

```typescript
await index.verifyIntegrity(options?: IntegrityOptions): Promise<IntegrityResult>
```

##### IntegrityOptions
```typescript
interface IntegrityOptions {
    validateStructure?: boolean;   // Check index structure
    validateReferences?: boolean;  // Check item references
    validateChecksums?: boolean;   // Verify checksums
}
```

#### updateChecksums

Update checksums for all index data.

```typescript
await index.updateChecksums(): Promise<void>
```

#### repairIndex

Attempt to repair integrity issues.

```typescript
await index.repairIndex(): Promise<RepairResult>
```

## Write-Ahead Logging (WAL)

#### enableWAL

Enable write-ahead logging for crash recovery.

```typescript
await index.enableWAL(options?: WALOptions): Promise<void>
```

##### WALOptions
```typescript
interface WALOptions {
    flushInterval?: number;    // Flush interval in ms (default: 1000)
    maxSize?: number;         // Max WAL size before rotation (default: 10MB)
    keepRotated?: number;     // Number of rotated files to keep (default: 3)
}
```

#### getWALStatistics

Get WAL statistics.

```typescript
await index.getWALStatistics(): Promise<WALStats>
```

## Configuration Methods

#### setVectorOptions

Configure vector validation.

```typescript
await index.setVectorOptions(options: VectorOptions): Promise<void>
```

##### VectorOptions
```typescript
interface VectorOptions {
    maxDimensions?: number;
    validateOnInsert?: boolean;
    normalizeVectors?: boolean;
    allowDifferentDimensions?: boolean;
}
```

#### setMetadataOptions

Configure metadata validation.

```typescript
await index.setMetadataOptions(options: MetadataOptions): Promise<void>
```

##### MetadataOptions
```typescript
interface MetadataOptions {
    maxFieldLength?: number;
    maxFields?: number;
    validateOnInsert?: boolean;
    schemaValidation?: object;  // JSON Schema
}
```

#### setDataIntegrityOptions

Configure data integrity features.

```typescript
await index.setDataIntegrityOptions(options: DataIntegrityOptions): Promise<void>
```

##### DataIntegrityOptions
```typescript
interface DataIntegrityOptions {
    enableChecksums?: boolean;
    checksumAlgorithm?: 'sha256' | 'md5';
    validateOnRead?: boolean;
    autoRepair?: boolean;
}
```

## Types and Interfaces

### MetadataFilter

MongoDB-style query operators for filtering.

```typescript
type MetadataFilter = {
    [key: string]: any | {
        $eq?: any;
        $ne?: any;
        $gt?: number;
        $gte?: number;
        $lt?: number;
        $lte?: number;
        $in?: any[];
        $nin?: any[];
        $exists?: boolean;
        $contains?: string;
        $regex?: string;
    };
} | {
    $and?: MetadataFilter[];
    $or?: MetadataFilter[];
    $not?: MetadataFilter;
};
```

#### Examples
```typescript
// Simple equality
{ category: 'fruit' }

// Comparison
{ price: { $lt: 10 } }

// Array membership
{ tags: { $in: ['organic', 'local'] } }

// Complex query
{
    $and: [
        { category: 'fruit' },
        { price: { $gte: 1, $lte: 5 } }
    ]
}
```

## Error Handling

When using `LocalIndexWithErrorHandling`, errors are automatically handled. For manual error handling:

```typescript
import { errorHandler, ErrorSeverity } from 'vectra-enhanced';

errorHandler.on('error', (error, context) => {
    if (error.severity === ErrorSeverity.CRITICAL) {
        // Handle critical errors
    }
});

errorHandler.on('recovery', (data) => {
    console.log(`Recovered from ${data.error.code}`);
});
```

## Migration from Original Vectra

Vectra Enhanced is **fully backward compatible** with the original Vectra. All original APIs work without modification:

```typescript
// Before
import { LocalIndex } from 'vectra';

// After
import { LocalIndex } from 'vectra-enhanced';
```

### Backward Compatible queryItems

The `queryItems` method supports both the original and enhanced signatures:

```typescript
// Original Vectra signature (still works!)
const results = await index.queryItems(vector, topK);
const results = await index.queryItems(vector, topK, filter);

// New enhanced signature with text search
const results = await index.queryItems(vector, query, topK, filter);
const results = await index.queryItems(vector, query, topK, filter, isBm25, alpha);
```

The method automatically detects which signature you're using based on the parameter types.

### Enhanced Features

For additional safety and features, use:
```typescript
import { LocalIndexWithErrorHandling } from 'vectra-enhanced';
```

## Performance Tips

1. **Use transactions** for bulk operations:
   ```typescript
   await index.beginUpdate();
   // Insert many items
   await index.endUpdate();
   ```

2. **Enable lazy loading** for large indexes:
   ```typescript
   const index = new LazyIndex('./large-index');
   ```

3. **Rebuild HNSW** after major changes:
   ```typescript
   await index.rebuildHNSWIndex();
   ```

4. **Regular maintenance**:
   ```typescript
   await index.compact();
   ```

## See Also

- [Error Handling API Reference](./ERROR_HANDLING_API_REFERENCE.md)
- [Checksum API Reference](./CHECKSUM_API_REFERENCE.md)
- [Implementation Guides](./index.md)