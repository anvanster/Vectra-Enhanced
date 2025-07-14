# Data Integrity and Checksum Verification

## Overview

The Data Integrity module provides comprehensive data verification and repair capabilities for Vectra vector databases. It ensures data consistency through checksums, structural validation, and automatic repair mechanisms.

## Features

### 1. Checksum Calculation
- **File-level checksums**: SHA-256 checksums for all data files
- **Object-level checksums**: Consistent checksums for JSON objects
- **Index checksums**: Checksums for the entire index structure

### 2. Integrity Verification
- **Structure validation**: Verifies required fields and data types
- **Reference validation**: Checks all metadata file references
- **Checksum validation**: Verifies stored checksums match current data
- **Component verification**: Validates WAL, operations log, and HNSW indices

### 3. Repair Capabilities
- **Orphaned file cleanup**: Removes unreferenced metadata files
- **Structure repair**: Fixes common structural issues
- **Automatic recovery**: Attempts to repair detected issues

## Usage

### Basic Integrity Check

```typescript
import { LocalIndex } from 'vectra-enhanced';

const index = new LocalIndex('./my-index');

// Verify integrity
const result = await index.verifyIntegrity({
    validateStructure: true,
    validateReferences: true,
    validateChecksums: true
});

if (!result.valid) {
    console.log('Integrity issues found:', result.errors);
}
```

### Generate Integrity Report

```typescript
// Generate detailed report
const report = await index.generateIntegrityReport();
console.log(report);
```

Output example:
```
Data Integrity Report for ./my-index
============================================================

Status: VALID
Generated: 2024-01-15T10:30:00.000Z

Checksums:
  - index.json: a1b2c3d4e5f6...
  - WAL: f6e5d4c3b2a1...
  - operations.log: 1234567890ab...
  - HNSW index: abcdef123456...
```

### Update and Verify Checksums

```typescript
// Calculate and store checksums
await index.updateChecksums();

// Later, verify checksums
const verification = await index.verifyChecksums();
if (!verification.valid) {
    console.log('Checksum mismatches:', verification.mismatches);
}
```

### Repair Index

```typescript
// Attempt to repair any issues
const repairResult = await index.repairIndex({
    repairMode: true,
    verbose: true
});

if (repairResult.repaired) {
    console.log('Repairs performed:', repairResult.actions);
}
```

## API Reference

### LocalIndex Methods

#### `verifyIntegrity(options?: DataIntegrityOptions): Promise<IntegrityCheckResult>`
Performs comprehensive integrity verification.

Options:
- `validateChecksums`: Verify all checksums (default: false)
- `validateStructure`: Validate data structures (default: false)
- `validateReferences`: Check file references (default: false)
- `verbose`: Enable detailed logging (default: false)

#### `generateIntegrityReport(options?: DataIntegrityOptions): Promise<string>`
Generates a human-readable integrity report.

#### `repairIndex(options?: DataIntegrityOptions): Promise<RepairResult>`
Attempts to repair detected issues.

Options:
- `repairMode`: Enable repair operations (default: true)
- `verbose`: Enable detailed logging (default: false)

#### `updateChecksums(): Promise<void>`
Calculates and stores checksums for all components.

#### `verifyChecksums(): Promise<ChecksumResult>`
Verifies stored checksums against current data.

### DataIntegrity Class

The core integrity verification class can also be used directly:

```typescript
import { dataIntegrity } from 'vectra-enhanced';

// Calculate file checksum
const checksum = await dataIntegrity.calculateFileChecksum('./data.json');

// Calculate object checksum
const objChecksum = dataIntegrity.calculateObjectChecksum({ 
    name: 'test', 
    value: 42 
});

// Verify entire index
const result = await dataIntegrity.verifyIndexIntegrity('./my-index', {
    validateChecksums: true,
    validateStructure: true,
    validateReferences: true
});
```

## Integrity Check Components

### 1. Index Structure
- Validates required fields (version, distanceMetric, items)
- Checks data types and formats
- Verifies vector dimensions consistency

### 2. Metadata Files
- Verifies all referenced metadata files exist
- Checks for orphaned metadata files
- Validates metadata file format

### 3. WAL (Write-Ahead Log)
- Verifies WAL entry checksums
- Validates entry format and structure
- Checks for corruption

### 4. Operations Log
- Verifies log file integrity
- Validates operation entries

### 5. HNSW Index
- Verifies index file checksum
- Validates metadata structure
- Checks dimension consistency

## Best Practices

1. **Regular Integrity Checks**: Run integrity checks periodically, especially after crashes or unexpected shutdowns.

2. **Checksum Updates**: Update checksums after bulk operations:
   ```typescript
   await index.beginUpdate();
   // ... bulk operations ...
   await index.endUpdate();
   await index.updateChecksums();
   ```

3. **Backup Before Repair**: Always backup your index before running repair operations:
   ```typescript
   await index.snapshot('./backup-folder');
   const repairResult = await index.repairIndex();
   ```

4. **Monitor Warnings**: Even if integrity check passes, review warnings:
   ```typescript
   const result = await index.verifyIntegrity();
   if (result.warnings.length > 0) {
       console.log('Warnings:', result.warnings);
   }
   ```

5. **Automated Verification**: Integrate integrity checks into your deployment pipeline:
   ```typescript
   // In your CI/CD pipeline
   const result = await index.verifyIntegrity({
       validateStructure: true,
       validateReferences: true,
       validateChecksums: true
   });
   
   if (!result.valid) {
       throw new Error('Index integrity check failed');
   }
   ```

## Error Recovery

If integrity checks fail:

1. **Check the report**: Generate a detailed report to understand the issues
2. **Attempt repair**: Use `repairIndex()` for automatic fixes
3. **Manual intervention**: For severe corruption, you may need to:
   - Restore from backup
   - Rebuild the index from source data
   - Use WAL replay for recovery

## Performance Considerations

- Checksum calculation is CPU-intensive for large indices
- Integrity checks perform file I/O and should be scheduled appropriately
- Consider running checks during low-traffic periods
- Use incremental checksums for large-scale operations

## Integration with Other Features

The integrity system works seamlessly with:
- **WAL**: Checksums are verified during WAL replay
- **HNSW**: Index checksums are validated on load
- **Atomic Operations**: Ensures writes maintain integrity
- **Cleanup Manager**: Works with integrity checks to identify orphaned files