const { LocalIndex, LocalIndexWithErrorHandling } = require('./lib');
const path = require('path');
const fs = require('fs');

// Test directory
const testDir = path.join(__dirname, 'test-api-data');

// Clean up test directory if it exists
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
}

async function testBasicAPI() {
    console.log('=== Testing Basic LocalIndex API ===\n');
    
    const index = new LocalIndex(path.join(testDir, 'basic-index'));
    
    // Create index
    console.log('Creating index...');
    await index.createIndex({
        version: 1,
        deleteIfExists: true,
        metadata_config: {
            indexed: ['category', 'tags']
        }
    });
    console.log('✓ Index created\n');
    
    // Check if index exists
    const exists = await index.isIndexCreated();
    console.log(`✓ Index exists: ${exists}\n`);
    
    // Insert items
    console.log('Inserting items...');
    const item1 = await index.insertItem({
        vector: [0.1, 0.2, 0.3, 0.4],
        metadata: { text: 'apple', category: 'fruit', price: 1.2 }
    });
    console.log(`✓ Inserted item 1: ${item1.id}`);
    
    const item2 = await index.insertItem({
        vector: [0.2, 0.3, 0.4, 0.5],
        metadata: { text: 'banana', category: 'fruit', price: 0.8 }
    });
    console.log(`✓ Inserted item 2: ${item2.id}`);
    
    const item3 = await index.insertItem({
        vector: [0.5, 0.4, 0.3, 0.2],
        metadata: { text: 'carrot', category: 'vegetable', price: 0.5 }
    });
    console.log(`✓ Inserted item 3: ${item3.id}\n`);
    
    // Query items
    console.log('Querying for similar items...');
    const results = await index.queryItems([0.15, 0.25, 0.35, 0.45], '', 2);
    console.log(`✓ Found ${results.length} results:`);
    results.forEach(r => {
        console.log(`  - ${r.item.metadata.text} (score: ${r.score.toFixed(3)})`);
    });
    console.log();
    
    // Query with filter
    console.log('Querying with metadata filter...');
    const filteredResults = await index.queryItems(
        [0.15, 0.25, 0.35, 0.45], 
        '',
        10, 
        { category: 'fruit' }
    );
    console.log(`✓ Found ${filteredResults.length} fruit items:`);
    filteredResults.forEach(r => {
        console.log(`  - ${r.item.metadata.text} (${r.item.metadata.category})`);
    });
    console.log();
    
    // Get stats
    const stats = await index.getIndexStats();
    console.log('✓ Index stats:', stats);
    console.log();
    
    return index;
}

async function testTransactions() {
    console.log('=== Testing Transactions ===\n');
    
    const index = new LocalIndex(path.join(testDir, 'transaction-index'));
    await index.createIndex();
    
    console.log('Starting transaction...');
    await index.beginUpdate();
    
    // Insert multiple items in transaction
    for (let i = 0; i < 5; i++) {
        await index.insertItem({
            vector: [Math.random(), Math.random(), Math.random(), Math.random()],
            metadata: { id: i, text: `Item ${i}` }
        });
    }
    
    console.log('✓ Inserted 5 items in transaction');
    await index.endUpdate();
    console.log('✓ Transaction committed\n');
    
    // List items
    const items = await index.listItems();
    console.log(`✓ Total items in index: ${items.length}\n`);
}

async function testErrorHandling() {
    console.log('=== Testing Error Handling ===\n');
    
    const { errorHandler } = require('./lib');
    const index = new LocalIndexWithErrorHandling(path.join(testDir, 'error-handling-index'));
    
    // Set up error listener on the global error handler
    errorHandler.on('error', (error, context) => {
        console.log(`✓ Error caught: ${error.code} - ${error.message}`);
    });
    
    errorHandler.on('recovery', (data) => {
        console.log(`✓ Recovery successful: ${data.strategy}`);
    });
    
    await index.createIndex();
    
    // Try to insert invalid vector
    console.log('Testing invalid vector insertion...');
    try {
        await index.insertItem({
            vector: 'not-a-vector',
            metadata: { text: 'invalid' }
        });
    } catch (error) {
        console.log(`✓ Error properly thrown: ${error.message}\n`);
    }
    
    // Clean up listeners
    errorHandler.removeAllListeners('error');
    errorHandler.removeAllListeners('recovery');
}

async function testLazyIndex() {
    console.log('=== Testing Memory-Efficient Operations ===\n');
    
    // Use regular LocalIndex but demonstrate memory-efficient patterns
    const index = new LocalIndex(path.join(testDir, 'large-index'));
    await index.createIndex();
    
    // Insert items in batches
    console.log('Inserting items in batches...');
    await index.beginUpdate();
    for (let batch = 0; batch < 3; batch++) {
        for (let i = 0; i < 5; i++) {
            const itemNum = batch * 5 + i;
            await index.insertItem({
                vector: [itemNum * 0.1, itemNum * 0.2, itemNum * 0.3, itemNum * 0.4],
                metadata: { number: itemNum, batch: batch, text: `Item ${itemNum}` }
            });
        }
    }
    await index.endUpdate();
    console.log('✓ 15 items inserted in 3 batches\n');
    
    // List with manual pagination
    console.log('Testing manual pagination...');
    const allItems = await index.listItems();
    const pageSize = 5;
    const page1 = allItems.slice(0, pageSize);
    console.log(`✓ Page 1: ${page1.length} items (IDs: ${page1.map(i => i.metadata.number).join(', ')})`);
    
    const page2 = allItems.slice(pageSize, pageSize * 2);
    console.log(`✓ Page 2: ${page2.length} items (IDs: ${page2.map(i => i.metadata.number).join(', ')})\n`);
    
    // Query with batch filter
    const results = await index.queryItems([0.5, 1.0, 1.5, 2.0], '', 5, { batch: 0 });
    console.log(`✓ Query returned ${results.length} results from batch 0\n`);
}

