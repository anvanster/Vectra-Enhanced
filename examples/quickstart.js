/**
 * Vectra Enhanced Quick Start
 * 
 * Get up and running with Vectra Enhanced in 5 minutes
 */

const { LocalIndex } = require('../lib');

async function quickstart() {
    // 1. Create an index
    const index = new LocalIndex('./quickstart-index');
    
    // 2. Initialize it
    await index.createIndex();
    
    // 3. Add some documents
    const documents = [
        { text: "The cat sat on the mat", vector: [0.1, 0.2, 0.3, 0.4] },
        { text: "The dog played in the park", vector: [0.2, 0.3, 0.4, 0.5] },
        { text: "Birds fly high in the sky", vector: [0.3, 0.4, 0.5, 0.6] },
        { text: "Fish swim in the ocean", vector: [0.4, 0.5, 0.6, 0.7] }
    ];
    
    console.log('Adding documents...');
    for (const doc of documents) {
        await index.insertItem({
            vector: doc.vector,
            metadata: { text: doc.text }
        });
    }
    
    // 4. Search for similar documents
    console.log('\nSearching for documents similar to "pets and animals"...');
    const searchVector = [0.15, 0.25, 0.35, 0.45]; // This would come from your embedding model
    const results = await index.queryItems(searchVector, '', 3);
    
    console.log('\nTop 3 results:');
    results.forEach((result, i) => {
        console.log(`${i + 1}. ${result.item.metadata.text} (score: ${result.score.toFixed(3)})`);
    });
    
    // 5. Clean up (optional)
    // await index.deleteIndex();
}

// Run the quickstart
quickstart().catch(console.error);