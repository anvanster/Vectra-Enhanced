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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalIndex = void 0;
var fs = __importStar(require("fs/promises"));
var path = __importStar(require("path"));
var uuid_1 = require("uuid");
var ItemSelector_1 = require("./ItemSelector");
var LocalDocument_1 = require("./LocalDocument");
var wink_bm25_text_search_1 = __importDefault(require("wink-bm25-text-search"));
var wink_nlp_1 = __importDefault(require("wink-nlp"));
var wink_eng_lite_web_model_1 = __importDefault(require("wink-eng-lite-web-model"));
var LockManager_1 = require("./LockManager");
var AtomicOperations_1 = require("./AtomicOperations");
var OperationQueue_1 = require("./OperationQueue");
var Validator_1 = require("./Validator");
var CleanupManager_1 = require("./CleanupManager");
var LazyIndex_1 = require("./LazyIndex");
var WAL_1 = require("./WAL");
var OperationsLog_1 = require("./OperationsLog");
var HNSWManager_1 = require("./HNSWManager");
/**
 * Local vector index instance.
 * @remarks
 * This class is used to create, update, and query a local vector index.
 * Each index is a folder on disk containing an index.json file and an optional set of metadata files.
 */
var LocalIndex = /** @class */ (function () {
    /**
     * Creates a new instance of LocalIndex.
     * @param folderPath Path to the index folder.
     * @param indexName Optional name of the index file. Defaults to index.json.
     */
    function LocalIndex(folderPath, indexName) {
        this._operationsLogName = 'operations.log';
        this._isLazy = false;
        this._walEnabled = false;
        this._folderPath = folderPath;
        this._indexName = indexName || "index.json";
        // Initialize operation queue with handlers
        this._operationQueue = new OperationQueue_1.OperationQueue({
            maxConcurrency: 1, // Serialize write operations
            maxRetries: 5,
            retryDelay: 100,
            priorityQueue: true
        });
        this.setupQueueHandlers();
    }
    LocalIndex.prototype.setupQueueHandlers = function () {
        var _this = this;
        // Handle insert operations
        this._operationQueue.setHandler('insert', function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.performInsert(data.item, data.unique)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); });
        // Handle delete operations
        this._operationQueue.setHandler('delete', function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.performDelete(data.id)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); });
        // Handle custom operations
        this._operationQueue.setHandler('custom', function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, data.fn()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); });
    };
    Object.defineProperty(LocalIndex.prototype, "folderPath", {
        /**
         * Path to the index folder.
         */
        get: function () {
            return this._folderPath;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LocalIndex.prototype, "indexName", {
        /**
         * Optional name of the index file.
         */
        get: function () {
            return this._indexName;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Begins an update to the index.
     * @remarks
     * This method loads the index into memory and prepares it for updates.
     */
    LocalIndex.prototype.beginUpdate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, err_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (this._update) {
                            throw new Error('Update already in progress');
                        }
                        // Acquire write lock
                        _a = this;
                        return [4 /*yield*/, LockManager_1.lockManager.acquireWriteLock(this._folderPath)];
                    case 1:
                        // Acquire write lock
                        _a._activeLock = _c.sent();
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 6, , 9]);
                        return [4 /*yield*/, this.loadIndexData()];
                    case 3:
                        _c.sent();
                        this._update = {
                            version: this._data.version,
                            distanceMetric: this._data.distanceMetric,
                            metadata_config: this._data.metadata_config,
                            vectorOptions: this._data.vectorOptions,
                            items: new Map(this._data.items),
                            wal: this._data.wal
                        };
                        if (!!this._hnswManager) return [3 /*break*/, 5];
                        _b = this;
                        return [4 /*yield*/, HNSWManager_1.hnswIndexManager.getIndex(this._folderPath)];
                    case 4:
                        _b._hnswManager = _c.sent();
                        _c.label = 5;
                    case 5: return [3 /*break*/, 9];
                    case 6:
                        err_1 = _c.sent();
                        if (!this._activeLock) return [3 /*break*/, 8];
                        return [4 /*yield*/, this._activeLock.release()];
                    case 7:
                        _c.sent();
                        this._activeLock = undefined;
                        _c.label = 8;
                    case 8: throw err_1;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cancels an update to the index.
     * @remarks
     * This method discards any changes made to the index since the update began.
     */
    LocalIndex.prototype.cancelUpdate = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._update = undefined;
                        if (!this._activeLock) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._activeLock.release()];
                    case 1:
                        _a.sent();
                        this._activeLock = undefined;
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new index.
     * @remarks
     * This method creates a new folder on disk containing an index.json file.
     * @param config Index configuration.
     */
    LocalIndex.prototype.createIndex = function () {
        return __awaiter(this, arguments, void 0, function (config) {
            var lock, manifest, indexData, indexData, _a, _b, err_2;
            var _c, _d, _e, _f, _g;
            if (config === void 0) { config = { version: 1, distanceMetric: 'cosine' }; }
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0: return [4 /*yield*/, this.isIndexCreated()];
                    case 1:
                        if (!_h.sent()) return [3 /*break*/, 4];
                        if (!config.deleteIfExists) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.deleteIndex()];
                    case 2:
                        _h.sent();
                        return [3 /*break*/, 4];
                    case 3: throw new Error('Index already exists');
                    case 4: 
                    // Create folder for index first
                    return [4 /*yield*/, fs.mkdir(this._folderPath, { recursive: true })];
                    case 5:
                        // Create folder for index first
                        _h.sent();
                        return [4 /*yield*/, LockManager_1.lockManager.acquireWriteLock(this._folderPath)];
                    case 6:
                        lock = _h.sent();
                        _h.label = 7;
                    case 7:
                        _h.trys.push([7, 17, 19, 21]);
                        // Store validation options
                        this._vectorOptions = config.vectorOptions;
                        this._metadataSchema = (_c = config.metadata_config) === null || _c === void 0 ? void 0 : _c.schema;
                        this._isLazy = config.lazy || false;
                        this._walEnabled = config.wal || false;
                        this._hnswOptions = config.hnswOptions || {}; // Default to empty options for HNSW
                        if (!this._isLazy) return [3 /*break*/, 11];
                        // Create lazy index structure
                        return [4 /*yield*/, fs.mkdir(path.join(this._folderPath, 'chunks'), { recursive: true })];
                    case 8:
                        // Create lazy index structure
                        _h.sent();
                        manifest = {
                            version: config.version,
                            totalItems: 0,
                            chunks: [],
                            vectorDimensions: undefined,
                            lastModified: new Date().toISOString()
                        };
                        return [4 /*yield*/, AtomicOperations_1.AtomicOperations.writeFile(path.join(this._folderPath, 'manifest.json'), JSON.stringify(manifest, null, 2))];
                    case 9:
                        _h.sent();
                        indexData = {
                            version: config.version,
                            distanceMetric: (_d = config.distanceMetric) !== null && _d !== void 0 ? _d : 'cosine',
                            metadata_config: (_e = config.metadata_config) !== null && _e !== void 0 ? _e : {},
                            vectorOptions: config.vectorOptions,
                            items: [],
                            lazy: true
                        };
                        return [4 /*yield*/, AtomicOperations_1.AtomicOperations.writeFile(path.join(this._folderPath, this._indexName), JSON.stringify(indexData))];
                    case 10:
                        _h.sent();
                        this._lazyIndex = new LazyIndex_1.LazyIndex(this._folderPath, config.lazyOptions);
                        return [3 /*break*/, 13];
                    case 11:
                        indexData = {
                            version: config.version,
                            distanceMetric: (_f = config.distanceMetric) !== null && _f !== void 0 ? _f : 'cosine',
                            metadata_config: (_g = config.metadata_config) !== null && _g !== void 0 ? _g : {},
                            vectorOptions: config.vectorOptions,
                            items: [],
                            wal: this._walEnabled
                        };
                        return [4 /*yield*/, AtomicOperations_1.AtomicOperations.writeFile(path.join(this._folderPath, this._indexName), JSON.stringify(indexData))];
                    case 12:
                        _h.sent();
                        this._data = __assign(__assign({}, indexData), { items: new Map(), wal: this._walEnabled });
                        _h.label = 13;
                    case 13:
                        if (!this._walEnabled) return [3 /*break*/, 15];
                        _a = this;
                        return [4 /*yield*/, WAL_1.walManager.getWAL(this._folderPath, config.walOptions)];
                    case 14:
                        _a._wal = _h.sent();
                        _h.label = 15;
                    case 15:
                        // Initialize operations log
                        _b = this;
                        return [4 /*yield*/, OperationsLog_1.operationsLogManager.getLog(this._folderPath, this._operationsLogName, config.operationLogOptions)];
                    case 16:
                        // Initialize operations log
                        _b._operationsLog = _h.sent();
                        return [3 /*break*/, 21];
                    case 17:
                        err_2 = _h.sent();
                        return [4 /*yield*/, this.deleteIndex()];
                    case 18:
                        _h.sent();
                        throw new Error('Error creating index: ' + err_2.message);
                    case 19: return [4 /*yield*/, lock.release()];
                    case 20:
                        _h.sent();
                        return [7 /*endfinally*/];
                    case 21: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Deletes the index.
     * @remarks
     * This method deletes the index folder from disk.
     */
    LocalIndex.prototype.deleteIndex = function () {
        this._data = undefined;
        return fs.rm(this._folderPath, {
            recursive: true,
            maxRetries: 3
        });
    };
    /**
     * Deletes an item from the index.
     * @param id ID of item to delete.
     */
    LocalIndex.prototype.deleteItem = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._operationQueue.enqueue('delete', { id: id }, 1)];
                    case 1: 
                    // Queue the operation for processing
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Internal method to perform the actual delete
     */
    LocalIndex.prototype.performDelete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var updateInProgress, item, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updateInProgress = !!this._update;
                        if (!!updateInProgress) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.beginUpdate()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 11, , 14]);
                        item = this._update.items.get(id);
                        if (!(item && item.metadataFile)) return [3 /*break*/, 4];
                        // Delete associated metadata file
                        return [4 /*yield*/, CleanupManager_1.CleanupManager.deleteMetadataFile(this._folderPath, item.metadataFile)];
                    case 3:
                        // Delete associated metadata file
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!this._wal) return [3 /*break*/, 6];
                        return [4 /*yield*/, this._wal.writeEntry({
                                id: id,
                                timestamp: Date.now(),
                                operation: 'delete',
                                data: { id: id }
                            })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        if (!this._operationsLog) return [3 /*break*/, 8];
                        return [4 /*yield*/, this._operationsLog.append({
                                operation: 'delete',
                                id: id,
                                timestamp: Date.now()
                            })];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        this._update.items.delete(id);
                        // Remove from HNSW index if available
                        if (this._hnswManager) {
                            try {
                                this._hnswManager.removeVector(id);
                            }
                            catch (err) {
                                console.warn('Failed to remove from HNSW index:', err);
                            }
                        }
                        if (!!updateInProgress) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.endUpdate()];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10: return [3 /*break*/, 14];
                    case 11:
                        err_3 = _a.sent();
                        if (!!updateInProgress) return [3 /*break*/, 13];
                        return [4 /*yield*/, this.cancelUpdate()];
                    case 12:
                        _a.sent();
                        _a.label = 13;
                    case 13: throw err_3;
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Ends an update to the index.
     * @remarks
     * This method saves the index to disk.
     */
    LocalIndex.prototype.endUpdate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var indexData, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._update) {
                            throw new Error('No update in progress');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, 8, 11]);
                        indexData = {
                            version: this._update.version,
                            distanceMetric: this._update.distanceMetric,
                            metadata_config: this._update.metadata_config,
                            vectorOptions: this._update.vectorOptions,
                            items: Array.from(this._update.items.values()),
                            wal: this._walEnabled
                        };
                        return [4 /*yield*/, AtomicOperations_1.AtomicOperations.writeFile(path.join(this._folderPath, this._indexName), JSON.stringify(indexData))];
                    case 2:
                        _a.sent();
                        this._data = this._update;
                        this._update = undefined;
                        if (!this._wal) return [3 /*break*/, 4];
                        return [4 /*yield*/, this._wal.checkpoint()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!(this._hnswManager && this._hnswManager.needsSave())) return [3 /*break*/, 6];
                        return [4 /*yield*/, this._hnswManager.save({ checksumEnabled: true, incrementalSave: true })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [3 /*break*/, 11];
                    case 7:
                        err_4 = _a.sent();
                        throw new Error("Error saving index: ".concat(err_4.toString()));
                    case 8:
                        if (!this._activeLock) return [3 /*break*/, 10];
                        return [4 /*yield*/, this._activeLock.release()];
                    case 9:
                        _a.sent();
                        this._activeLock = undefined;
                        _a.label = 10;
                    case 10: return [7 /*endfinally*/];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Loads an index from disk and returns its stats.
     * @returns Index stats.
     */
    LocalIndex.prototype.getIndexStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadIndexData()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, {
                                version: this._data.version,
                                metadata_config: this._data.metadata_config,
                                items: this._data.items.size
                            }];
                }
            });
        });
    };
    /**
     * Returns an item from the index given its ID.
     * @param id ID of the item to retrieve.
     * @returns Item or undefined if not found.
     */
    LocalIndex.prototype.getItem = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var lock, item, metadataPath, metadata;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, LockManager_1.lockManager.acquireReadLock(this._folderPath)];
                    case 1:
                        lock = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 8, 10]);
                        return [4 /*yield*/, this.loadIndexData()];
                    case 3:
                        _a.sent();
                        if (!(this._isLazy && this._lazyIndex)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this._lazyIndex.getItem(id)];
                    case 4: return [2 /*return*/, _a.sent()];
                    case 5:
                        item = this._data.items.get(id);
                        if (!item) {
                            return [2 /*return*/, undefined];
                        }
                        if (!item.metadataFile) return [3 /*break*/, 7];
                        metadataPath = path.join(this._folderPath, item.metadataFile);
                        return [4 /*yield*/, fs.readFile(metadataPath)];
                    case 6:
                        metadata = _a.sent();
                        return [2 /*return*/, __assign(__assign({}, item), { metadata: JSON.parse(metadata.toString()) })];
                    case 7: return [2 /*return*/, item];
                    case 8: return [4 /*yield*/, lock.release()];
                    case 9:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Adds an item to the index.
     * @remarks
     * A new update is started if one is not already in progress. If an item with the same ID
     * already exists, an error will be thrown.
     * @param item Item to insert.
     * @returns Inserted item.
     */
    LocalIndex.prototype.insertItem = function (item) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._operationQueue.enqueue('insert', { item: item, unique: true }, 1)];
                    case 1: 
                    // Queue the operation for processing
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Internal method to perform the actual insert
     */
    LocalIndex.prototype.performInsert = function (item, unique) {
        return __awaiter(this, void 0, void 0, function () {
            var updateInProgress, newItem, err_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updateInProgress = !!this._update;
                        if (!!updateInProgress) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.beginUpdate()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 10, , 13]);
                        return [4 /*yield*/, this.addItemToUpdate(item, unique)];
                    case 3:
                        newItem = _a.sent();
                        if (!this._wal) return [3 /*break*/, 5];
                        return [4 /*yield*/, this._wal.writeEntry({
                                id: newItem.id,
                                timestamp: Date.now(),
                                operation: unique ? 'insert' : 'update',
                                data: newItem
                            })];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        if (!this._operationsLog) return [3 /*break*/, 7];
                        return [4 /*yield*/, this._operationsLog.append({
                                operation: unique ? 'insert' : 'upsert',
                                item: newItem,
                                timestamp: Date.now()
                            })];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        if (!!updateInProgress) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.endUpdate()];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9: return [2 /*return*/, newItem];
                    case 10:
                        err_5 = _a.sent();
                        if (!!updateInProgress) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.cancelUpdate()];
                    case 11:
                        _a.sent();
                        _a.label = 12;
                    case 12: throw err_5;
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns true if the index exists.
     */
    LocalIndex.prototype.isIndexCreated = function () {
        return __awaiter(this, void 0, void 0, function () {
            var err_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.access(path.join(this._folderPath, this.indexName))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        err_6 = _a.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns all items in the index.
     * @remarks
     * This method loads the index into memory and returns all its items. A copy of the items
     * array is returned so no modifications should be made to the array.
     * @returns Array of all items in the index.
     */
    LocalIndex.prototype.listItems = function () {
        return __awaiter(this, void 0, void 0, function () {
            var lock, items, _a, _b, _c, item, e_1_1;
            var _d, e_1, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0: return [4 /*yield*/, LockManager_1.lockManager.acquireReadLock(this._folderPath)];
                    case 1:
                        lock = _g.sent();
                        _g.label = 2;
                    case 2:
                        _g.trys.push([2, , 17, 19]);
                        return [4 /*yield*/, this.loadIndexData()];
                    case 3:
                        _g.sent();
                        if (!(this._isLazy && this._lazyIndex)) return [3 /*break*/, 16];
                        items = [];
                        _g.label = 4;
                    case 4:
                        _g.trys.push([4, 9, 10, 15]);
                        _a = true, _b = __asyncValues(this._lazyIndex.iterateItems());
                        _g.label = 5;
                    case 5: return [4 /*yield*/, _b.next()];
                    case 6:
                        if (!(_c = _g.sent(), _d = _c.done, !_d)) return [3 /*break*/, 8];
                        _f = _c.value;
                        _a = false;
                        item = _f;
                        items.push(item);
                        _g.label = 7;
                    case 7:
                        _a = true;
                        return [3 /*break*/, 5];
                    case 8: return [3 /*break*/, 15];
                    case 9:
                        e_1_1 = _g.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 15];
                    case 10:
                        _g.trys.push([10, , 13, 14]);
                        if (!(!_a && !_d && (_e = _b.return))) return [3 /*break*/, 12];
                        return [4 /*yield*/, _e.call(_b)];
                    case 11:
                        _g.sent();
                        _g.label = 12;
                    case 12: return [3 /*break*/, 14];
                    case 13:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 14: return [7 /*endfinally*/];
                    case 15: return [2 /*return*/, items];
                    case 16: return [2 /*return*/, Array.from(this._data.items.values())];
                    case 17: return [4 /*yield*/, lock.release()];
                    case 18:
                        _g.sent();
                        return [7 /*endfinally*/];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns all items in the index matching the filter.
     * @remarks
     * This method loads the index into memory and returns all its items matching the filter.
     * @param filter Filter to apply.
     * @returns Array of items matching the filter.
     */
    LocalIndex.prototype.listItemsByMetadata = function (filter) {
        return __awaiter(this, void 0, void 0, function () {
            var lock, filteredItems_1, _a, _b, _c, item, e_2_1, filteredItems, _i, _d, item;
            var _e, e_2, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0: return [4 /*yield*/, LockManager_1.lockManager.acquireReadLock(this._folderPath)];
                    case 1:
                        lock = _h.sent();
                        _h.label = 2;
                    case 2:
                        _h.trys.push([2, , 17, 19]);
                        return [4 /*yield*/, this.loadIndexData()];
                    case 3:
                        _h.sent();
                        if (!(this._isLazy && this._lazyIndex)) return [3 /*break*/, 16];
                        filteredItems_1 = [];
                        _h.label = 4;
                    case 4:
                        _h.trys.push([4, 9, 10, 15]);
                        _a = true, _b = __asyncValues(this._lazyIndex.filterItems(filter));
                        _h.label = 5;
                    case 5: return [4 /*yield*/, _b.next()];
                    case 6:
                        if (!(_c = _h.sent(), _e = _c.done, !_e)) return [3 /*break*/, 8];
                        _g = _c.value;
                        _a = false;
                        item = _g;
                        filteredItems_1.push(item);
                        _h.label = 7;
                    case 7:
                        _a = true;
                        return [3 /*break*/, 5];
                    case 8: return [3 /*break*/, 15];
                    case 9:
                        e_2_1 = _h.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 15];
                    case 10:
                        _h.trys.push([10, , 13, 14]);
                        if (!(!_a && !_e && (_f = _b.return))) return [3 /*break*/, 12];
                        return [4 /*yield*/, _f.call(_b)];
                    case 11:
                        _h.sent();
                        _h.label = 12;
                    case 12: return [3 /*break*/, 14];
                    case 13:
                        if (e_2) throw e_2.error;
                        return [7 /*endfinally*/];
                    case 14: return [7 /*endfinally*/];
                    case 15: return [2 /*return*/, filteredItems_1];
                    case 16:
                        filteredItems = [];
                        for (_i = 0, _d = this._data.items.values(); _i < _d.length; _i++) {
                            item = _d[_i];
                            if (ItemSelector_1.ItemSelector.select(item.metadata, filter)) {
                                filteredItems.push(item);
                            }
                        }
                        return [2 /*return*/, filteredItems];
                    case 17: return [4 /*yield*/, lock.release()];
                    case 18:
                        _h.sent();
                        return [7 /*endfinally*/];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Finds the top k items in the index that are most similar to the vector.
     * @remarks
     * This method loads the index into memory and returns the top k items that are most similar.
     * An optional filter can be applied to the metadata of the items.
     * @param vector Vector to query against.
     * @param topK Number of items to return.
     * @param filter Optional. Filter to apply.
     * @returns Similar items to the vector that matche the supplied filter.
     */
    LocalIndex.prototype.queryItems = function (vector_1, query_1, topK_1, filter_1, isBm25_1) {
        return __awaiter(this, arguments, void 0, function (vector, query, topK, filter, isBm25, alpha) {
            var lock, items_1, vectorScores_1, results, norm, distances, i, item, distance, norm, distances, i, item, distance, bm25Scores_1, currDoc, currDocTxt, i, item, startPos, endPos, chunkText, results, combinedScores, _i, _a, id, vectorScore, bm25Score, sortedScores, top_2, _b, top_1, item, metadataPath, metadata;
            var _this = this;
            var _c, _d;
            if (alpha === void 0) { alpha = 1.0; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, LockManager_1.lockManager.acquireReadLock(this._folderPath)];
                    case 1:
                        lock = _e.sent();
                        _e.label = 2;
                    case 2:
                        _e.trys.push([2, , 14, 16]);
                        return [4 /*yield*/, this.loadIndexData()];
                    case 3:
                        _e.sent();
                        items_1 = Array.from(this._data.items.values());
                        if (filter) {
                            items_1 = items_1.filter(function (i) { return ItemSelector_1.ItemSelector.select(i.metadata, filter); });
                        }
                        vectorScores_1 = new Map();
                        if (this._hnswManager) {
                            try {
                                results = this._hnswManager.searchKNN(vector, topK);
                                results.forEach(function (result) {
                                    // Convert distance to similarity score (1 - normalized distance)
                                    var similarity = _this._data.distanceMetric === 'cosine'
                                        ? 1 - result.distance
                                        : 1 / (1 + result.distance); // For L2 and IP distances
                                    vectorScores_1.set(result.id, similarity);
                                });
                            }
                            catch (err) {
                                console.warn('HNSW search failed, falling back to brute force:', err);
                                norm = ItemSelector_1.ItemSelector.normalize(vector);
                                distances = [];
                                for (i = 0; i < items_1.length; i++) {
                                    item = items_1[i];
                                    distance = ItemSelector_1.ItemSelector.normalizedCosineSimilarity(vector, norm, item.vector, item.norm);
                                    distances.push({ id: item.id, distance: distance });
                                }
                                distances.sort(function (a, b) { return b.distance - a.distance; });
                                distances.slice(0, topK).forEach(function (d) {
                                    vectorScores_1.set(d.id, d.distance);
                                });
                            }
                        }
                        else {
                            norm = ItemSelector_1.ItemSelector.normalize(vector);
                            distances = [];
                            for (i = 0; i < items_1.length; i++) {
                                item = items_1[i];
                                distance = ItemSelector_1.ItemSelector.normalizedCosineSimilarity(vector, norm, item.vector, item.norm);
                                distances.push({ id: item.id, distance: distance });
                            }
                            distances.sort(function (a, b) { return b.distance - a.distance; });
                            distances.slice(0, topK).forEach(function (d) {
                                vectorScores_1.set(d.id, d.distance);
                            });
                        }
                        bm25Scores_1 = new Map();
                        if (!isBm25) return [3 /*break*/, 9];
                        this.setupbm25();
                        currDoc = void 0;
                        currDocTxt = void 0;
                        i = 0;
                        _e.label = 4;
                    case 4:
                        if (!(i < items_1.length)) return [3 /*break*/, 7];
                        item = items_1[i];
                        currDoc = new LocalDocument_1.LocalDocument(this, item.metadata.documentId.toString(), '');
                        return [4 /*yield*/, currDoc.loadText()];
                    case 5:
                        currDocTxt = _e.sent();
                        startPos = item.metadata.startPos;
                        endPos = item.metadata.endPos;
                        chunkText = currDocTxt.substring(Number(startPos), Number(endPos) + 1);
                        this._bm25Engine.addDoc({ body: chunkText }, i);
                        _e.label = 6;
                    case 6:
                        i++;
                        return [3 /*break*/, 4];
                    case 7:
                        this._bm25Engine.consolidate();
                        return [4 /*yield*/, this.bm25Search(query, items_1, topK)];
                    case 8:
                        results = _e.sent();
                        results.forEach(function (res) {
                            bm25Scores_1.set(items_1[res[0]].id, res[1]);
                        });
                        _e.label = 9;
                    case 9:
                        combinedScores = new Map();
                        for (_i = 0, _a = new Set(__spreadArray(__spreadArray([], vectorScores_1.keys(), true), bm25Scores_1.keys(), true)); _i < _a.length; _i++) {
                            id = _a[_i];
                            vectorScore = (_c = vectorScores_1.get(id)) !== null && _c !== void 0 ? _c : 0;
                            bm25Score = (_d = bm25Scores_1.get(id)) !== null && _d !== void 0 ? _d : 0;
                            combinedScores.set(id, alpha * vectorScore + (1 - alpha) * bm25Score);
                        }
                        sortedScores = Array.from(combinedScores.entries()).sort(function (a, b) { return b[1] - a[1]; });
                        top_2 = sortedScores.slice(0, topK).map(function (d) {
                            var item = _this._data.items.get(d[0]);
                            return {
                                item: Object.assign({}, item),
                                score: d[1]
                            };
                        });
                        _b = 0, top_1 = top_2;
                        _e.label = 10;
                    case 10:
                        if (!(_b < top_1.length)) return [3 /*break*/, 13];
                        item = top_1[_b];
                        if (!item.item.metadataFile) return [3 /*break*/, 12];
                        metadataPath = path.join(this._folderPath, item.item.metadataFile);
                        return [4 /*yield*/, fs.readFile(metadataPath)];
                    case 11:
                        metadata = _e.sent();
                        item.item.metadata = JSON.parse(metadata.toString());
                        _e.label = 12;
                    case 12:
                        _b++;
                        return [3 /*break*/, 10];
                    case 13: return [2 /*return*/, top_2];
                    case 14: return [4 /*yield*/, lock.release()];
                    case 15:
                        _e.sent();
                        return [7 /*endfinally*/];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    LocalIndex.prototype.snapshot = function (snapshotFolderPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this._update) {
                            throw new Error('Cannot snapshot while an update is in progress');
                        }
                        return [4 /*yield*/, fs.mkdir(snapshotFolderPath, { recursive: true })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, fs.cp(this._folderPath, snapshotFolderPath, { recursive: true })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Adds or replaces an item in the index.
     * @remarks
     * A new update is started if one is not already in progress. If an item with the same ID
     * already exists, it will be replaced.
     * @param item Item to insert or replace.
     * @returns Upserted item.
     */
    LocalIndex.prototype.upsertItem = function (item) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._operationQueue.enqueue('insert', { item: item, unique: false }, 1)];
                    case 1: 
                    // Queue the operation for processing
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Waits for all queued operations to complete.
     */
    LocalIndex.prototype.flush = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._operationQueue.drain()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Performs cleanup of orphaned metadata files
     */
    LocalIndex.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadIndexData()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, CleanupManager_1.CleanupManager.performFullCleanup(this._folderPath, this._data.items)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Validates metadata file integrity
     */
    LocalIndex.prototype.validateMetadataFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadIndexData()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, CleanupManager_1.CleanupManager.validateMetadataFiles(this._folderPath, this._data.items)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Gets metadata storage statistics
     */
    LocalIndex.prototype.getMetadataStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadIndexData()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, CleanupManager_1.CleanupManager.getMetadataStorageStats(this._folderPath, this._data.items)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Ensures that the index has been loaded into memory.
     */
    LocalIndex.prototype.loadIndexData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, indexData, _a, _b, logEntries, _i, logEntries_1, op, _c, err_7, items, firstItem, dim;
            var _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (this._data || this._lazyIndex) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.isIndexCreated()];
                    case 1:
                        if (!(_f.sent())) {
                            throw new Error('Index does not exist');
                        }
                        return [4 /*yield*/, fs.readFile(path.join(this._folderPath, this.indexName))];
                    case 2:
                        data = _f.sent();
                        indexData = JSON.parse(data.toString());
                        // Check if this is a lazy index
                        if (indexData.lazy) {
                            this._isLazy = true;
                            this._lazyIndex = new LazyIndex_1.LazyIndex(this._folderPath);
                            this._vectorOptions = indexData.vectorOptions;
                            this._metadataSchema = (_d = indexData.metadata_config) === null || _d === void 0 ? void 0 : _d.schema;
                            return [2 /*return*/];
                        }
                        this._data = __assign(__assign({}, indexData), { items: new Map(indexData.items.map(function (i) { return [i.id, i]; })), wal: indexData.wal });
                        // Load validation options
                        this._vectorOptions = indexData.vectorOptions;
                        this._metadataSchema = (_e = indexData.metadata_config) === null || _e === void 0 ? void 0 : _e.schema;
                        this._walEnabled = indexData.wal || false;
                        if (!this._walEnabled) return [3 /*break*/, 4];
                        _a = this;
                        return [4 /*yield*/, WAL_1.walManager.getWAL(this._folderPath)];
                    case 3:
                        _a._wal = _f.sent();
                        _f.label = 4;
                    case 4:
                        // Initialize operations log
                        _b = this;
                        return [4 /*yield*/, OperationsLog_1.operationsLogManager.getLog(this._folderPath, this._operationsLogName)];
                    case 5:
                        // Initialize operations log
                        _b._operationsLog = _f.sent();
                        return [4 /*yield*/, this._operationsLog.readEntries()];
                    case 6:
                        logEntries = _f.sent();
                        for (_i = 0, logEntries_1 = logEntries; _i < logEntries_1.length; _i++) {
                            op = logEntries_1[_i];
                            switch (op.operation) {
                                case 'insert':
                                case 'upsert':
                                    if (op.item) {
                                        this._data.items.set(op.item.id, op.item);
                                    }
                                    break;
                                case 'delete':
                                    if (op.id) {
                                        this._data.items.delete(op.id);
                                    }
                                    break;
                            }
                        }
                        // Initialize HNSW manager
                        _c = this;
                        return [4 /*yield*/, HNSWManager_1.hnswIndexManager.getIndex(this._folderPath)];
                    case 7:
                        // Initialize HNSW manager
                        _c._hnswManager = _f.sent();
                        _f.label = 8;
                    case 8:
                        _f.trys.push([8, 10, , 14]);
                        return [4 /*yield*/, this._hnswManager.load({ checksumEnabled: true })];
                    case 9:
                        _f.sent();
                        console.log('Loaded existing HNSW index');
                        return [3 /*break*/, 14];
                    case 10:
                        err_7 = _f.sent();
                        if (!(this._data.items.size > 0)) return [3 /*break*/, 13];
                        console.log('Building HNSW index...');
                        items = Array.from(this._data.items.entries()).map(function (_a) {
                            var id = _a[0], item = _a[1];
                            return ({
                                id: id,
                                vector: item.vector
                            });
                        });
                        firstItem = this._data.items.values().next().value;
                        dim = firstItem.vector.length;
                        return [4 /*yield*/, this._hnswManager.buildFromItems(items, dim, this._data.distanceMetric, this._hnswOptions, function (progress) {
                                if (progress % 10 === 0) {
                                    console.log("HNSW build progress: ".concat(progress, "%"));
                                }
                            })];
                    case 11:
                        _f.sent();
                        // Save the built index
                        return [4 /*yield*/, this._hnswManager.save({ checksumEnabled: true })];
                    case 12:
                        // Save the built index
                        _f.sent();
                        _f.label = 13;
                    case 13: return [3 /*break*/, 14];
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    LocalIndex.prototype.addItemToUpdate = function (item, unique) {
        return __awaiter(this, void 0, void 0, function () {
            var id, metadata, metadataFile, _i, _a, key, metadataPath, newItem, stats, err_8;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        // Ensure vector is provided
                        if (!item.vector) {
                            throw new Error('Vector is required');
                        }
                        // Always validate vector (with or without options)
                        try {
                            Validator_1.Validator.validateVector(item.vector, this._vectorOptions || {});
                        }
                        catch (err) {
                            if (err instanceof Validator_1.ValidationError) {
                                throw new Error("Vector validation failed: ".concat(err.message));
                            }
                            throw err;
                        }
                        // Validate metadata (always check for basic rules, schema optional)
                        if (item.metadata) {
                            try {
                                Validator_1.Validator.validateMetadata(item.metadata, this._metadataSchema);
                            }
                            catch (err) {
                                if (err instanceof Validator_1.ValidationError) {
                                    throw new Error("Metadata validation failed: ".concat(err.message));
                                }
                                throw err;
                            }
                        }
                        id = (_b = item.id) !== null && _b !== void 0 ? _b : (0, uuid_1.v4)();
                        if (unique) {
                            if (this._update.items.has(id)) {
                                throw new Error("Item with id ".concat(id, " already exists"));
                            }
                        }
                        metadata = {};
                        if (!(this._update.metadata_config.indexed && this._update.metadata_config.indexed.length > 0 && item.metadata)) return [3 /*break*/, 2];
                        // Copy only indexed metadata
                        for (_i = 0, _a = this._update.metadata_config.indexed; _i < _a.length; _i++) {
                            key = _a[_i];
                            if (item.metadata && item.metadata[key]) {
                                metadata[key] = item.metadata[key];
                            }
                        }
                        // Save remaining metadata to disk
                        metadataFile = "".concat((0, uuid_1.v4)(), ".json");
                        metadataPath = path.join(this._folderPath, metadataFile);
                        return [4 /*yield*/, fs.writeFile(metadataPath, JSON.stringify(item.metadata))];
                    case 1:
                        _d.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        if (item.metadata) {
                            metadata = item.metadata;
                        }
                        _d.label = 3;
                    case 3:
                        newItem = {
                            id: id,
                            metadata: metadata,
                            vector: item.vector,
                            norm: ItemSelector_1.ItemSelector.normalize(item.vector)
                        };
                        if (metadataFile) {
                            newItem.metadataFile = metadataFile;
                        }
                        // Add item to index
                        this._update.items.set(id, newItem);
                        if (!this._hnswManager) return [3 /*break*/, 9];
                        _d.label = 4;
                    case 4:
                        _d.trys.push([4, 8, , 9]);
                        return [4 /*yield*/, this._hnswManager.getStats().catch(function () { return null; })];
                    case 5:
                        stats = _d.sent();
                        if (!(!stats || stats.capacity === 0)) return [3 /*break*/, 7];
                        // Initialize HNSW if not already done
                        return [4 /*yield*/, this._hnswManager.initializeIndex(item.vector.length, this._update.distanceMetric, this._hnswOptions)];
                    case 6:
                        // Initialize HNSW if not already done
                        _d.sent();
                        _d.label = 7;
                    case 7:
                        this._hnswManager.addVector(id, item.vector);
                        return [3 /*break*/, 9];
                    case 8:
                        err_8 = _d.sent();
                        if ((_c = err_8.message) === null || _c === void 0 ? void 0 : _c.includes('already exists')) {
                            // Update existing vector
                            this._hnswManager.updateVector(id, item.vector);
                        }
                        else {
                            console.warn('Failed to update HNSW index:', err_8);
                        }
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/, newItem];
                }
            });
        });
    };
    LocalIndex.prototype.setupbm25 = function () {
        return __awaiter(this, void 0, void 0, function () {
            var nlp, its, prepTask;
            return __generator(this, function (_a) {
                this._bm25Engine = (0, wink_bm25_text_search_1.default)();
                nlp = (0, wink_nlp_1.default)(wink_eng_lite_web_model_1.default);
                its = nlp.its;
                prepTask = function (text) {
                    var tokens = [];
                    nlp.readDoc(text)
                        .tokens()
                        // Use only words ignoring punctuations etc and from them remove stop words
                        .filter(function (t) { return (t.out(its.type) === 'word' && !t.out(its.stopWordFlag)); })
                        // Handle negation and extract stem of the word
                        .each(function (t) { return tokens.push((t.out(its.negationFlag)) ? '!' + t.out(its.stem) : t.out(its.stem)); });
                    return tokens;
                };
                this._bm25Engine.defineConfig({ fldWeights: { body: 1 } });
                // Step II: Define PrepTasks pipe.
                this._bm25Engine.definePrepTasks([prepTask]);
                return [2 /*return*/];
            });
        });
    };
    LocalIndex.prototype.bm25Search = function (searchQuery, items, topK) {
        return __awaiter(this, void 0, void 0, function () {
            var query, results;
            return __generator(this, function (_a) {
                query = searchQuery;
                results = this._bm25Engine.search(query);
                return [2 /*return*/, results.slice(0, topK)];
            });
        });
    };
    /**
     * Compact the operations log
     */
    LocalIndex.prototype.compactOperationsLog = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._operationsLog) {
                            throw new Error('Operations log not initialized');
                        }
                        return [4 /*yield*/, this._operationsLog.compact()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Rotate the operations log
     */
    LocalIndex.prototype.rotateOperationsLog = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._operationsLog) {
                            throw new Error('Operations log not initialized');
                        }
                        return [4 /*yield*/, this._operationsLog.rotate()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get operations log statistics
     */
    LocalIndex.prototype.getOperationsLogStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._operationsLog) {
                            throw new Error('Operations log not initialized');
                        }
                        return [4 /*yield*/, this._operationsLog.getStats()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    LocalIndex.prototype.compact = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cleanupStats, indexData, tempPath, compactionResult, err_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this._update) {
                            throw new Error('Cannot compact while an update is in progress');
                        }
                        return [4 /*yield*/, this.loadIndexData()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, CleanupManager_1.CleanupManager.performFullCleanup(this._folderPath, this._data.items)];
                    case 2:
                        cleanupStats = _a.sent();
                        indexData = {
                            version: this._data.version,
                            distanceMetric: this._data.distanceMetric,
                            metadata_config: this._data.metadata_config,
                            vectorOptions: this._data.vectorOptions,
                            items: Array.from(this._data.items.values())
                        };
                        tempPath = path.join(this._folderPath, "".concat(this._indexName, ".tmp"));
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 9, , 11]);
                        return [4 /*yield*/, AtomicOperations_1.AtomicOperations.writeFile(tempPath, JSON.stringify(indexData))];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, fs.rename(tempPath, path.join(this._folderPath, this._indexName))];
                    case 5:
                        _a.sent();
                        if (!this._operationsLog) return [3 /*break*/, 7];
                        return [4 /*yield*/, this._operationsLog.compact()];
                    case 6:
                        compactionResult = _a.sent();
                        console.log("Operations log compacted: ".concat(compactionResult.originalEntries, " -> ").concat(compactionResult.compactedEntries, " entries"));
                        _a.label = 7;
                    case 7: 
                    // Clean up old backup files
                    return [4 /*yield*/, CleanupManager_1.CleanupManager.cleanupOldBackups(this._folderPath)];
                    case 8:
                        // Clean up old backup files
                        _a.sent();
                        return [2 /*return*/, cleanupStats];
                    case 9:
                        err_9 = _a.sent();
                        // Attempt to clean up the temporary file if an error occurs
                        return [4 /*yield*/, fs.unlink(tempPath).catch(function () { })];
                    case 10:
                        // Attempt to clean up the temporary file if an error occurs
                        _a.sent();
                        throw err_9;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Converts the index to lazy loading format
     */
    LocalIndex.prototype.convertToLazy = function () {
        return __awaiter(this, arguments, void 0, function (chunkSize) {
            var outputPath, indexData, err_10;
            if (chunkSize === void 0) { chunkSize = 1000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this._update) {
                            throw new Error('Cannot convert to lazy while an update is in progress');
                        }
                        return [4 /*yield*/, this.loadIndexData()];
                    case 1:
                        _a.sent();
                        outputPath = path.join(this._folderPath, '.lazy_temp');
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 8, , 10]);
                        // Create lazy index in temporary directory
                        return [4 /*yield*/, LazyIndex_1.LazyIndex.createFromIndex(this._folderPath, outputPath, chunkSize)];
                    case 3:
                        // Create lazy index in temporary directory
                        _a.sent();
                        // Move chunks directory
                        return [4 /*yield*/, fs.rename(path.join(outputPath, 'chunks'), path.join(this._folderPath, 'chunks'))];
                    case 4:
                        // Move chunks directory
                        _a.sent();
                        return [4 /*yield*/, fs.rename(path.join(outputPath, 'manifest.json'), path.join(this._folderPath, 'manifest.json'))];
                    case 5:
                        _a.sent();
                        indexData = {
                            version: this._data.version,
                            distanceMetric: this._data.distanceMetric,
                            metadata_config: this._data.metadata_config,
                            vectorOptions: this._data.vectorOptions,
                            items: [],
                            lazy: true
                        };
                        return [4 /*yield*/, AtomicOperations_1.AtomicOperations.writeFile(path.join(this._folderPath, this._indexName), JSON.stringify(indexData))];
                    case 6:
                        _a.sent();
                        // Clean up temp directory
                        return [4 /*yield*/, fs.rmdir(outputPath)];
                    case 7:
                        // Clean up temp directory
                        _a.sent();
                        // Initialize lazy index
                        this._isLazy = true;
                        this._lazyIndex = new LazyIndex_1.LazyIndex(this._folderPath);
                        this._data = undefined;
                        return [3 /*break*/, 10];
                    case 8:
                        err_10 = _a.sent();
                        // Clean up on error
                        return [4 /*yield*/, fs.rm(outputPath, { recursive: true }).catch(function () { })];
                    case 9:
                        // Clean up on error
                        _a.sent();
                        throw err_10;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Recover index from WAL
     */
    LocalIndex.prototype.recoverFromWAL = function () {
        return __awaiter(this, void 0, void 0, function () {
            var replayedCount;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadIndexData()];
                    case 1:
                        _a.sent();
                        if (!this._walEnabled || !this._wal) {
                            throw new Error("WAL is not enabled for this index. walEnabled: ".concat(this._walEnabled, ", wal: ").concat(!!this._wal));
                        }
                        // Clear current data
                        this._data.items.clear();
                        return [4 /*yield*/, this._wal.replay(function (entry) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (entry.operation) {
                                        case 'insert':
                                        case 'update':
                                            this._data.items.set(entry.id, entry.data);
                                            break;
                                        case 'delete':
                                            this._data.items.delete(entry.id);
                                            break;
                                    }
                                    return [2 /*return*/];
                                });
                            }); })];
                    case 2:
                        replayedCount = _a.sent();
                        if (!(replayedCount > 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.beginUpdate()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.endUpdate()];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/, replayedCount];
                }
            });
        });
    };
    /**
     * Get WAL statistics
     */
    LocalIndex.prototype.getWALStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this._walEnabled || !this._wal) {
                    throw new Error('WAL is not enabled for this index');
                }
                return [2 /*return*/, this._wal.getStats()];
            });
        });
    };
    /**
     * Clean up old WAL files
     */
    LocalIndex.prototype.cleanupWAL = function () {
        return __awaiter(this, arguments, void 0, function (keepFiles) {
            if (keepFiles === void 0) { keepFiles = 2; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._walEnabled || !this._wal) {
                            throw new Error('WAL is not enabled for this index');
                        }
                        return [4 /*yield*/, this._wal.cleanup(keepFiles)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Close WAL and cleanup resources
     */
    LocalIndex.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._wal) return [3 /*break*/, 2];
                        return [4 /*yield*/, WAL_1.walManager.closeWAL(this._folderPath)];
                    case 1:
                        _a.sent();
                        this._wal = undefined;
                        _a.label = 2;
                    case 2:
                        // Operations log is managed by the manager, no need to close
                        this._operationsLog = undefined;
                        if (!this._hnswManager) return [3 /*break*/, 6];
                        if (!this._hnswManager.needsSave()) return [3 /*break*/, 4];
                        return [4 /*yield*/, this._hnswManager.save({ checksumEnabled: true })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [4 /*yield*/, HNSWManager_1.hnswIndexManager.closeIndex(this._folderPath)];
                    case 5:
                        _a.sent();
                        this._hnswManager = undefined;
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Rebuild HNSW index
     */
    LocalIndex.prototype.rebuildHNSWIndex = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, items, firstItem, dim;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.loadIndexData()];
                    case 1:
                        _b.sent();
                        if (!!this._hnswManager) return [3 /*break*/, 3];
                        _a = this;
                        return [4 /*yield*/, HNSWManager_1.hnswIndexManager.getIndex(this._folderPath)];
                    case 2:
                        _a._hnswManager = _b.sent();
                        _b.label = 3;
                    case 3:
                        if (this._data.items.size === 0) {
                            console.log('No items to index');
                            return [2 /*return*/];
                        }
                        console.log('Rebuilding HNSW index...');
                        items = Array.from(this._data.items.entries()).map(function (_a) {
                            var id = _a[0], item = _a[1];
                            return ({
                                id: id,
                                vector: item.vector
                            });
                        });
                        firstItem = this._data.items.values().next().value;
                        dim = firstItem.vector.length;
                        return [4 /*yield*/, this._hnswManager.buildFromItems(items, dim, this._data.distanceMetric, options || this._hnswOptions, function (progress) {
                                if (progress % 10 === 0) {
                                    console.log("HNSW rebuild progress: ".concat(progress, "%"));
                                }
                            })];
                    case 4:
                        _b.sent();
                        return [4 /*yield*/, this._hnswManager.save({ checksumEnabled: true })];
                    case 5:
                        _b.sent();
                        console.log('HNSW index rebuilt successfully');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get HNSW index statistics
     */
    LocalIndex.prototype.getHNSWStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this._hnswManager) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, HNSWManager_1.hnswIndexManager.getIndex(this._folderPath)];
                    case 1:
                        _a._hnswManager = _b.sent();
                        _b.label = 2;
                    case 2: return [4 /*yield*/, this._hnswManager.getStats()];
                    case 3: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    /**
     * Optimize HNSW index for search
     */
    LocalIndex.prototype.optimizeHNSWIndex = function (ef) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this._hnswManager) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, HNSWManager_1.hnswIndexManager.getIndex(this._folderPath)];
                    case 1:
                        _a._hnswManager = _b.sent();
                        _b.label = 2;
                    case 2: return [4 /*yield*/, this._hnswManager.optimize(ef)];
                    case 3:
                        _b.sent();
                        console.log('HNSW index optimized');
                        return [2 /*return*/];
                }
            });
        });
    };
    return LocalIndex;
}());
exports.LocalIndex = LocalIndex;
