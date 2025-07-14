# Checksum and Data Integrity Documentation

This directory contains comprehensive documentation for Vectra's checksum and data integrity features.

## Documentation Files

### [CHECKSUM_IMPLEMENTATION.md](./CHECKSUM_IMPLEMENTATION.md)
Technical implementation details including:
- Architecture and design decisions
- SHA-256 checksum algorithms
- Performance considerations
- Storage format specifications
- Integration with other components

### [CHECKSUM_API_REFERENCE.md](./CHECKSUM_API_REFERENCE.md)
Complete API reference including:
- LocalIndex checksum methods
- DataIntegrity class methods
- Type definitions and interfaces
- Usage examples for each method

### [DATA_INTEGRITY.md](../DATA_INTEGRITY.md)
User guide for data integrity features:
- Overview and features
- Basic usage examples
- Best practices
- Error recovery procedures

## Quick Start

### Basic Checksum Operations

```typescript
import { LocalIndex } from 'vectra-enhanced';

const index = new LocalIndex('./my-index');

// Update checksums after modifications
await index.updateChecksums();

// Verify checksums
const result = await index.verifyChecksums();
if (!result.valid) {
    console.log('Checksum mismatches:', result.mismatches);
}

// Full integrity check
const integrity = await index.verifyIntegrity({
    validateChecksums: true,
    validateStructure: true,
    validateReferences: true
});
```

## Key Features

### 1. **Automatic Checksum Calculation**
- SHA-256 hashes for all components
- Deterministic object serialization
- Efficient incremental updates

### 2. **Comprehensive Coverage**
- Index file (index.json)
- Metadata files (UUID.json)
- HNSW index files
- WAL and operations logs

### 3. **Integrity Verification**
- Structure validation
- Reference checking
- Checksum comparison
- Orphaned file detection

### 4. **Automatic Repair**
- Removes orphaned files
- Attempts structural fixes
- WAL-based recovery
- Detailed repair logs

## Common Use Cases

### 1. **Post-Update Verification**
```typescript
await index.beginUpdate();
// ... perform updates ...
await index.endUpdate();
await index.updateChecksums();
```

### 2. **Scheduled Integrity Checks**
```typescript
setInterval(async () => {
    const result = await index.verifyIntegrity();
    if (!result.valid) {
        console.error('Integrity check failed');
        await index.repairIndex();
    }
}, 3600000); // Every hour
```

### 3. **Backup Validation**
```typescript
// Before backup
await index.updateChecksums();
const checksums = await index.getChecksums();

// After restore
const verification = await index.verifyChecksums();
if (!verification.valid) {
    throw new Error('Backup corrupted');
}
```

## Performance Guidelines

| Index Size | Checksum Update | Verification |
|------------|-----------------|--------------|
| < 1MB | < 10ms | < 5ms |
| 10MB | 50-100ms | 20-50ms |
| 100MB | 500-1000ms | 200-500ms |
| 1GB | 5-10s | 2-5s |

## Troubleshooting

### Common Issues

1. **Checksum Mismatch After Crash**
   - Run `index.repairIndex()` to attempt automatic recovery
   - Check WAL for uncommitted changes
   - Restore from backup if needed

2. **Orphaned Metadata Files**
   - Use `index.repairIndex()` to clean up
   - Check disk space after cleanup
   - Review operations log for patterns

3. **Performance Degradation**
   - Consider disabling real-time verification
   - Use scheduled checks instead
   - Implement incremental checksums

## Integration Examples

### With CI/CD Pipeline
```yaml
# .github/workflows/integrity-check.yml
- name: Verify Index Integrity
  run: |
    npm run verify-integrity
    if [ $? -ne 0 ]; then
      echo "Index integrity check failed"
      exit 1
    fi
```

### With Monitoring Systems
```typescript
// Prometheus metrics
const checksum_verification_duration = new Histogram({
    name: 'vectra_checksum_verification_duration_seconds',
    help: 'Duration of checksum verification'
});

const checksum_mismatches_total = new Counter({
    name: 'vectra_checksum_mismatches_total',
    help: 'Total number of checksum mismatches detected'
});
```

## Related Documentation

- [LocalIndex API](../API.md#localindex)
- [WAL Documentation](./WAL.md)
- [HNSW Documentation](./HNSW.md)
- [Operations Log](./OPERATIONS_LOG.md)

## Support

For issues or questions about checksums and data integrity:
1. Check the troubleshooting section above
2. Review the detailed implementation guide
3. Submit an issue with integrity report output