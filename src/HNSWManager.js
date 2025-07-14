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
Object.defineProperty(exports, "__esModule", { value: true });
exports.hnswIndexManager = exports.HNSWIndexManager = exports.HNSWManager = void 0;
var fs = __importStar(require("fs/promises"));
var path = __importStar(require("path"));
var hnswlib_node_1 = require("hnswlib-node");
var AtomicOperations_1 = require("./AtomicOperations");
var crypto = __importStar(require("crypto"));
var HNSWManager = /** @class */ (function () {
    function HNSWManager(folderPath) {
        this.indexFileName = 'hnsw.index';
        this.metadataFileName = 'hnsw.meta';
        this.itemIdToLabel = new Map();
        this.labelToItemId = new Map();
        this.lastSaved = 0;
        this.isDirty = false;
        this.folderPath = folderPath;
    }
    /**
     * Initialize a new HNSW index
     */
    HNSWManager.prototype.initializeIndex = function (dimensions_1, distanceMetric_1) {
        return __awaiter(this, arguments, void 0, function (dimensions, distanceMetric, options) {
            var M, efConstruction, maxElements, randomSeed;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                this.dimensions = dimensions;
                this.distanceMetric = distanceMetric;
                M = options.M || 16;
                efConstruction = options.efConstruction || 200;
                maxElements = options.maxElements || 10000;
                randomSeed = options.randomSeed || 100;
                this.index = new hnswlib_node_1.HierarchicalNSW(distanceMetric, dimensions);
                this.index.initIndex(maxElements, M, efConstruction, randomSeed);
                this.itemIdToLabel.clear();
                this.labelToItemId.clear();
                this.isDirty = true;
                return [2 /*return*/];
            });
        });
    };
    /**
     * Add a vector to the index
     */
    HNSWManager.prototype.addVector = function (itemId, vector) {
        if (!this.index) {
            throw new Error('Index not initialized');
        }
        // Check if item already exists
        if (this.itemIdToLabel.has(itemId)) {
            throw new Error("Item ".concat(itemId, " already exists in index"));
        }
        // Get next label
        var label = this.itemIdToLabel.size;
        // Add to HNSW
        this.index.addPoint(vector, label);
        // Update mappings
        this.itemIdToLabel.set(itemId, label);
        this.labelToItemId.set(label, itemId);
        this.isDirty = true;
    };
    /**
     * Update a vector in the index
     */
    HNSWManager.prototype.updateVector = function (itemId, vector) {
        if (!this.index) {
            throw new Error('Index not initialized');
        }
        var label = this.itemIdToLabel.get(itemId);
        if (label === undefined) {
            throw new Error("Item ".concat(itemId, " not found in index"));
        }
        // HNSW doesn't support updates, so we need to mark as deleted and add new
        this.index.markDelete(label);
        // Add with new label
        var newLabel = this.itemIdToLabel.size;
        this.index.addPoint(vector, newLabel);
        // Update mappings
        this.itemIdToLabel.set(itemId, newLabel);
        this.labelToItemId.delete(label);
        this.labelToItemId.set(newLabel, itemId);
        this.isDirty = true;
    };
    /**
     * Remove a vector from the index
     */
    HNSWManager.prototype.removeVector = function (itemId) {
        if (!this.index) {
            throw new Error('Index not initialized');
        }
        var label = this.itemIdToLabel.get(itemId);
        if (label === undefined) {
            throw new Error("Item ".concat(itemId, " not found in index"));
        }
        // Mark as deleted in HNSW
        this.index.markDelete(label);
        // Remove from mappings
        this.itemIdToLabel.delete(itemId);
        this.labelToItemId.delete(label);
        this.isDirty = true;
    };
    /**
     * Search for k nearest neighbors
     */
    HNSWManager.prototype.searchKNN = function (queryVector, k, ef) {
        if (!this.index) {
            throw new Error('Index not initialized');
        }
        // Set search ef parameter for accuracy/speed trade-off
        if (ef) {
            this.index.setEf(ef);
        }
        var result = this.index.searchKnn(queryVector, k);
        // Convert labels to item IDs
        var results = [];
        for (var i = 0; i < result.neighbors.length; i++) {
            var label = result.neighbors[i];
            var itemId = this.labelToItemId.get(label);
            if (itemId) {
                results.push({
                    id: itemId,
                    distance: result.distances[i]
                });
            }
        }
        return results;
    };
    /**
     * Save index to disk
     */
    HNSWManager.prototype.save = function () {
        return __awaiter(this, arguments, void 0, function (options) {
            var indexPath, metadataPath, tempIndexPath, tempMetadataPath, checksum, indexData, metadata, err_1;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.index || !this.dimensions || !this.distanceMetric) {
                            throw new Error('Index not initialized');
                        }
                        // Skip if not dirty and incremental save is enabled
                        if (options.incrementalSave && !this.isDirty) {
                            return [2 /*return*/];
                        }
                        indexPath = path.join(this.folderPath, this.indexFileName);
                        metadataPath = path.join(this.folderPath, this.metadataFileName);
                        tempIndexPath = "".concat(indexPath, ".tmp");
                        tempMetadataPath = "".concat(metadataPath, ".tmp");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 10]);
                        // Save HNSW index
                        this.index.writeIndexSync(tempIndexPath);
                        checksum = void 0;
                        if (!options.checksumEnabled) return [3 /*break*/, 3];
                        return [4 /*yield*/, fs.readFile(tempIndexPath)];
                    case 2:
                        indexData = _a.sent();
                        checksum = crypto.createHash('sha256').update(indexData).digest('hex');
                        _a.label = 3;
                    case 3:
                        metadata = {
                            dimensions: this.dimensions,
                            distanceMetric: this.distanceMetric,
                            elementCount: this.itemIdToLabel.size,
                            capacity: this.index.getMaxElements(),
                            checksum: checksum,
                            lastSaved: Date.now(),
                            mappings: {
                                itemIdToLabel: Array.from(this.itemIdToLabel.entries()),
                                labelToItemId: Array.from(this.labelToItemId.entries())
                            }
                        };
                        return [4 /*yield*/, AtomicOperations_1.AtomicOperations.writeFile(tempMetadataPath, JSON.stringify(metadata, null, 2))];
                    case 4:
                        _a.sent();
                        // Atomic rename
                        return [4 /*yield*/, fs.rename(tempIndexPath, indexPath)];
                    case 5:
                        // Atomic rename
                        _a.sent();
                        return [4 /*yield*/, fs.rename(tempMetadataPath, metadataPath)];
                    case 6:
                        _a.sent();
                        this.lastSaved = Date.now();
                        this.isDirty = false;
                        return [3 /*break*/, 10];
                    case 7:
                        err_1 = _a.sent();
                        // Clean up temp files on error
                        return [4 /*yield*/, fs.unlink(tempIndexPath).catch(function () { })];
                    case 8:
                        // Clean up temp files on error
                        _a.sent();
                        return [4 /*yield*/, fs.unlink(tempMetadataPath).catch(function () { })];
                    case 9:
                        _a.sent();
                        throw err_1;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Load index from disk
     */
    HNSWManager.prototype.load = function () {
        return __awaiter(this, arguments, void 0, function (options) {
            var indexPath, metadataPath, _a, metadataData, metadata, indexData, calculatedChecksum;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        indexPath = path.join(this.folderPath, this.indexFileName);
                        metadataPath = path.join(this.folderPath, this.metadataFileName);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fs.access(indexPath)];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, fs.access(metadataPath)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        throw new Error('HNSW index files not found');
                    case 5: return [4 /*yield*/, fs.readFile(metadataPath, 'utf-8')];
                    case 6:
                        metadataData = _b.sent();
                        metadata = JSON.parse(metadataData);
                        if (!(options.checksumEnabled && metadata.checksum)) return [3 /*break*/, 8];
                        return [4 /*yield*/, fs.readFile(indexPath)];
                    case 7:
                        indexData = _b.sent();
                        calculatedChecksum = crypto.createHash('sha256').update(indexData).digest('hex');
                        if (calculatedChecksum !== metadata.checksum) {
                            throw new Error('HNSW index checksum mismatch');
                        }
                        _b.label = 8;
                    case 8:
                        // Create index instance
                        this.dimensions = metadata.dimensions;
                        this.distanceMetric = metadata.distanceMetric;
                        this.index = new hnswlib_node_1.HierarchicalNSW(this.distanceMetric, this.dimensions);
                        // Load index data
                        this.index.readIndexSync(indexPath);
                        // Restore mappings
                        this.itemIdToLabel = new Map(metadata.mappings.itemIdToLabel);
                        this.labelToItemId = new Map(metadata.mappings.labelToItemId);
                        this.lastSaved = metadata.lastSaved || 0;
                        this.isDirty = false;
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Build index from items
     */
    HNSWManager.prototype.buildFromItems = function (items_1, dimensions_1, distanceMetric_1) {
        return __awaiter(this, arguments, void 0, function (items, dimensions, distanceMetric, options, progressCallback) {
            var startTime, hnswOptions, i, buildTime;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        hnswOptions = __assign(__assign({}, options), { maxElements: items.length });
                        return [4 /*yield*/, this.initializeIndex(dimensions, distanceMetric, hnswOptions)];
                    case 1:
                        _a.sent();
                        // Add items with progress reporting
                        for (i = 0; i < items.length; i++) {
                            this.addVector(items[i].id, items[i].vector);
                            if (progressCallback && i % 100 === 0) {
                                progressCallback((i / items.length) * 100);
                            }
                        }
                        if (progressCallback) {
                            progressCallback(100);
                        }
                        buildTime = Date.now() - startTime;
                        console.log("HNSW index built in ".concat(buildTime, "ms for ").concat(items.length, " items"));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get index statistics
     */
    HNSWManager.prototype.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var fileSize, checksum, indexPath, stats, indexData, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.index || !this.dimensions || !this.distanceMetric) {
                            // Return empty stats for uninitialized index
                            return [2 /*return*/, {
                                    dimensions: 0,
                                    distanceMetric: 'cosine',
                                    elementCount: 0,
                                    capacity: 0
                                }];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        indexPath = path.join(this.folderPath, this.indexFileName);
                        return [4 /*yield*/, fs.stat(indexPath)];
                    case 2:
                        stats = _b.sent();
                        fileSize = stats.size;
                        return [4 /*yield*/, fs.readFile(indexPath)];
                    case 3:
                        indexData = _b.sent();
                        checksum = crypto.createHash('sha256').update(indexData).digest('hex');
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, {
                            dimensions: this.dimensions,
                            distanceMetric: this.distanceMetric,
                            elementCount: this.itemIdToLabel.size,
                            capacity: this.index.getCurrentCount(),
                            fileSize: fileSize,
                            checksum: checksum,
                            lastSaved: this.lastSaved
                        }];
                }
            });
        });
    };
    /**
     * Optimize index for search performance
     */
    HNSWManager.prototype.optimize = function (ef) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.index) {
                            // Nothing to optimize if index not initialized
                            return [2 /*return*/];
                        }
                        // Set optimal ef for search
                        if (ef) {
                            this.index.setEf(ef);
                        }
                        // Force save to persist optimizations
                        this.isDirty = true;
                        return [4 /*yield*/, this.save()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if index needs saving
     */
    HNSWManager.prototype.needsSave = function () {
        return this.isDirty;
    };
    /**
     * Clear the index
     */
    HNSWManager.prototype.clear = function () {
        this.index = undefined;
        this.dimensions = undefined;
        this.distanceMetric = undefined;
        this.itemIdToLabel.clear();
        this.labelToItemId.clear();
        this.isDirty = false;
        this.lastSaved = 0;
    };
    /**
     * Get current capacity
     */
    HNSWManager.prototype.getCapacity = function () {
        var _a;
        return ((_a = this.index) === null || _a === void 0 ? void 0 : _a.getMaxElements()) || 0;
    };
    /**
     * Resize index capacity
     */
    HNSWManager.prototype.resize = function (newCapacity) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.index) {
                    throw new Error('Index not initialized');
                }
                this.index.resizeIndex(newCapacity);
                this.isDirty = true;
                return [2 /*return*/];
            });
        });
    };
    return HNSWManager;
}());
exports.HNSWManager = HNSWManager;
/**
 * Singleton manager for HNSW indices
 */
