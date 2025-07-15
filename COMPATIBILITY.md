# Vectra Enhanced - Compatibility Guide

This document details the compatibility between Vectra Enhanced and the original Vectra library.

## Overview

Vectra Enhanced aims to be a drop-in replacement for the original Vectra, but there are some important differences to be aware of.

## ✅ Fully Compatible Methods

The following methods work exactly as in the original Vectra:

- `constructor(folderPath: string, indexName?: string)`
- `createIndex(config?)` - Works with no parameters or empty config
- `insertItem(item)` - Same signature and behavior
- `upsertItem(item)` - Same signature and behavior
- `getItem(id)` - Same signature and behavior
- `deleteItem(id)` - Same signature and behavior
- `listItems()` - Works without parameters (new pagination is optional)
- `queryItems(vector, topK)` - Original signature supported
- `queryItems(vector, topK, filter)` - Original signature with filter supported
- `isIndexCreated()` - Same signature and behavior
- `deleteIndex()` - Same signature and behavior
- `beginUpdate()` - Same signature (now async but was already async)
- `endUpdate()` - Same signature and behavior

## ⚠️ Breaking Changes

### 1. **cancelUpdate() - Now Async**
```typescript
// Original Vectra
index.cancelUpdate(); // Synchronous

// Vectra Enhanced
await index.cancelUpdate(); // Asynchronous (returns Promise)
```
**Impact**: Code that calls `cancelUpdate()` without `await` will not wait for completion.
**Fix**: Add `await` before all `cancelUpdate()` calls.

## 🔄 Behavioral Changes

While the API is mostly compatible, some behaviors have changed:

1. **Automatic HNSW Indexing**: Vectra Enhanced automatically builds HNSW indexes for faster search
   - Impact: Initial inserts may be slower, but queries are much faster
   - First-time index loading builds the HNSW structure

2. **Operation Queuing**: All write operations go through a queue
   - Impact: Operations are serialized, which may affect timing
   - Benefit: Better concurrency control and retry logic

3. **File Locking**: Multi-process safety through file locks
   - Impact: May affect concurrent access patterns
   - Benefit: Safe multi-process access

4. **Stricter Validation**: Enhanced validation rules
   - Impact: Some previously valid data might be rejected
   - Benefit: Better data integrity

5. **Metadata Storage**: Large metadata may be stored in separate files
   - Impact: Transparent to users but changes disk layout
   - Benefit: Better performance with large metadata

## 🆕 New Features (Additive)

These methods are new and don't affect compatibility:

- `updateItem(update)` - Partial updates
- `deleteItems(ids)` - Bulk deletion
- `listItems({page, pageSize})` - Pagination support
- `flush()` - Wait for queued operations
- `cleanup()` - Remove orphaned files
- `compact()` - Optimize storage
- `setVectorOptions()` - Configure validation
- `setMetadataOptions()` - Configure metadata
- `setDataIntegrityOptions()` - Configure integrity
- `enableWAL()` - Enable write-ahead logging
- `queryItems(vector, query, topK, filter)` - Text search support

## 📝 Migration Guide

### Minimal Changes Required

For most applications, only one change is needed:

1. **Update cancelUpdate calls**:
   ```typescript
   // Before
   index.cancelUpdate();
   
   // After
   await index.cancelUpdate();
   ```

2. **Update imports**:
   ```typescript
   // Before
   import { LocalIndex } from 'vectra';
   
   // After
   import { LocalIndex } from 'vectra-enhanced';
   ```

### Recommended Changes

While not required, these changes are recommended:

1. **Use error handling for better safety**:
   ```typescript
   import { LocalIndexWithErrorHandling } from 'vectra-enhanced';
   const index = new LocalIndexWithErrorHandling(path);
   ```

2. **Use new features for better performance**:
   ```typescript
   // Bulk operations
   await index.deleteItems([id1, id2, id3]);
   
   // Partial updates
   await index.updateItem({ id, metadata: { status: 'updated' } });
   ```

## 🔍 Testing Your Migration

1. Replace your vectra dependency with vectra-enhanced
2. Update any `cancelUpdate()` calls to use `await`
3. Run your test suite
4. Monitor for any validation errors with existing data

## 📊 Performance Considerations

- **First run**: HNSW index building may take time on large datasets
- **Subsequent runs**: Queries will be significantly faster
- **Memory usage**: Similar to original, with lazy loading improvements
- **Disk usage**: Slightly higher due to HNSW index and metadata files

## 🤝 Getting Help

If you encounter any compatibility issues:

1. Check this guide first
2. Review the [API Reference](./docs/API_REFERENCE.md)
3. Open an issue with a minimal reproduction case

## Summary

Vectra Enhanced is 99% compatible with the original Vectra. The only required code change for most users is adding `await` to `cancelUpdate()` calls. All other changes are additive improvements that don't affect existing functionality.