# Metadata File Cleanup Implementation

## Overview

Vectra now includes comprehensive cleanup functionality to prevent disk space leaks from orphaned metadata files and maintain database integrity.

## Problem Solved

Previously, when items with external metadata were deleted, their associated metadata files remained on disk, leading to:
- Disk space leaks
- Orphaned files accumulating over time
- No way to validate metadata integrity
- No visibility into metadata storage usage

## Implementation

### 1. CleanupManager Class (`src/CleanupManager.ts`)

Provides core cleanup functionality:

#### Key Methods:
- `deleteMetadataFile()` - Safely deletes a metadata file
- `findOrphanedMetadataFiles()` - Identifies files not referenced in index
- `performFullCleanup()` - Comprehensive cleanup operation
- `validateMetadataFiles()` - Checks for missing metadata files
- `getMetadataStorageStats()` - Reports storage usage
- `cleanupOldBackups()` - Removes old backup/temp files

### 2. LocalIndex Integration

#### Automatic Cleanup on Delete
```typescript
// When an item is deleted, its metadata file is also removed
await index.deleteItem('item-id');
// Metadata file automatically deleted
```

#### Manual Cleanup
```typescript
// Perform full cleanup of orphaned files
const stats = await index.cleanup();
console.log(`Deleted ${stats.orphanedFilesDeleted} orphaned files`);
console.log(`Reclaimed ${stats.bytesReclaimed} bytes`);
```

#### Cleanup During Compact
```typescript
// Compact now includes automatic cleanup
const stats = await index.compact();
// Returns cleanup statistics
```

## Usage Examples

### 1. Basic Cleanup
```typescript
const index = new LocalIndex('./my-index');

// Run cleanup
const stats = await index.cleanup();

// Check results
if (stats.orphanedFilesDeleted > 0) {
    console.log(`Cleaned up ${stats.orphanedFilesDeleted} orphaned files`);
    console.log(`Reclaimed ${(stats.bytesReclaimed / 1024).toFixed(2)} KB`);
}

if (stats.errors.length > 0) {
    console.error('Cleanup errors:', stats.errors);
}
```

### 2. Validate Metadata Integrity
```typescript
// Check for missing metadata files
const missing = await index.validateMetadataFiles();

if (missing.length > 0) {
    console.error('Missing metadata files detected:');
    missing.forEach(m => console.error(`  - ${m}`));
}
```

### 3. Monitor Storage Usage
```typescript
// Get metadata storage statistics
const stats = await index.getMetadataStats();

console.log(`Metadata files: ${stats.totalFiles}`);
console.log(`Total size: ${(stats.totalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Average file size: ${(stats.averageFileSize / 1024).toFixed(2)} KB`);
```

### 4. Automated Maintenance
```typescript
// Schedule regular cleanup
setInterval(async () => {
    const stats = await index.compact(); // Includes cleanup
    console.log(`Maintenance: cleaned ${stats.orphanedFilesDeleted} files`);
}, 24 * 60 * 60 * 1000); // Daily
```

## CLI Commands

New commands added to `vectra` CLI:

### Cleanup Command
```bash
# Remove orphaned metadata files
vectra cleanup ./my-index

# Output:
# Cleanup complete. Deleted 5 orphaned files, reclaimed 2048 bytes
```

### Validate Command
```bash
# Check metadata file integrity
vectra validate ./my-index

# Output:
# All metadata files are valid
# OR
# Found 2 missing metadata files:
#   - Item item-1 references missing file: uuid.json
#   - Item item-2 references missing file: uuid.json
```

### Enhanced Compact Command
```bash
# Compact now includes cleanup
vectra compact ./my-index

# Output:
# Compaction complete. Cleaned up 3 orphaned files, reclaimed 1536 bytes
```

## How It Works

### 1. Orphan Detection
- Scans index directory for UUID.json files
- Compares against metadata files referenced in index
- Identifies unreferenced files as orphans

### 2. Safe Deletion
- Metadata files deleted when items are removed
- Handles missing files gracefully
- Tracks errors without failing operation

### 3. Backup Cleanup
- Removes .backup and .tmp files older than 7 days
- Configurable age threshold
- Runs during compact operation

## Benefits

1. **No More Disk Leaks** - Metadata files properly cleaned up
2. **Data Integrity** - Validate all metadata files exist
3. **Storage Visibility** - Monitor metadata usage
4. **Automated Maintenance** - Cleanup during compact
5. **Safe Operations** - Graceful error handling

## Performance Considerations

- Cleanup is I/O bound, not CPU intensive
- Orphan detection is O(n) where n = number of files
- Safe to run during normal operations
- Minimal impact on index performance

## Best Practices

1. **Regular Maintenance**
   ```typescript
   // Run compact weekly to include cleanup
   schedule.weekly(() => index.compact());
   ```

2. **Monitor Storage**
   ```typescript
   // Check storage growth
   const stats = await index.getMetadataStats();
   if (stats.totalBytes > threshold) {
       await index.cleanup();
   }
   ```

3. **Validate After Crashes**
   ```typescript
   // After unexpected shutdown
   const missing = await index.validateMetadataFiles();
   if (missing.length > 0) {
       // Handle missing files
   }
   ```

4. **Configure Indexed Fields**
   ```typescript
   // Only use external metadata when needed
   await index.createIndex({
       version: 1,
       metadata_config: {
           indexed: ['id', 'type'] // Only these stored in index
           // Other fields go to external files
       }
   });
   ```

## Migration Guide

For existing indices:
1. No changes required - cleanup is backward compatible
2. Run `index.cleanup()` to remove existing orphans
3. Future deletes automatically clean up metadata

## Testing

Comprehensive test coverage includes:
- ✅ Metadata deletion on item removal
- ✅ Orphan file detection and cleanup
- ✅ Integration with compact operation
- ✅ Metadata validation
- ✅ Storage statistics
- ✅ Concurrent operation safety
- ✅ Edge case handling
- ✅ Backup file cleanup

## Error Handling

- Non-blocking: Cleanup errors don't stop operations
- Detailed reporting: All errors captured in stats
- Graceful degradation: Missing files handled safely
- Atomic operations: Uses same atomic write system

This implementation ensures Vectra maintains a clean, efficient storage footprint while providing tools for monitoring and maintaining metadata integrity.