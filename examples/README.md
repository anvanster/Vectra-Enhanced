# Vectra Enhanced Examples

This directory contains example code demonstrating how to use Vectra Enhanced.

## Quick Start

```bash
node quickstart.js
```

This example shows the basics of:
- Creating an index
- Adding documents with vectors
- Searching for similar documents

## Comprehensive Examples

```bash
node api-examples.js
```

This file contains multiple examples showing:
- Basic usage and configuration
- Transactional operations
- Error handling and recovery
- Metadata filtering with MongoDB-style queries
- Data integrity verification
- Performance optimization
- Upsert operations

## Running Individual Examples

You can also import and run individual examples:

```javascript
const { basicUsage, metadataFilteringExample } = require('./api-examples');

// Run specific examples
await basicUsage();
await metadataFilteringExample();
```

## Key Features Demonstrated

1. **HNSW Indexing** - Fast O(log n) similarity search
2. **Transactions** - Atomic batch operations
3. **Error Recovery** - Automatic error handling
4. **Metadata Filtering** - MongoDB-style queries
5. **Data Integrity** - Checksums and verification
6. **Performance** - Compaction and optimization

## Notes

- All examples create their own index directories
- Indexes are file-based and persist between runs
- Delete the index directories to start fresh
- Vector dimensions must be consistent within an index