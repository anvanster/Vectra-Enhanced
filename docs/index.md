# Vectra Documentation

Welcome to the Vectra documentation. This guide covers all aspects of using and extending Vectra's vector database capabilities.

## Quick Links

### Core Features

- **[Checksums](CHECKSUMS.md)** - Data integrity and checksum verification
  - [Implementation Guide](CHECKSUM_IMPLEMENTATION.md)
  - [API Reference](CHECKSUM_API_REFERENCE.md)

- **[Error Handling](ERROR_HANDLING.md)** - Comprehensive error handling and recovery
  - [Implementation Guide](ERROR_HANDLING_IMPLEMENTATION.md)
  - [API Reference](ERROR_HANDLING_API_REFERENCE.md)

### Getting Started

1. **Installation**
   ```bash
   npm install vectra-enhanced
   ```

2. **Basic Usage**
   ```typescript
   import { LocalIndexWithErrorHandling } from 'vectra-enhanced';
   
   const index = new LocalIndexWithErrorHandling('./my-index');
   await index.createIndex();
   ```

3. **Key Features**
   - Vector similarity search with HNSW algorithm
   - Full-text search with BM25
   - Hybrid search combining vector and text
   - Data integrity with SHA-256 checksums
   - Automatic error recovery
   - Write-Ahead Logging (WAL)
   - Multi-process safe operations

## Documentation Structure

### User Guides
- [Error Handling User Guide](ERROR_HANDLING.md) - Practical error handling usage
- [Checksums User Guide](CHECKSUMS.md) - Using checksums for data integrity

### Technical Guides
- [Checksum Implementation](CHECKSUM_IMPLEMENTATION.md) - Deep dive into checksum architecture
- [Error Handling Implementation](ERROR_HANDLING_IMPLEMENTATION.md) - Error system architecture

### API References
- [Checksum API Reference](CHECKSUM_API_REFERENCE.md) - Complete checksum API documentation
- [Error Handling API Reference](ERROR_HANDLING_API_REFERENCE.md) - Complete error handling API

## Feature Documentation

### Data Integrity
Vectra uses SHA-256 checksums to ensure data integrity:
- Automatic checksum generation on write
- Verification on read
- Corruption detection and recovery
- [Learn more →](CHECKSUMS.md)

### Error Handling
Comprehensive error handling with automatic recovery:
- Non-crashing by default
- Automatic recovery strategies
- Retry with exponential backoff
- Event-driven error monitoring
- [Learn more →](ERROR_HANDLING.md)

### Concurrency
Safe multi-process operations:
- File-based locking
- Write-Ahead Logging
- Operation queuing
- Atomic writes

### Performance
Optimized for large-scale operations:
- HNSW index for fast similarity search
- Lazy loading and pagination
- Memory-efficient operations
- Background compaction

## Examples

### Creating a Production-Ready Index

```typescript
import { LocalIndexWithErrorHandling, errorHandler } from 'vectra-enhanced';

// Create index with error handling
const index = new LocalIndexWithErrorHandling('./prod-index');

// Set up monitoring
errorHandler.on('error', (error, context) => {
    console.error(`Error in ${context.operation}:`, error);
    // Send to monitoring service
});

// Create index with data integrity
await index.createIndex({
    version: 1,
    deleteIfExists: true
});

// Enable checksums
await index.setDataIntegrityOptions({
    enableChecksums: true,
    checksumAlgorithm: 'sha256',
    validateOnRead: true,
    autoRepair: true
});
```

### Handling Errors Gracefully

```typescript
// All operations are automatically wrapped with error handling
try {
    await index.beginUpdate();
    
    await index.insertItem({
        vector: [1, 2, 3],
        metadata: { text: 'example' }
    });
    
    await index.endUpdate();
} catch (error) {
    // Error is already categorized and recovery attempted
    if (error.code === 'CHECKSUM_MISMATCH') {
        console.log('Data corruption detected and handled');
    }
}
```

### Verifying Data Integrity

```typescript
// Verify entire index
const result = await index.verifyIntegrity({
    validateStructure: true,
    validateReferences: true,
    validateChecksums: true
});

if (!result.valid) {
    console.log('Issues found:', result.errors);
    
    // Attempt repair
    const repairResult = await index.repairIndex();
    console.log('Repair result:', repairResult);
}
```

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│           Application Layer                  │
├─────────────────────────────────────────────┤
│     LocalIndexWithErrorHandling             │
│  (Safe wrapper with error recovery)         │
├─────────────────────────────────────────────┤
│           Core Components                    │
│  ┌─────────────┐  ┌──────────────────┐     │
│  │   HNSW      │  │  Error Handler   │     │
│  │   Index     │  │  & Recovery      │     │
│  └─────────────┘  └──────────────────┘     │
│  ┌─────────────┐  ┌──────────────────┐     │
│  │    WAL      │  │  Data Integrity  │     │
│  │  Manager    │  │  & Checksums     │     │
│  └─────────────┘  └──────────────────┘     │
├─────────────────────────────────────────────┤
│           Storage Layer                      │
│  ┌─────────────┐  ┌──────────────────┐     │
│  │   Index     │  │    Metadata      │     │
│  │   Files     │  │     Files        │     │
│  └─────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────┘
```

## Contributing

See the main README.md for contribution guidelines.

## Support

For issues and questions:
- GitHub Issues: [github.com/stevenic/vectra](https://github.com/stevenic/vectra)
- Documentation: This guide