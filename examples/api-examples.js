/**
 * Vectra Enhanced API Examples
 * 
 * This file demonstrates the key features of Vectra Enhanced
 */

const { LocalIndex, LocalIndexWithErrorHandling, errorHandler } = require('../lib');
const path = require('path');

async function basicUsage() {
    console.log('=== Basic Usage Example ===\n');
    
    // Create an index
    const index = new LocalIndex('./my-index');
    
    // Create the index with configuration
    await index.createIndex({
        version: 1,
        deleteIfExists: true,
        metadata_config: {
            indexed: ['category', 'tags', 'author']
        }
    });
    
    // Insert items
    const doc1 = await index.insertItem({
        vector: [0.1, 0.2, 0.3, 0.4],
        metadata: {
            text: 'Introduction to machine learning',
            category: 'education',
            author: 'John Doe',
            tags: ['ml', 'intro', 'tutorial']
        }
    });
    console.log('Inserted document:', doc1.id);
    
    // Query for similar items
    const queryVector = [0.15, 0.25, 0.35, 0.45];
    const results = await index.queryItems(queryVector, '', 5);
    
    console.log('\nQuery results:');
    results.forEach(result => {
        console.log(`- Score: ${result.score.toFixed(3)}, Text: ${result.item.metadata.text}`);
    });
}

async function transactionalOperations() {
    console.log('\n=== Transactional Operations Example ===\n');
    
    const index = new LocalIndex('./transaction-index');
    await index.createIndex();
    
    // Start a transaction
    await index.beginUpdate();
    
    try {
        // Insert multiple items atomically
        for (let i = 0; i < 5; i++) {
            await index.insertItem({
                vector: [Math.random(), Math.random(), Math.random(), Math.random()],
                metadata: {
                    id: i,
                    text: `Document ${i}`,
                    timestamp: Date.now()
                }
            });
        }
        
        // Commit the transaction
        await index.endUpdate();
        console.log('✓ Transaction committed successfully');
        
    } catch (error) {
        // Rollback on error
        await index.cancelUpdate();
        console.error('✗ Transaction rolled back:', error.message);
    }
}

async function errorHandlingExample() {
    console.log('\n=== Error Handling Example ===\n');
    
    // Use the enhanced version with automatic error recovery
    const index = new LocalIndexWithErrorHandling('./safe-index');
    
    // Set up global error handler
    errorHandler.on('error', (error, context) => {
        console.log(`Error detected: ${error.code} - ${error.message}`);
        console.log(`Context:`, context);
    });
    
    errorHandler.on('recovery', (data) => {
        console.log(`Recovery successful using strategy: ${data.strategy}`);
    });
    
    await index.createIndex();
    
    // This will trigger error handling
    try {
        await index.insertItem({
            vector: null, // Invalid vector
            metadata: { text: 'This will fail' }
        });
    } catch (error) {
        console.log('Caught error:', error.message);
    }
    
    // Clean up listeners
    errorHandler.removeAllListeners();
}

async function metadataFilteringExample() {
    console.log('\n=== Metadata Filtering Example ===\n');
    
    const index = new LocalIndex('./filter-index');
    await index.createIndex();
    
    // Insert diverse documents
    const documents = [
        {
            vector: [0.1, 0.2, 0.3, 0.4],
            metadata: {
                title: 'Introduction to AI',
                category: 'tutorial',
                difficulty: 'beginner',
                views: 1000,
                tags: ['ai', 'intro'],
                published: true
            }
        },
        {
            vector: [0.2, 0.3, 0.4, 0.5],
            metadata: {
                title: 'Advanced Neural Networks',
                category: 'tutorial',
                difficulty: 'advanced',
                views: 5000,
                tags: ['neural-networks', 'deep-learning'],
                published: true
            }
        },
        {
            vector: [0.3, 0.4, 0.5, 0.6],
            metadata: {
                title: 'Draft: Quantum Computing',
                category: 'research',
                difficulty: 'expert',
                views: 100,
                tags: ['quantum', 'physics'],
                published: false
            }
        }
    ];
    
    for (const doc of documents) {
        await index.insertItem(doc);
    }
    
    // Various filter examples
    console.log('Published tutorials:');
    let results = await index.listItemsByMetadata({
        $and: [
            { category: 'tutorial' },
            { published: true }
        ]
    });
    results.forEach(r => console.log(`- ${r.metadata.title}`));
    
    console.log('\nHigh-view content (>1000 views):');
    results = await index.listItemsByMetadata({
        views: { $gt: 1000 }
    });
    results.forEach(r => console.log(`- ${r.metadata.title} (${r.metadata.views} views)`));
    
    console.log('\nBeginner or intermediate content:');
    results = await index.listItemsByMetadata({
        difficulty: { $in: ['beginner', 'intermediate'] }
    });
    results.forEach(r => console.log(`- ${r.metadata.title} (${r.metadata.difficulty})`));
}

