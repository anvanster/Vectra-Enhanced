# Vectra Implementation Rework: TODO

This document outlines the major areas for rework to improve the performance, scalability, and reliability of the Vectra library.

## 1. Core Performance and Scalability

The current implementation uses a brute-force, linear search for queries and loads the entire index into RAM. This severely limits its performance and scalability.

-   [ ] **Implement Approximate Nearest Neighbor (ANN) Indexing:**
    -   **Goal:** Replace the exhaustive search with a high-performance ANN algorithm to enable fast queries on large datasets.
    -   **Action:** Integrate a proven ANN library like HNSW (Hierarchical Navigable Small World) or IVF (Inverted File). `hnswlib-node` is a potential candidate.
    -   **Impact:** Reduces query time from O(n) to O(log n), making Vectra viable for much larger indexes.

-   [ ] **Use Memory-Mapped Files for Data Storage:**
    -   **Goal:** Decouple the index size from the available system RAM.
    -   **Action:** Refactor the file I/O in `LocalIndex.ts` to use memory-mapped files (`mmap`). This will allow the OS to handle the paging of data between disk and memory.
    -   **Impact:** Enables Vectra to work with indexes that are much larger than the available RAM, significantly improving scalability.

## 2. Querying and Data Management

The query and data handling capabilities can be made more flexible and powerful.

-   [ ] **Support Configurable Distance Metrics:**
    -   **Goal:** Allow users to choose the most appropriate distance metric for their embedding model.
    -   **Action:** Modify the `createIndex` method to accept a distance metric option (e.g., `'cosine'`, `'euclidean'`, `'dotProduct'`). The query logic must then use the selected metric.
    -   **Impact:** Increases flexibility and allows users to optimize for their specific use case.

-   [ ] **Enhance Filtering and Hybrid Search:**
    -   **Goal:** Provide more advanced filtering and better integration of keyword and semantic search.
    -   **Action:**
        -   Expand the `MetadataFilter` to support more complex logical operators (`AND`, `OR`, `NOT`).
        -   Implement a tunable hybrid scoring mechanism that combines the BM25 score and the vector similarity score.
    -   **Impact:** Enables more sophisticated queries and improves the relevance of search results.

## 3. Reliability and Usability

The current write operations are not atomic and could lead to data corruption.

-   [ ] **Implement Atomic Write Operations:**
    -   **Goal:** Ensure that the index is never left in a corrupted state, even if a write operation is interrupted.
    -   **Action:** Refactor the `endUpdate` method to use a "write-and-rename" strategy. Write all changes to a temporary file first, and upon successful completion, atomically rename it to `index.json`.
    -   **Impact:** Guarantees the durability and consistency of the index.

-   [ ] **Add Backup and Snapshotting Functionality:**
    -   **Goal:** Provide a safe and easy way for users to back up their index.
    -   **Action:** Create a `snapshot()` method that safely creates a point-in-time copy of the index folder. This should be coordinated with the write operations to prevent backing up a partially written index.
    -   **Impact:** Improves data safety and simplifies maintenance.

## 4. Update and Delete Optimization

The current update and delete operations are inefficient as they require rewriting the entire index for every small change.

-   [ ] **Adopt an Append-Only Log (AOL) for Writes:**
    -   **Goal:** Make `insert`, `upsert`, and `delete` operations significantly faster.
    -   **Action:**
        -   Change write operations to append changes to the end of the index file (or a separate log file).
        -   Implement a "tombstone" mechanism for deletes, where deleted item IDs are logged separately.
        -   Create a `compact()` method that runs periodically (or manually) to clean up the index and remove old/deleted entries.
    -   **Impact:** Drastically reduces write latency and improves the overall throughput of the system.

-   [ ] **Use a Map for Faster In-Memory Lookups:**
    -   **Goal:** Speed up the in-memory portion of update and delete operations.
    -   **Action:** In `LocalIndex.ts`, replace the `items: IndexItem[]` array with a `Map<string, IndexItem>` for the in-memory representation of the data.
    -   **Impact:** Reduces the complexity of finding an item by its ID from O(n) to O(1), making in-memory modifications much faster.
