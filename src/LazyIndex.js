"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LazyIndex = void 0;
var fs = __importStar(require("fs/promises"));
var path = __importStar(require("path"));
var ItemSelector_1 = require("./ItemSelector");
var uuid_1 = require("uuid");
var LRUCache = /** @class */ (function () {
    function LRUCache(maxSize) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    LRUCache.prototype.get = function (key) {
        var value = this.cache.get(key);
        if (value !== undefined) {
            // Move to end (most recently used)
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    };
    LRUCache.prototype.set = function (key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        else if (this.cache.size >= this.maxSize) {
            // Remove least recently used (first item)
            var firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    };
    LRUCache.prototype.clear = function () {
        this.cache.clear();
    };
    Object.defineProperty(LRUCache.prototype, "size", {
        get: function () {
            return this.cache.size;
        },
        enumerable: false,
        configurable: true
    });
    return LRUCache;
}());
var LazyIndex = /** @class */ (function () {
    function LazyIndex(folderPath, options) {
        if (options === void 0) { options = {}; }
        this.folderPath = folderPath;
        this.options = {
            cacheSize: options.cacheSize || 1000,
            pageSize: options.pageSize || 100,
            preloadMetadata: options.preloadMetadata || false
        };
        this.itemCache = new LRUCache(this.options.cacheSize);
        this.chunkCache = new LRUCache(Math.max(10, Math.floor(this.options.cacheSize / 100)));
        this.metadataCache = new LRUCache(this.options.cacheSize);
    }
    /**
     * Loads the index manifest
     */
    LazyIndex.prototype.loadManifest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var manifestPath, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.manifest) {
                            return [2 /*return*/, this.manifest];
                        }
                        manifestPath = path.join(this.folderPath, 'manifest.json');
                        return [4 /*yield*/, fs.readFile(manifestPath, 'utf-8')];
                    case 1:
                        data = _a.sent();
                        this.manifest = JSON.parse(data);
                        return [2 /*return*/, this.manifest];
                }
            });
        });
    };
    /**
     * Finds which chunk contains an item by ID
     */
    LazyIndex.prototype.findChunkForItem = function (itemId) {
        return __awaiter(this, void 0, void 0, function () {
            var manifest, cachedItem, _i, _a, chunk, chunkData;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.loadManifest()];
                    case 1:
                        manifest = _b.sent();
                        cachedItem = this.itemCache.get(itemId);
                        if (cachedItem) {
                            return [2 /*return*/, undefined]; // Already in cache
                        }
                        _i = 0, _a = manifest.chunks;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        chunk = _a[_i];
                        return [4 /*yield*/, this.loadChunk(chunk.id)];
                    case 3:
                        chunkData = _b.sent();
                        if (chunkData.has(itemId)) {
                            return [2 /*return*/, chunk];
                        }
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, undefined];
                }
            });
        });
    };
    /**
     * Loads a chunk from disk
     */
    LazyIndex.prototype.loadChunk = function (chunkId) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, manifest, chunkInfo, chunkPath, data, items, chunkMap, _i, items_1, item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cached = this.chunkCache.get(chunkId);
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        return [4 /*yield*/, this.loadManifest()];
                    case 1:
                        manifest = _a.sent();
                        chunkInfo = manifest.chunks.find(function (c) { return c.id === chunkId; });
                        if (!chunkInfo) {
                            throw new Error("Chunk ".concat(chunkId, " not found"));
                        }
                        chunkPath = path.join(this.folderPath, 'chunks', chunkInfo.filename);
                        return [4 /*yield*/, fs.readFile(chunkPath, 'utf-8')];
                    case 2:
                        data = _a.sent();
                        items = JSON.parse(data);
                        chunkMap = new Map();
                        for (_i = 0, items_1 = items; _i < items_1.length; _i++) {
                            item = items_1[_i];
                            chunkMap.set(item.id, item);
                            // Also cache individual items
                            this.itemCache.set(item.id, item);
                        }
                        this.chunkCache.set(chunkId, chunkMap);
                        return [2 /*return*/, chunkMap];
                }
            });
        });
    };
    /**
     * Gets a single item by ID
     */
    LazyIndex.prototype.getItem = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, chunkInfo, item, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cached = this.itemCache.get(id);
                        if (!cached) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.loadMetadataIfNeeded(cached)];
                    case 1: return [2 /*return*/, _b.sent()];
                    case 2: return [4 /*yield*/, this.findChunkForItem(id)];
                    case 3:
                        chunkInfo = _b.sent();
                        if (!chunkInfo) {
                            return [2 /*return*/, undefined];
                        }
                        item = this.itemCache.get(id);
                        if (!item) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.loadMetadataIfNeeded(item)];
                    case 4:
                        _a = _b.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        _a = undefined;
                        _b.label = 6;
                    case 6: return [2 /*return*/, _a];
                }
            });
        });
    };
    /**
     * Loads external metadata if needed
     */
    LazyIndex.prototype.loadMetadataIfNeeded = function (item) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, metadataPath, data, metadata;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!item.metadataFile) {
                            return [2 /*return*/, item];
                        }
                        cached = this.metadataCache.get(item.id);
                        if (cached) {
                            return [2 /*return*/, __assign(__assign({}, item), { metadata: cached })];
                        }
                        metadataPath = path.join(this.folderPath, item.metadataFile);
                        return [4 /*yield*/, fs.readFile(metadataPath, 'utf-8')];
                    case 1:
                        data = _a.sent();
                        metadata = JSON.parse(data);
                        this.metadataCache.set(item.id, metadata);
                        return [2 /*return*/, __assign(__assign({}, item), { metadata: metadata })];
                }
            });
        });
    };
    /**
     * Lists items with pagination
     */
    LazyIndex.prototype.listItems = function () {
        return __awaiter(this, arguments, void 0, function (page, pageSize) {
            var manifest, size, startIndex, endIndex, items, _i, _a, chunk, chunkData, chunkItems, i, globalIndex, item;
            if (page === void 0) { page = 1; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.loadManifest()];
                    case 1:
                        manifest = _b.sent();
                        size = pageSize || this.options.pageSize;
                        startIndex = (page - 1) * size;
                        endIndex = Math.min(startIndex + size, manifest.totalItems);
                        if (startIndex >= manifest.totalItems) {
                            return [2 /*return*/, {
                                    items: [],
                                    pageInfo: {
                                        pageSize: size,
                                        pageNumber: page,
                                        totalItems: manifest.totalItems,
                                        totalPages: Math.ceil(manifest.totalItems / size)
                                    },
                                    hasMore: false
                                }];
                        }
                        items = [];
                        _i = 0, _a = manifest.chunks;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 8];
                        chunk = _a[_i];
                        if (chunk.endIndex < startIndex || chunk.startIndex >= endIndex) {
                            return [3 /*break*/, 7]; // Skip chunks outside range
                        }
                        return [4 /*yield*/, this.loadChunk(chunk.id)];
                    case 3:
                        chunkData = _b.sent();
                        chunkItems = Array.from(chunkData.values());
                        i = 0;
                        _b.label = 4;
                    case 4:
                        if (!(i < chunkItems.length)) return [3 /*break*/, 7];
                        globalIndex = chunk.startIndex + i;
                        if (!(globalIndex >= startIndex && globalIndex < endIndex)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.loadMetadataIfNeeded(chunkItems[i])];
                    case 5:
                        item = _b.sent();
                        items.push(item);
                        _b.label = 6;
                    case 6:
                        i++;
                        return [3 /*break*/, 4];
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8: return [2 /*return*/, {
                            items: items,
                            pageInfo: {
                                pageSize: size,
                                pageNumber: page,
                                totalItems: manifest.totalItems,
                                totalPages: Math.ceil(manifest.totalItems / size)
                            },
                            hasMore: endIndex < manifest.totalItems
                        }];
                }
            });
        });
    };
    /**
     * Creates an async iterator for streaming items
     */
    LazyIndex.prototype.iterateItems = function () {
        return __asyncGenerator(this, arguments, function iterateItems_1() {
            var manifest, _i, _a, chunkInfo, chunkData, _b, _c, item;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, __await(this.loadManifest())];
                    case 1:
                        manifest = _d.sent();
                        _i = 0, _a = manifest.chunks;
                        _d.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 10];
                        chunkInfo = _a[_i];
                        return [4 /*yield*/, __await(this.loadChunk(chunkInfo.id))];
                    case 3:
                        chunkData = _d.sent();
                        _b = 0, _c = chunkData.values();
                        _d.label = 4;
                    case 4:
                        if (!(_b < _c.length)) return [3 /*break*/, 9];
                        item = _c[_b];
                        return [4 /*yield*/, __await(this.loadMetadataIfNeeded(item))];
                    case 5: return [4 /*yield*/, __await.apply(void 0, [_d.sent()])];
                    case 6: return [4 /*yield*/, _d.sent()];
                    case 7:
                        _d.sent();
                        _d.label = 8;
                    case 8:
                        _b++;
                        return [3 /*break*/, 4];
                    case 9:
                        _i++;
                        return [3 /*break*/, 2];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Filters items with streaming
     */
    LazyIndex.prototype.filterItems = function (filter) {
        return __asyncGenerator(this, arguments, function filterItems_1() {
            var _a, _b, _c, item, e_1_1;
            var _d, e_1, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _g.trys.push([0, 7, 8, 13]);
                        _a = true, _b = __asyncValues(this.iterateItems());
                        _g.label = 1;
                    case 1: return [4 /*yield*/, __await(_b.next())];
                    case 2:
                        if (!(_c = _g.sent(), _d = _c.done, !_d)) return [3 /*break*/, 6];
                        _f = _c.value;
                        _a = false;
                        item = _f;
                        if (!ItemSelector_1.ItemSelector.select(item.metadata, filter)) return [3 /*break*/, 5];
                        return [4 /*yield*/, __await(item)];
                    case 3: return [4 /*yield*/, _g.sent()];
                    case 4:
                        _g.sent();
                        _g.label = 5;
                    case 5:
                        _a = true;
                        return [3 /*break*/, 1];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_1_1 = _g.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _g.trys.push([8, , 11, 12]);
                        if (!(!_a && !_d && (_e = _b.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, __await(_e.call(_b))];
                    case 9:
                        _g.sent();
                        _g.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets items by metadata filter with pagination
     */
    LazyIndex.prototype.listItemsByMetadata = function (filter_1) {
        return __awaiter(this, arguments, void 0, function (filter, page, pageSize) {
            var size, items, totalMatches, skipped, skipCount, _a, _b, _c, item, e_2_1;
            var _d, e_2, _e, _f;
            if (page === void 0) { page = 1; }
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        size = pageSize || this.options.pageSize;
                        items = [];
                        totalMatches = 0;
                        skipped = 0;
                        skipCount = (page - 1) * size;
                        _g.label = 1;
                    case 1:
                        _g.trys.push([1, 6, 7, 12]);
                        _a = true, _b = __asyncValues(this.filterItems(filter));
                        _g.label = 2;
                    case 2: return [4 /*yield*/, _b.next()];
                    case 3:
                        if (!(_c = _g.sent(), _d = _c.done, !_d)) return [3 /*break*/, 5];
                        _f = _c.value;
                        _a = false;
                        item = _f;
                        totalMatches++;
                        if (skipped < skipCount) {
                            skipped++;
                            return [3 /*break*/, 4];
                        }
                        if (items.length < size) {
                            items.push(item);
                        }
                        _g.label = 4;
                    case 4:
                        _a = true;
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 12];
                    case 6:
                        e_2_1 = _g.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 12];
                    case 7:
                        _g.trys.push([7, , 10, 11]);
                        if (!(!_a && !_d && (_e = _b.return))) return [3 /*break*/, 9];
                        return [4 /*yield*/, _e.call(_b)];
                    case 8:
                        _g.sent();
                        _g.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        if (e_2) throw e_2.error;
                        return [7 /*endfinally*/];
                    case 11: return [7 /*endfinally*/];
                    case 12: return [2 /*return*/, {
                            items: items,
                            pageInfo: {
                                pageSize: size,
                                pageNumber: page,
                                totalItems: totalMatches,
                                totalPages: Math.ceil(totalMatches / size)
                            },
                            hasMore: totalMatches > skipCount + items.length
                        }];
                }
            });
        });
    };
    /**
     * Creates a lazy index from an existing index
     */
    LazyIndex.createFromIndex = function (indexPath_1, outputPath_1) {
        return __awaiter(this, arguments, void 0, function (indexPath, outputPath, chunkSize) {
            var indexData, index, chunks, items, i, chunkItems, chunkId, chunkInfo, manifest, files, _i, files_1, file;
            var _a;
            if (chunkSize === void 0) { chunkSize = 1000; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, fs.readFile(path.join(indexPath, 'index.json'), 'utf-8')];
                    case 1:
                        indexData = _b.sent();
                        index = JSON.parse(indexData);
                        // Create output directory structure
                        return [4 /*yield*/, fs.mkdir(outputPath, { recursive: true })];
                    case 2:
                        // Create output directory structure
                        _b.sent();
                        return [4 /*yield*/, fs.mkdir(path.join(outputPath, 'chunks'), { recursive: true })];
                    case 3:
                        _b.sent();
                        chunks = [];
                        items = index.items || [];
                        i = 0;
                        _b.label = 4;
                    case 4:
                        if (!(i < items.length)) return [3 /*break*/, 7];
                        chunkItems = items.slice(i, Math.min(i + chunkSize, items.length));
                        chunkId = (0, uuid_1.v4)();
                        chunkInfo = {
                            id: chunkId,
                            startIndex: i,
                            endIndex: i + chunkItems.length - 1,
                            itemCount: chunkItems.length,
                            filename: "chunk-".concat(chunkId, ".json")
                        };
                        // Write chunk file
                        return [4 /*yield*/, fs.writeFile(path.join(outputPath, 'chunks', chunkInfo.filename), JSON.stringify(chunkItems))];
                    case 5:
                        // Write chunk file
                        _b.sent();
                        chunks.push(chunkInfo);
                        _b.label = 6;
                    case 6:
                        i += chunkSize;
                        return [3 /*break*/, 4];
                    case 7:
                        manifest = {
                            version: index.version || 1,
                            totalItems: items.length,
                            chunks: chunks,
                            vectorDimensions: items.length > 0 ? (_a = items[0].vector) === null || _a === void 0 ? void 0 : _a.length : undefined,
                            lastModified: new Date().toISOString()
                        };
                        // Write manifest
                        return [4 /*yield*/, fs.writeFile(path.join(outputPath, 'manifest.json'), JSON.stringify(manifest, null, 2))];
                    case 8:
                        // Write manifest
                        _b.sent();
                        return [4 /*yield*/, fs.readdir(indexPath)];
                    case 9:
                        files = _b.sent();
                        _i = 0, files_1 = files;
                        _b.label = 10;
                    case 10:
                        if (!(_i < files_1.length)) return [3 /*break*/, 13];
                        file = files_1[_i];
                        if (!(file.endsWith('.json') && file !== 'index.json')) return [3 /*break*/, 12];
                        return [4 /*yield*/, fs.copyFile(path.join(indexPath, file), path.join(outputPath, file))];
                    case 11:
                        _b.sent();
                        _b.label = 12;
                    case 12:
                        _i++;
                        return [3 /*break*/, 10];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clears all caches
     */
    LazyIndex.prototype.clearCache = function () {
        this.itemCache.clear();
        this.chunkCache.clear();
        this.metadataCache.clear();
        this.manifest = undefined;
    };
    /**
     * Gets cache statistics
     */
    LazyIndex.prototype.getCacheStats = function () {
        return {
            itemCacheSize: this.itemCache.size,
            chunkCacheSize: this.chunkCache.size,
            metadataCacheSize: this.metadataCache.size
        };
    };
    return LazyIndex;
}());
exports.LazyIndex = LazyIndex;