var HNSWIndexManager = /** @class */ (function () {
    function HNSWIndexManager() {
        this.indices = new Map();
    }
    HNSWIndexManager.getInstance = function () {
        if (!HNSWIndexManager.instance) {
            HNSWIndexManager.instance = new HNSWIndexManager();
        }
        return HNSWIndexManager.instance;
    };
    HNSWIndexManager.prototype.getIndex = function (folderPath) {
        return __awaiter(this, void 0, void 0, function () {
            var index;
            return __generator(this, function (_a) {
                index = this.indices.get(folderPath);
                if (!index) {
                    index = new HNSWManager(folderPath);
                    this.indices.set(folderPath, index);
                }
                return [2 /*return*/, index];
            });
        });
    };
    HNSWIndexManager.prototype.closeIndex = function (folderPath) {
        return __awaiter(this, void 0, void 0, function () {
            var index;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        index = this.indices.get(folderPath);
                        if (!(index && index.needsSave())) return [3 /*break*/, 2];
                        return [4 /*yield*/, index.save()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.indices.delete(folderPath);
                        return [2 /*return*/];
                }
            });
        });
    };
    HNSWIndexManager.prototype.closeAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, path_1, index;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _i = 0, _a = this.indices;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        _b = _a[_i], path_1 = _b[0], index = _b[1];
                        if (!index.needsSave()) return [3 /*break*/, 3];
                        return [4 /*yield*/, index.save()];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        this.indices.clear();
                        return [2 /*return*/];
                }
            });
        });
    };
    return HNSWIndexManager;
}());
exports.HNSWIndexManager = HNSWIndexManager;
exports.hnswIndexManager = HNSWIndexManager.getInstance();
