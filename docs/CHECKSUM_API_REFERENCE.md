# Checksum API Reference

## Table of Contents
- [LocalIndex Methods](#localindex-methods)
- [DataIntegrity Class](#dataintegrity-class)
- [Types and Interfaces](#types-and-interfaces)
- [Examples](#examples)

## LocalIndex Methods

### updateChecksums()

Updates checksums for all index components.

```typescript
async updateChecksums(): Promise<void>
```

**Description:**
Calculates and stores checksums for the index file, metadata files, WAL, operations log, and HNSW index.

**Usage:**
```typescript
const index = new LocalIndex('./my-index');
await index.updateChecksums();
```

**When to use:**
- After bulk operations
- Before creating backups
- As part of maintenance routines

---

### verifyChecksums()

Verifies stored checksums against current data.

```typescript
async verifyChecksums(): Promise<ChecksumVerificationResult>
```

**Returns:**
```typescript
interface ChecksumVerificationResult {
    valid: boolean;
    mismatches: string[];
    stored?: Record<string, any>;
    current?: Record<string, any>;
}
```

**Example:**
```typescript
const result = await index.verifyChecksums();
if (!result.valid) {
    console.log('Mismatches found:', result.mismatches);
}
```

---

### verifyIntegrity()

Performs comprehensive integrity verification including checksums.

```typescript
async verifyIntegrity(options?: DataIntegrityOptions): Promise<IntegrityCheckResult>
```

**Parameters:**
```typescript
interface DataIntegrityOptions {
    validateChecksums?: boolean;    // Verify all checksums
    validateStructure?: boolean;    // Check data structures
    validateReferences?: boolean;   // Verify file references
    repairMode?: boolean;          // Enable repair attempts
    verbose?: boolean;             // Detailed logging
}
```

**Returns:**
```typescript
interface IntegrityCheckResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    checksums: {
        index?: string;
        metadata?: Map<string, string>;
        wal?: string;
        operationsLog?: string;
        hnsw?: string;
    };
}
```

**Example:**
```typescript
const result = await index.verifyIntegrity({
    validateChecksums: true,
    validateStructure: true,
    validateReferences: true
});

if (!result.valid) {
    console.error('Integrity check failed:', result.errors);
}
```

---

### generateIntegrityReport()

Generates a human-readable integrity report.

```typescript
async generateIntegrityReport(options?: DataIntegrityOptions): Promise<string>
```

**Returns:** Formatted text report

**Example:**
```typescript
const report = await index.generateIntegrityReport();
console.log(report);

// Output:
// Data Integrity Report for ./my-index
// ============================================================
// 
// Status: VALID
// Generated: 2024-01-15T10:30:00.000Z
// 
// Checksums:
//   - index.json: a1b2c3d4e5f6789...
//   - WAL: 9876543210fedcba...
```

---

### repairIndex()

Attempts to repair detected integrity issues.

```typescript
async repairIndex(options?: DataIntegrityOptions): Promise<RepairResult>
```

**Returns:**
```typescript
interface RepairResult {
    repaired: boolean;
    actions: string[];
}
```

**Example:**
```typescript
const result = await index.repairIndex({
    repairMode: true,
    verbose: true
});

if (result.repaired) {
    console.log('Repairs performed:', result.actions);
}
```

## DataIntegrity Class

### calculateFileChecksum()

Calculates SHA-256 checksum for a file.

```typescript
async calculateFileChecksum(filePath: string): Promise<string>
```

**Parameters:**
- `filePath`: Absolute path to the file

**Returns:** 64-character hex string

**Example:**
```typescript
import { dataIntegrity } from 'vectra-enhanced';

const checksum = await dataIntegrity.calculateFileChecksum('./data.json');
console.log(checksum); // "a1b2c3d4e5f6789..."
```

---

### calculateObjectChecksum()

Calculates deterministic checksum for an object.

```typescript
calculateObjectChecksum(obj: any): string
```

**Parameters:**
- `obj`: JavaScript object to hash

**Returns:** 64-character hex string

**Example:**
```typescript
const checksum = dataIntegrity.calculateObjectChecksum({
    name: 'test',
    value: 42,
    items: [1, 2, 3]
});
```

**Note:** Objects with same properties in different order produce same checksum.

---

### calculateIndexChecksum()

Calculates checksum for index items.

```typescript
calculateIndexChecksum(items: Map<string, IndexItem>): string
```

**Parameters:**
- `items`: Map of item IDs to IndexItem objects

**Returns:** 64-character hex string

---

### verifyIndexIntegrity()

Verifies complete index integrity.

```typescript
async verifyIndexIntegrity(
    folderPath: string,
    options?: DataIntegrityOptions
): Promise<IntegrityCheckResult>
```

**Parameters:**
- `folderPath`: Path to index directory
- `options`: Verification options

**Example:**
```typescript
const result = await dataIntegrity.verifyIndexIntegrity('./my-index', {
    validateChecksums: true,
    validateStructure: true,
    validateReferences: true
});
```

---

### generateIntegrityReport()

Generates detailed integrity report.

```typescript
async generateIntegrityReport(
    folderPath: string,
    options?: DataIntegrityOptions
): Promise<string>
```

---

### repairIndex()

Attempts to repair index issues.

```typescript
async repairIndex(
    folderPath: string,
    options?: DataIntegrityOptions
): Promise<RepairResult>
```

## Types and Interfaces

### ChecksumRecord

Stored checksum data structure:

```typescript
interface ChecksumRecord {
    index: string;
    metadata: Record<string, string>;
    wal?: string;
    operationsLog?: string;
    hnsw?: string;
    timestamp: string;
}
```

### IntegrityError

Detailed error information:

```typescript
interface IntegrityError {
    type: 'structure' | 'reference' | 'checksum';
    component: string;
    message: string;
    severity: 'error' | 'warning';
}
```

## Examples

### Complete Integrity Workflow

```typescript
import { LocalIndex } from 'vectra-enhanced';

async function maintainIndexIntegrity(indexPath: string) {
    const index = new LocalIndex(indexPath);
    
    // 1. Verify current state
    console.log('Checking integrity...');
    const integrityCheck = await index.verifyIntegrity({
        validateChecksums: true,
        validateStructure: true,
        validateReferences: true
    });
    
    if (!integrityCheck.valid) {
        console.error('Issues found:', integrityCheck.errors);
        
        // 2. Attempt repairs
        console.log('Attempting repairs...');
        const repairResult = await index.repairIndex({
            repairMode: true,
            verbose: true
        });
        
        if (repairResult.repaired) {
            console.log('Repairs completed:', repairResult.actions);
        }
    }
    
    // 3. Update checksums
    console.log('Updating checksums...');
    await index.updateChecksums();
    
    // 4. Generate report
    const report = await index.generateIntegrityReport();
    await fs.writeFile('integrity-report.txt', report);
    console.log('Report saved to integrity-report.txt');
}
```

### Scheduled Integrity Checks

```typescript
import { CronJob } from 'cron';

function scheduleIntegrityChecks(index: LocalIndex) {
    // Daily integrity check at 2 AM
    new CronJob('0 2 * * *', async () => {
        try {
            const result = await index.verifyIntegrity({
                validateChecksums: true,
                validateStructure: true
            });
            
            if (!result.valid) {
                // Send alert
                await sendAlert('Index integrity check failed', result.errors);
            }
        } catch (error) {
            console.error('Integrity check error:', error);
        }
    }).start();
    
    // Weekly checksum update
    new CronJob('0 3 * * 0', async () => {
        try {
            await index.updateChecksums();
            console.log('Weekly checksum update completed');
        } catch (error) {
            console.error('Checksum update error:', error);
        }
    }).start();
}
```

### Custom Checksum Validation

```typescript
async function validateCustomChecksum(
    index: LocalIndex,
    componentName: string,
    expectedChecksum: string
) {
    const verification = await index.verifyChecksums();
    
    if (!verification.current) {
        throw new Error('No current checksums available');
    }
    
    const actualChecksum = verification.current[componentName];
    
    if (actualChecksum !== expectedChecksum) {
        throw new Error(
            `Checksum mismatch for ${componentName}: ` +
            `expected ${expectedChecksum}, got ${actualChecksum}`
        );
    }
    
    return true;
}
```

### Checksum-based Caching

```typescript
class ChecksumCache {
    private cache = new Map<string, any>();
    
    async getWithChecksum(
        key: string,
        filepath: string,
        loader: () => Promise<any>
    ) {
        const checksum = await dataIntegrity.calculateFileChecksum(filepath);
        const cacheKey = `${key}:${checksum}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const data = await loader();
        this.cache.set(cacheKey, data);
        
        // Clean old versions
        for (const [k, _] of this.cache) {
            if (k.startsWith(`${key}:`) && k !== cacheKey) {
                this.cache.delete(k);
            }
        }
        
        return data;
    }
}
```

### Error Recovery with Checksums

```typescript
async function recoverWithChecksums(index: LocalIndex) {
    try {
        // Verify checksums
        const result = await index.verifyChecksums();
        
        if (!result.valid) {
            console.log('Checksum verification failed');
            console.log('Mismatches:', result.mismatches);
            
            // Check specific components
            if (result.mismatches.includes('index')) {
                // Restore from WAL
                await index.recoverFromWAL();
            }
            
            if (result.mismatches.some(m => m.startsWith('metadata:'))) {
                // Rebuild metadata
                await index.rebuildMetadata();
            }
            
            // Re-verify
            const recheck = await index.verifyChecksums();
            if (!recheck.valid) {
                throw new Error('Recovery failed');
            }
        }
        
        console.log('Index verified successfully');
        
    } catch (error) {
        console.error('Recovery error:', error);
        // Restore from backup as last resort
        await index.restoreFromBackup();
    }
}