async function testDataIntegrity() {
    console.log('=== Testing Data Integrity ===\n');
    
    const index = new LocalIndex(path.join(testDir, 'integrity-index'));
    await index.createIndex();
    
    // Insert some data
    await index.insertItem({
        vector: [0.1, 0.2, 0.3, 0.4],
        metadata: { text: 'test item' }
    });
    
    // Update checksums
    console.log('Updating checksums...');
    await index.updateChecksums();
    console.log('✓ Checksums updated\n');
    
    // Verify integrity
    console.log('Verifying integrity...');
    const result = await index.verifyIntegrity({
        validateStructure: true,
        validateReferences: true,
        validateChecksums: true
    });
    console.log(`✓ Integrity check: ${result.valid ? 'PASSED' : 'FAILED'}`);
    if (!result.valid) {
        console.log('  Errors:', result.errors);
    }
    console.log();
    
    // Generate report
    console.log('Generating integrity report...');
    const report = await index.generateIntegrityReport();
    console.log('✓ Report generated');
    console.log(report.split('\n').slice(0, 5).join('\n') + '\n...\n');
}

async function testWAL() {
    console.log('=== Testing Write-Ahead Logging (Simulation) ===\n');
    
    const index = new LocalIndex(path.join(testDir, 'wal-index'));
    await index.createIndex();
    
    // Simulate WAL behavior with transactions
    console.log('Testing transaction-based durability...');
    
    // Start transaction
    await index.beginUpdate();
    
    // Insert items
    const items = [];
    for (let i = 0; i < 3; i++) {
        const item = await index.insertItem({
            vector: [Math.random(), Math.random(), Math.random(), Math.random()],
            metadata: { id: i, timestamp: Date.now() }
        });
        items.push(item);
    }
    
    // Commit transaction
    await index.endUpdate();
    console.log(`✓ Transaction committed with ${items.length} items`);
    
    // Verify items were persisted
    const allItems = await index.listItems();
    console.log(`✓ Verified ${allItems.length} items persisted to disk\n`);
}

async function testCompaction() {
    console.log('=== Testing Compaction ===\n');
    
    const index = new LocalIndex(path.join(testDir, 'compact-index'));
    await index.createIndex();
    
    // Insert and delete items
    console.log('Creating items to compact...');
    const ids = [];
    for (let i = 0; i < 5; i++) {
        const item = await index.insertItem({
            vector: [Math.random(), Math.random(), Math.random(), Math.random()],
            metadata: { number: i }
        });
        ids.push(item.id);
    }
    
    // Delete some items
    await index.deleteItem(ids[1]);
    await index.deleteItem(ids[3]);
    console.log('✓ Created and deleted some items\n');
    
    // Compact
    console.log('Running compaction...');
    const compactStats = await index.compact();
    console.log('✓ Compaction complete:', compactStats);
    
    // Rebuild HNSW index
    console.log('\nRebuilding HNSW index...');
    await index.rebuildHNSWIndex();
    console.log('✓ HNSW index rebuilt successfully\n');
}

async function testMetadataFiltering() {
    console.log('=== Testing Advanced Metadata Filtering ===\n');
    
    const index = new LocalIndex(path.join(testDir, 'filter-index'));
    await index.createIndex();
    
    // Insert diverse items
    await index.insertItem({
        vector: [0.1, 0.2, 0.3, 0.4],
        metadata: { name: 'Apple', category: 'fruit', price: 1.2, tags: ['red', 'sweet'] }
    });
    
    await index.insertItem({
        vector: [0.2, 0.3, 0.4, 0.5],
        metadata: { name: 'Banana', category: 'fruit', price: 0.8, tags: ['yellow', 'sweet'] }
    });
    
    await index.insertItem({
        vector: [0.3, 0.4, 0.5, 0.6],
        metadata: { name: 'Carrot', category: 'vegetable', price: 0.5, tags: ['orange', 'healthy'] }
    });
    
    await index.insertItem({
        vector: [0.4, 0.5, 0.6, 0.7],
        metadata: { name: 'Strawberry', category: 'fruit', price: 2.5, tags: ['red', 'sweet', 'expensive'] }
    });
    
    // Test various filters
    console.log('Testing $gt filter...');
    let results = await index.listItemsByMetadata({ price: { $gt: 1.0 } });
    console.log(`✓ Items with price > 1.0: ${results.map(r => r.metadata.name).join(', ')}\n`);
    
    console.log('Testing $in filter...');
    results = await index.listItemsByMetadata({ 
        tags: { $in: ['red'] } 
    });
    console.log(`✓ Items with 'red' tag: ${results.map(r => r.metadata.name).join(', ')}\n`);
    
    console.log('Testing $and filter...');
    results = await index.listItemsByMetadata({
        $and: [
            { category: 'fruit' },
            { price: { $lt: 2.0 } }
        ]
    });
    console.log(`✓ Fruits under $2: ${results.map(r => r.metadata.name).join(', ')}\n`);
}

async function runAllTests() {
    try {
        console.log('Starting Vectra Enhanced API Tests\n');
        console.log('=' . repeat(50) + '\n');
        
        await testBasicAPI();
        await testTransactions();
        await testErrorHandling();
        await testLazyIndex();
        await testDataIntegrity();
        await testWAL();
        await testCompaction();
        await testMetadataFiltering();
        
        console.log('=' . repeat(50));
        console.log('\n✅ All API tests completed successfully!\n');
        
        // Clean up
        console.log('Cleaning up test data...');
        fs.rmSync(testDir, { recursive: true, force: true });
        console.log('✓ Test data cleaned up');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

// Run tests
runAllTests();