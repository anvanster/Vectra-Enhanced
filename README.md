# Vectra Enhanced

**An enhanced version of [Vectra](https://github.com/Stevenic/vectra) with production-ready features.**

Vectra Enhanced is a local vector database for Node.js with features similar to [Pinecone](https://www.pinecone.io/) or [Qdrant](https://qdrant.tech/) but built using local files. This enhanced version builds upon Steven Ickman's original Vectra, adding HNSW indexing, crash recovery, error handling, and many other features needed for production use.

Each Vectra index is a folder on disk. The `index.json` file contains vectors and indexed metadata, while additional metadata is stored in separate files. The enhanced version adds memory-efficient lazy loading, so the entire index is NOT loaded into memory - items are loaded on demand with intelligent caching.

Vectra uses HNSW (Hierarchical Navigable Small World) algorithm for fast approximate nearest neighbor search, enabling query times of 1-5ms even on large indexes with hundreds of thousands of vectors. The index supports filtering by metadata using the same subset of [MongoDB query operators](https://www.mongodb.com/docs/manual/reference/operator/query/) that Pinecone supports.

Vectra is designed for scenarios where you have a corpus of mostly static data that you'd like to include in your prompts. It's perfect for knowledge bases, document collections, or any scenario where you need fast local vector search without external dependencies.

Requires OpenAI API_KEY for embeddings.

## Features

- 🔍 **Local vector storage** - Stores vectors on disk for easy persistence
- 🔗 **Metadata filtering** - Each vector can have associated metadata for filtering
- 🪄 **Automatic ID generation** - Automatically generates unique IDs for each vector
- 🔐 **Write-Ahead Logging (WAL)** - Ensures data durability and crash recovery
- 🎯 **HNSW indexing** - Fast approximate nearest neighbor search for large datasets
- 🧹 **Automatic cleanup** - Removes orphaned metadata files and optimizes storage
- ⚡ **Operation queue** - Handles concurrent operations with retry logic
- 📊 **Lazy loading** - Load only what you need for better memory efficiency
- 🛡️ **Validation** - Built-in vector and metadata validation with schema support
- 🔄 **Atomic operations** - Safe multi-process concurrent access
- ✅ **Data integrity** - Checksum verification and automatic repair capabilities

## Installation

```
$ npm install vectra-enhanced
```

## Usage

First create an instance of `LocalIndex` with the path to the folder where you want you're items stored:

```typescript
import { LocalIndex } from 'vectra-enhanced';

const index = new LocalIndex(path.join(__dirname, '..', 'index'));
```

Next, from inside an async function, create your index:

```typescript
if (!(await index.isIndexCreated())) {
    await index.createIndex();
}
```

Add some items to your index:

```typescript
import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: `<YOUR_KEY>`,
});

async function getVector(text: string) {
    const response = await openai.embeddings.create({
        'model': 'text-embedding-ada-002',
        'input': text,
    });
    return response.data[0].embedding;
}

async function addItem(text: string) {
    await index.insertItem({
        vector: await getVector(text),
        metadata: { text },
    });
}

// Add items
await addItem('apple');
await addItem('oranges');
await addItem('red');
await addItem('blue');
```

Then query for items:

```typescript
async function query(text: string) {
    const vector = await getVector(text);
    const results = await index.queryItems(vector, 3);
    if (results.length > 0) {
        for (const result of results) {
            console.log(`[${result.score}] ${result.item.metadata.text}`);
        }
    } else {
        console.log(`No results found.`);
    }
}

await query('green');
/*
[0.9036569942401076] blue
[0.8758153664568566] red
[0.8323828606103998] apple
*/

await query('banana');
/*
[0.9033128691220631] apple
[0.8493374123092652] oranges
[0.8415324469533297] blue
*/
```

## Data Integrity and Checksums

Vectra includes built-in data integrity verification to ensure your vector database remains consistent and uncorrupted:

### Verify Index Integrity

```typescript
// Comprehensive integrity check
const result = await index.verifyIntegrity({
    validateStructure: true,
    validateReferences: true,
    validateChecksums: true
});

if (!result.valid) {
    console.error('Integrity issues found:', result.errors);
}
```

### Update and Verify Checksums

```typescript
// Calculate and store checksums after modifications
await index.updateChecksums();

// Later, verify checksums haven't changed
const verification = await index.verifyChecksums();
if (!verification.valid) {
    console.log('Data has been modified:', verification.mismatches);
}
```

### Generate Integrity Reports

```typescript
// Generate human-readable report
const report = await index.generateIntegrityReport();
console.log(report);
// Outputs:
// Data Integrity Report for ./my-index
// ============================================================
// Status: VALID
// Generated: 2024-01-15T10:30:00.000Z
// Checksums:
//   - index.json: a1b2c3d4e5f6...
//   - HNSW index: 7890abcdef123...
```

### Automatic Repair

```typescript
// Attempt to repair any issues found
const repairResult = await index.repairIndex();
if (repairResult.repaired) {
    console.log('Repairs performed:', repairResult.actions);
}
```

## Performance Optimization

### Lazy Loading for Large Indexes

For memory-efficient handling of large indexes:

```typescript
import { LazyIndex } from 'vectra-enhanced';

// Only loads items as needed
const lazyIndex = new LazyIndex('./my-large-index');

// Stream through items without loading all into memory
for await (const item of lazyIndex.items()) {
    // Process item
}

// Paginate results
const page = await lazyIndex.listItems({ page: 1, pageSize: 100 });
```

### Index Statistics and Maintenance

```typescript
// Get index statistics
const stats = await index.getIndexStats();
console.log(`Total items: ${stats.items}`);
console.log(`Index size: ${stats.size} bytes`);
console.log(`Dimensions: ${stats.dimensions}`);

// Compact the index to optimize storage
const compactStats = await index.compact();
console.log(`Cleaned up ${compactStats.orphanedFilesDeleted} orphaned files`);

// Rebuild HNSW index for optimal performance
await index.rebuildHNSWIndex();
```

## Configuration Options

### Vector Validation

```typescript
await index.setVectorOptions({
    maxDimensions: 1536,      // Maximum allowed dimensions
    validateOnInsert: true,   // Validate vectors on insert
    normalizeVectors: false,  // Don't normalize vectors
    allowDifferentDimensions: false // Require consistent dimensions
});
```

### Metadata Validation

```typescript
await index.setMetadataOptions({
    maxFieldLength: 1000,     // Maximum string field length
    maxFields: 50,            // Maximum number of fields
    validateOnInsert: true,   // Validate metadata on insert
    schemaValidation: {
        type: 'object',
        properties: {
            text: { type: 'string', maxLength: 500 },
            category: { type: 'string', enum: ['fruit', 'vegetable', 'color'] },
            price: { type: 'number', minimum: 0 },
            tags: { type: 'array', items: { type: 'string' } }
        },
        required: ['text', 'category']
    }
});
```

### Write-Ahead Logging (WAL)

```typescript
// Enable WAL for crash recovery
await index.enableWAL({
    flushInterval: 1000,      // Flush to disk every second
    maxSize: 10 * 1024 * 1024, // Rotate at 10MB
    keepRotated: 3            // Keep 3 rotated WAL files
});

// Check WAL statistics
const walStats = await index.getWALStatistics();
console.log(`WAL entries: ${walStats.entryCount}`);
console.log(`WAL size: ${walStats.totalSize} bytes`);
```

## Backward Compatibility

Vectra Enhanced maintains **full backward compatibility** with the original Vectra API. Existing code using the original Vectra will work without modification:

```typescript
// Original Vectra syntax still works:
const results = await index.queryItems(vector, topK, filter);

// New enhanced syntax with text search:
const results = await index.queryItems(vector, query, topK, filter);
```

Simply change your import from `'vectra'` to `'vectra-enhanced'` and your existing code will continue to work while gaining access to all the new features.

## API Reference

For detailed API documentation, see the [docs](./docs) folder:
- [Error Handling Guide](./docs/ERROR_HANDLING.md)
- [Checksum Implementation](./docs/CHECKSUMS.md)
- [API Reference](./docs/index.md)

## Contributing

Contributions are welcome! Please see [PERFORMANCE_TODO.md](./PERFORMANCE_TODO.md) for planned improvements.

## License

MIT