async function dataIntegrityExample() {
    console.log('\n=== Data Integrity Example ===\n');
    
    const index = new LocalIndex('./integrity-index');
    await index.createIndex();
    
    // Insert some data
    await index.insertItem({
        vector: [0.1, 0.2, 0.3, 0.4],
        metadata: { text: 'Important document' }
    });
    
    // Update checksums
    await index.updateChecksums();
    console.log('✓ Checksums updated');
    
    // Verify integrity
    const result = await index.verifyIntegrity({
        validateStructure: true,
        validateReferences: true,
        validateChecksums: true
    });
    
    console.log(`✓ Integrity check: ${result.valid ? 'PASSED' : 'FAILED'}`);
    
    // Generate report
    const report = await index.generateIntegrityReport();
    console.log('\nIntegrity Report Preview:');
    console.log(report.split('\n').slice(0, 5).join('\n') + '...');
}

async function performanceOptimization() {
    console.log('\n=== Performance Optimization Example ===\n');
    
    const index = new LocalIndex('./performance-index');
    await index.createIndex({
        hnswConfig: {
            M: 16,              // Connectivity parameter
            efConstruction: 200, // Construction quality
            efSearch: 50        // Search quality
        }
    });
    
    // Bulk insert with transaction
    console.log('Inserting 100 items...');
    await index.beginUpdate();
    
    for (let i = 0; i < 100; i++) {
        await index.insertItem({
            vector: Array(128).fill(0).map(() => Math.random()),
            metadata: {
                id: i,
                text: `Document ${i}`,
                category: i % 5 === 0 ? 'important' : 'normal'
            }
        });
    }
    
    await index.endUpdate();
    console.log('✓ Bulk insert completed');
    
    // Get stats
    const stats = await index.getIndexStats();
    console.log('\nIndex statistics:', stats);
    
    // Compact the index
    console.log('\nCompacting index...');
    const compactStats = await index.compact();
    console.log('Compaction results:', compactStats);
    
    // Rebuild HNSW for optimal performance
    console.log('\nRebuilding HNSW index...');
    await index.rebuildHNSWIndex();
    console.log('✓ HNSW index optimized');
    
    // Fast query
    console.time('Query time');
    const results = await index.queryItems(
        Array(128).fill(0).map(() => Math.random()),
        '',
        10,
        { category: 'important' }
    );
    console.timeEnd('Query time');
    console.log(`Found ${results.length} important documents`);
}

async function upsertExample() {
    console.log('\n=== Upsert Example ===\n');
    
    const index = new LocalIndex('./upsert-index');
    await index.createIndex();
    
    // Initial insert
    const item = await index.insertItem({
        vector: [0.1, 0.2, 0.3, 0.4],
        metadata: {
            docId: 'doc-123',
            text: 'Original text',
            version: 1
        }
    });
    console.log('Inserted item:', item.id);
    
    // Update using upsert
    const updated = await index.upsertItem({
        id: item.id,
        vector: [0.15, 0.25, 0.35, 0.45],
        metadata: {
            docId: 'doc-123',
            text: 'Updated text',
            version: 2
        }
    });
    console.log('Updated item:', updated.id);
    
    // Verify update
    const retrieved = await index.getItem(item.id);
    console.log('Retrieved item version:', retrieved.metadata.version);
}

// Run all examples
async function runExamples() {
    try {
        await basicUsage();
        await transactionalOperations();
        await errorHandlingExample();
        await metadataFilteringExample();
        await dataIntegrityExample();
        await performanceOptimization();
        await upsertExample();
        
        console.log('\n✅ All examples completed successfully!');
    } catch (error) {
        console.error('Example failed:', error);
    }
}

// Export for use in other scripts
module.exports = {
    basicUsage,
    transactionalOperations,
    errorHandlingExample,
    metadataFilteringExample,
    dataIntegrityExample,
    performanceOptimization,
    upsertExample
};

// Run if called directly
if (require.main === module) {
    runExamples();
}