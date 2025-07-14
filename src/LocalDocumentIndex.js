"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalDocumentIndex = void 0;
var fs = __importStar(require("fs/promises"));
var path = __importStar(require("path"));
var uuid_1 = require("uuid");
var GPT3Tokenizer_1 = require("./GPT3Tokenizer");
var LocalIndex_1 = require("./LocalIndex");
var TextSplitter_1 = require("./TextSplitter");
var LocalDocumentResult_1 = require("./LocalDocumentResult");
var LocalDocument_1 = require("./LocalDocument");
/**
 * Represents a local index of documents stored on disk.
 */
var LocalDocumentIndex = /** @class */ (function (_super) {
    __extends(LocalDocumentIndex, _super);
    /**
     * Creates a new `LocalDocumentIndex` instance.
     * @param config Configuration settings for the document index.
     */
    function LocalDocumentIndex(config) {
        var _a, _b;
        var _this = _super.call(this, config.folderPath) || this;
        _this._embeddings = config.embeddings;
        _this._chunkingConfig = Object.assign({
            keepSeparators: true,
            chunkSize: 512,
            chunkOverlap: 0,
        }, config.chunkingConfig);
        _this._tokenizer = (_b = (_a = config.tokenizer) !== null && _a !== void 0 ? _a : _this._chunkingConfig.tokenizer) !== null && _b !== void 0 ? _b : new GPT3Tokenizer_1.GPT3Tokenizer();
        _this._chunkingConfig.tokenizer = _this._tokenizer;
        return _this;
    }
    Object.defineProperty(LocalDocumentIndex.prototype, "embeddings", {
        /**
         * Returns the embeddings model used by the index (if configured.)
         */
        get: function () {
            return this._embeddings;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LocalDocumentIndex.prototype, "tokenizer", {
        /**
         * Returns the tokenizer used by the index.
         */
        get: function () {
            return this._tokenizer;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Returns true if the document catalog exists.
     */
    LocalDocumentIndex.prototype.isCatalogCreated = function () {
        return __awaiter(this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.access(path.join(this.folderPath, 'catalog.json'))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        err_1 = _a.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the document ID for the given URI.
     * @param uri URI of the document to lookup.
     * @returns Document ID or undefined if not found.
     */
    LocalDocumentIndex.prototype.getDocumentId = function (uri) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.loadIndexData()];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, (_a = this._catalog) === null || _a === void 0 ? void 0 : _a.uriToId[uri]];
                }
            });
        });
    };
    /**
     * Returns the document URI for the given ID.
     * @param documentId ID of the document to lookup.
     * @returns Document URI or undefined if not found.
     */
    LocalDocumentIndex.prototype.getDocumentUri = function (documentId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.loadIndexData()];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, (_a = this._catalog) === null || _a === void 0 ? void 0 : _a.idToUri[documentId]];
                }
            });
        });
    };
    /**
     * Loads the document catalog from disk and returns its stats.
     * @returns Catalog stats.
     */
    LocalDocumentIndex.prototype.getCatalogStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getIndexStats()];
                    case 1:
                        stats = _a.sent();
                        return [2 /*return*/, {
                                version: this._catalog.version,
                                documents: this._catalog.count,
                                chunks: stats.items,
                                metadata_config: stats.metadata_config
                            }];
                }
            });
        });
    };
    /**
     * Deletes a document from the index.
     * @param uri URI of the document to delete.
     */
    LocalDocumentIndex.prototype.deleteDocument = function (uri) {
        return __awaiter(this, void 0, void 0, function () {
            var documentId, chunks, _i, chunks_1, chunk, err_2, err_3, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDocumentId(uri)];
                    case 1:
                        documentId = _a.sent();
                        if (documentId == undefined) {
                            return [2 /*return*/];
                        }
                        // Delete document chunks from index and remove from catalog
                        return [4 /*yield*/, this.beginUpdate()];
                    case 2:
                        // Delete document chunks from index and remove from catalog
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 10, , 11]);
                        return [4 /*yield*/, this.listItemsByMetadata({ documentId: documentId })];
                    case 4:
                        chunks = _a.sent();
                        _i = 0, chunks_1 = chunks;
                        _a.label = 5;
                    case 5:
                        if (!(_i < chunks_1.length)) return [3 /*break*/, 8];
                        chunk = chunks_1[_i];
                        return [4 /*yield*/, this.deleteItem(chunk.id)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 5];
                    case 8:
                        // Remove entry from catalog
                        delete this._newCatalog.uriToId[uri];
                        delete this._newCatalog.idToUri[documentId];
                        this._newCatalog.count--;
                        // Commit changes
                        return [4 /*yield*/, this.endUpdate()];
                    case 9:
                        // Commit changes
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        err_2 = _a.sent();
                        // Cancel update and raise error
                        this.cancelUpdate();
                        throw new Error("Error deleting document \"".concat(uri, "\": ").concat(err_2.toString()));
                    case 11:
                        _a.trys.push([11, 13, , 14]);
                        return [4 /*yield*/, fs.unlink(path.join(this.folderPath, "".concat(documentId, ".txt")))];
                    case 12:
                        _a.sent();
                        return [3 /*break*/, 14];
                    case 13:
                        err_3 = _a.sent();
                        throw new Error("Error removing text file for document \"".concat(uri, "\" from disk: ").concat(err_3.toString()));
                    case 14:
                        _a.trys.push([14, 16, , 17]);
                        return [4 /*yield*/, fs.unlink(path.join(this.folderPath, "".concat(documentId, ".json")))];
                    case 15:
                        _a.sent();
                        return [3 /*break*/, 17];
                    case 16:
                        err_4 = _a.sent();
                        return [3 /*break*/, 17];
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Adds a document to the catalog.
     * @remarks
     * A new update is started if one is not already in progress. If an document with the same uri
     * already exists, it will be replaced.
     * @param uri - Document URI
     * @param text - Document text
     * @param docType - Optional. Document type
     * @param metadata - Optional. Document metadata to index
     * @returns Inserted document
     */
    LocalDocumentIndex.prototype.upsertDocument = function (uri, text, docType, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var documentId, config, pos, ext, splitter, chunks, totalTokens, chunkBatches, currentBatch, _i, chunks_2, chunk, embeddings, _a, chunkBatches_1, batch, response, err_5, _b, _c, embedding, i, chunk, embedding, chunkMetadata, err_6;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        // Ensure embeddings configured
                        if (!this._embeddings) {
                            throw new Error("Embeddings model not configured.");
                        }
                        return [4 /*yield*/, this.getDocumentId(uri)];
                    case 1:
                        documentId = _d.sent();
                        if (!(documentId != undefined)) return [3 /*break*/, 3];
                        // Delete existing document
                        return [4 /*yield*/, this.deleteDocument(uri)];
                    case 2:
                        // Delete existing document
                        _d.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        // Generate new document ID
                        documentId = (0, uuid_1.v4)();
                        _d.label = 4;
                    case 4:
                        config = Object.assign({ docType: docType }, this._chunkingConfig);
                        if (config.docType == undefined) {
                            pos = uri.lastIndexOf('.');
                            if (pos >= 0) {
                                ext = uri.substring(pos + 1).toLowerCase();
                                config.docType = ext;
                            }
                        }
                        splitter = new TextSplitter_1.TextSplitter(config);
                        chunks = splitter.split(text);
                        totalTokens = 0;
                        chunkBatches = [];
                        currentBatch = [];
                        for (_i = 0, chunks_2 = chunks; _i < chunks_2.length; _i++) {
                            chunk = chunks_2[_i];
                            totalTokens += chunk.tokens.length;
                            if (totalTokens > this._embeddings.maxTokens) {
                                chunkBatches.push(currentBatch);
                                currentBatch = [];
                                totalTokens = chunk.tokens.length;
                            }
                            currentBatch.push(chunk.text.replace(/\n/g, ' '));
                        }
                        if (currentBatch.length > 0) {
                            chunkBatches.push(currentBatch);
                        }
                        embeddings = [];
                        _a = 0, chunkBatches_1 = chunkBatches;
                        _d.label = 5;
                    case 5:
                        if (!(_a < chunkBatches_1.length)) return [3 /*break*/, 11];
                        batch = chunkBatches_1[_a];
                        response = void 0;
                        _d.label = 6;
                    case 6:
                        _d.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, this._embeddings.createEmbeddings(batch)];
                    case 7:
                        response = _d.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        err_5 = _d.sent();
                        throw new Error("Error generating embeddings: ".concat(err_5.toString()));
                    case 9:
                        // Check for error
                        if (response.status != 'success') {
                            throw new Error("Error generating embeddings: ".concat(response.message));
                        }
                        // Add embeddings to output
                        for (_b = 0, _c = response.output; _b < _c.length; _b++) {
                            embedding = _c[_b];
                            embeddings.push(embedding);
                        }
                        _d.label = 10;
                    case 10:
                        _a++;
                        return [3 /*break*/, 5];
                    case 11: 
                    // Add document chunks to index
                    return [4 /*yield*/, this.beginUpdate()];
                    case 12:
                        // Add document chunks to index
                        _d.sent();
                        _d.label = 13;
                    case 13:
                        _d.trys.push([13, 22, , 23]);
                        i = 0;
                        _d.label = 14;
                    case 14:
                        if (!(i < chunks.length)) return [3 /*break*/, 17];
                        chunk = chunks[i];
                        embedding = embeddings[i];
                        chunkMetadata = Object.assign({
                            documentId: documentId,
                            startPos: chunk.startPos,
                            endPos: chunk.endPos,
                        }, metadata);
                        return [4 /*yield*/, this.insertItem({
                                id: (0, uuid_1.v4)(),
                                metadata: chunkMetadata,
                                vector: embedding,
                            })];
                    case 15:
                        _d.sent();
                        _d.label = 16;
                    case 16:
                        i++;
                        return [3 /*break*/, 14];
                    case 17:
                        if (!(metadata != undefined)) return [3 /*break*/, 19];
                        return [4 /*yield*/, fs.writeFile(path.join(this.folderPath, "".concat(documentId, ".json")), JSON.stringify(metadata))];
                    case 18:
                        _d.sent();
                        _d.label = 19;
                    case 19: 
                    // Save text file to disk
                    return [4 /*yield*/, fs.writeFile(path.join(this.folderPath, "".concat(documentId, ".txt")), text)];
                    case 20:
                        // Save text file to disk
                        _d.sent();
                        // Add entry to catalog
                        this._newCatalog.uriToId[uri] = documentId;
                        this._newCatalog.idToUri[documentId] = uri;
                        this._newCatalog.count++;
                        // Commit changes
                        return [4 /*yield*/, this.endUpdate()];
                    case 21:
                        // Commit changes
                        _d.sent();
                        return [3 /*break*/, 23];
                    case 22:
                        err_6 = _d.sent();
                        // Cancel update and raise error
                        this.cancelUpdate();
                        throw new Error("Error adding document \"".concat(uri, "\": ").concat(err_6.toString()));
                    case 23: 
                    // Return document
                    return [2 /*return*/, new LocalDocument_1.LocalDocument(this, documentId, uri)];
                }
            });
        });
    };
    /**
     * Returns all documents in the index.
     * @remarks
     * Each document will contain all of the documents indexed chunks.
     * @returns Array of documents.
     */
    LocalDocumentIndex.prototype.listDocuments = function () {
        return __awaiter(this, void 0, void 0, function () {
            var docs, chunks, results, _a, _b, _c, _i, documentId, uri, documentResult;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        docs = {};
                        return [4 /*yield*/, this.listItems()];
                    case 1:
                        chunks = _d.sent();
                        chunks.forEach(function (chunk) {
                            var metadata = chunk.metadata;
                            if (docs[metadata.documentId] == undefined) {
                                docs[metadata.documentId] = [];
                            }
                            docs[metadata.documentId].push({ item: chunk, score: 1.0 });
                        });
                        results = [];
                        _a = docs;
                        _b = [];
                        for (_c in _a)
                            _b.push(_c);
                        _i = 0;
                        _d.label = 2;
                    case 2:
                        if (!(_i < _b.length)) return [3 /*break*/, 5];
                        _c = _b[_i];
                        if (!(_c in _a)) return [3 /*break*/, 4];
                        documentId = _c;
                        return [4 /*yield*/, this.getDocumentUri(documentId)];
                    case 3:
                        uri = _d.sent();
                        documentResult = new LocalDocumentResult_1.LocalDocumentResult(this, documentId, uri, docs[documentId], this._tokenizer);
                        results.push(documentResult);
                        _d.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Queries the index for documents similar to the given query.
     * @param query Text to query for.
     * @param options Optional. Query options.
     * @returns Array of document results.
     */
    LocalDocumentIndex.prototype.queryDocuments = function (query, options) {
        return __awaiter(this, void 0, void 0, function () {
            var embeddings, err_7, results, documentChunks, _i, results_1, result, metadata, documentResults, _a, _b, _c, _d, documentId, chunks, uri, documentResult;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        // Ensure embeddings configured
                        if (!this._embeddings) {
                            throw new Error("Embeddings model not configured.");
                        }
                        // Ensure options are defined
                        options = Object.assign({
                            maxDocuments: 10,
                            maxChunks: 50,
                        }, options);
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this._embeddings.createEmbeddings(query.replace(/\n/g, ' '))];
                    case 2:
                        embeddings = _e.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_7 = _e.sent();
                        throw new Error("Error generating embeddings for query: ".concat(err_7.toString()));
                    case 4:
                        // Check for error
                        if (embeddings.status != 'success') {
                            throw new Error("Error generating embeddings for query: ".concat(embeddings.message));
                        }
                        return [4 /*yield*/, this.queryItems(embeddings.output[0], query, options.maxChunks, options.filter, options.isBm25)];
                    case 5:
                        results = _e.sent();
                        documentChunks = {};
                        for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                            result = results_1[_i];
                            metadata = result.item.metadata;
                            if (documentChunks[metadata.documentId] == undefined) {
                                documentChunks[metadata.documentId] = [];
                            }
                            documentChunks[metadata.documentId].push(result);
                        }
                        documentResults = [];
                        _a = documentChunks;
                        _b = [];
                        for (_c in _a)
                            _b.push(_c);
                        _d = 0;
                        _e.label = 6;
                    case 6:
                        if (!(_d < _b.length)) return [3 /*break*/, 9];
                        _c = _b[_d];
                        if (!(_c in _a)) return [3 /*break*/, 8];
                        documentId = _c;
                        chunks = documentChunks[documentId];
                        return [4 /*yield*/, this.getDocumentUri(documentId)];
                    case 7:
                        uri = _e.sent();
                        documentResult = new LocalDocumentResult_1.LocalDocumentResult(this, documentId, uri, chunks, this._tokenizer);
                        documentResults.push(documentResult);
                        _e.label = 8;
                    case 8:
                        _d++;
                        return [3 /*break*/, 6];
                    case 9: 
                    // Sort document results by score and return top results
                    return [2 /*return*/, documentResults.sort(function (a, b) { return b.score - a.score; }).slice(0, options.maxDocuments)];
                }
            });
        });
    };
    // Overrides
    LocalDocumentIndex.prototype.beginUpdate = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, _super.prototype.beginUpdate.call(this)];
                    case 1:
                        _a.sent();
                        this._newCatalog = Object.assign({}, this._catalog);
                        return [2 /*return*/];
                }
            });
        });
    };
    LocalDocumentIndex.prototype.cancelUpdate = function () {
        _super.prototype.cancelUpdate.call(this);
        this._newCatalog = undefined;
    };
    LocalDocumentIndex.prototype.createIndex = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, _super.prototype.createIndex.call(this, config)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.loadIndexData()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    LocalDocumentIndex.prototype.endUpdate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var err_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, _super.prototype.endUpdate.call(this)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        // Save catalog
                        return [4 /*yield*/, fs.writeFile(path.join(this.folderPath, 'catalog.json'), JSON.stringify(this._newCatalog))];
                    case 3:
                        // Save catalog
                        _a.sent();
                        this._catalog = this._newCatalog;
                        this._newCatalog = undefined;
                        return [3 /*break*/, 5];
                    case 4:
                        err_8 = _a.sent();
                        throw new Error("Error saving document catalog: ".concat(err_8.toString()));
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    LocalDocumentIndex.prototype.loadIndexData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var catalogPath, buffer, err_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, _super.prototype.loadIndexData.call(this)];
                    case 1:
                        _a.sent();
                        if (this._catalog) {
                            return [2 /*return*/];
                        }
                        catalogPath = path.join(this.folderPath, 'catalog.json');
                        return [4 /*yield*/, this.isCatalogCreated()];
                    case 2:
                        if (!_a.sent()) return [3 /*break*/, 4];
                        return [4 /*yield*/, fs.readFile(catalogPath)];
                    case 3:
                        buffer = _a.sent();
                        this._catalog = JSON.parse(buffer.toString());
                        return [3 /*break*/, 7];
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        // Initialize catalog
                        this._catalog = {
                            version: 1,
                            count: 0,
                            uriToId: {},
                            idToUri: {},
                        };
                        return [4 /*yield*/, fs.writeFile(catalogPath, JSON.stringify(this._catalog))];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        err_9 = _a.sent();
                        throw new Error("Error creating document catalog: ".concat(err_9.toString()));
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return LocalDocumentIndex;
}(LocalIndex_1.LocalIndex));
exports.LocalDocumentIndex = LocalDocumentIndex;
