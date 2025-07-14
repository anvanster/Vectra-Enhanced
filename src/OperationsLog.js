"use strict";
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
exports.operationsLogManager = exports.OperationsLogManager = exports.OperationsLog = void 0;
var fs = __importStar(require("fs/promises"));
var path = __importStar(require("path"));
var fs_1 = require("fs");
var promises_1 = require("stream/promises");
var AtomicOperations_1 = require("./AtomicOperations");
var zlib = __importStar(require("zlib"));
var OperationsLog = /** @class */ (function () {
    function OperationsLog(folderPath, logName, options) {
        if (logName === void 0) { logName = 'operations.log'; }
        if (options === void 0) { options = {}; }
        this.currentSize = 0;
        this.entryCount = 0;
        this.folderPath = folderPath;
        this.logName = logName;
        this.options = {
            maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB
            maxAge: options.maxAge || 7 * 24 * 60 * 60 * 1000, // 7 days
            maxFiles: options.maxFiles || 5,
            compressionEnabled: options.compressionEnabled !== false
        };
    }
    /**
     * Initialize the operations log
     */
    OperationsLog.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadStats()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Append an operation to the log
     */
    OperationsLog.prototype.append = function (entry) {
        return __awaiter(this, void 0, void 0, function () {
            var logPath, entryData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Add timestamp if not provided
                        if (entry.timestamp === undefined) {
                            entry.timestamp = Date.now();
                        }
                        return [4 /*yield*/, this.shouldRotate()];
                    case 1:
                        if (!_a.sent()) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.rotate()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        logPath = path.join(this.folderPath, this.logName);
                        entryData = JSON.stringify(entry) + '\n';
                        return [4 /*yield*/, fs.appendFile(logPath, entryData)];
                    case 4:
                        _a.sent();
                        // Update stats
                        this.currentSize += Buffer.byteLength(entryData);
                        this.entryCount++;
                        if (!this.oldestTimestamp) {
                            this.oldestTimestamp = entry.timestamp;
                        }
                        this.newestTimestamp = entry.timestamp;
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Read all entries from the log
     */
    OperationsLog.prototype.readEntries = function () {
        return __awaiter(this, void 0, void 0, function () {
            var logPath, content, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logPath = path.join(this.folderPath, this.logName);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs.readFile(logPath, 'utf-8')];
                    case 2:
                        content = _a.sent();
                        return [2 /*return*/, content
                                .trim()
                                .split('\n')
                                .filter(function (line) { return line; })
                                .map(function (line) {
                                try {
                                    return JSON.parse(line);
                                }
                                catch (_a) {
                                    console.warn("Invalid log entry: ".concat(line));
                                    return null;
                                }
                            })
                                .filter(function (entry) { return entry !== null; })];
                    case 3:
                        err_1 = _a.sent();
                        if (err_1.code === 'ENOENT') {
                            return [2 /*return*/, []];
                        }
                        throw err_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Compact the operations log
     */
    OperationsLog.prototype.compact = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, entries, itemState, deletedItems, _i, entries_1, entry, compactedEntries, _a, _b, item, originalSize, tempPath, compactedData, logPath, newSize;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        startTime = Date.now();
                        return [4 /*yield*/, this.readEntries()];
                    case 1:
                        entries = _c.sent();
                        if (entries.length === 0) {
                            return [2 /*return*/, {
                                    originalEntries: 0,
                                    compactedEntries: 0,
                                    bytesReclaimed: 0,
                                    duration: Date.now() - startTime
                                }];
                        }
                        itemState = new Map();
                        deletedItems = new Set();
                        for (_i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                            entry = entries_1[_i];
                            switch (entry.operation) {
                                case 'insert':
                                case 'upsert':
                                    if (entry.item) {
                                        itemState.set(entry.item.id, entry.item);
                                        deletedItems.delete(entry.item.id);
                                    }
                                    break;
                                case 'delete':
                                    if (entry.id) {
                                        itemState.delete(entry.id);
                                        deletedItems.add(entry.id);
                                    }
                                    break;
                            }
                        }
                        compactedEntries = [];
                        // Add all current items as inserts
                        for (_a = 0, _b = itemState.values(); _a < _b.length; _a++) {
                            item = _b[_a];
                            compactedEntries.push({
                                operation: 'insert',
                                timestamp: Date.now(),
                                item: item
                            });
                        }
                        originalSize = this.currentSize;
                        tempPath = path.join(this.folderPath, "".concat(this.logName, ".compact"));
                        compactedData = compactedEntries.map(function (e) { return JSON.stringify(e); }).join('\n') + '\n';
                        return [4 /*yield*/, AtomicOperations_1.AtomicOperations.writeFile(tempPath, compactedData)];
                    case 2:
                        _c.sent();
                        logPath = path.join(this.folderPath, this.logName);
                        return [4 /*yield*/, fs.rename(tempPath, logPath)];
                    case 3:
                        _c.sent();
                        newSize = Buffer.byteLength(compactedData);
                        this.currentSize = newSize;
                        this.entryCount = compactedEntries.length;
                        this.oldestTimestamp = compactedEntries.length > 0 ? Date.now() : undefined;
                        this.newestTimestamp = compactedEntries.length > 0 ? Date.now() : undefined;
                        return [2 /*return*/, {
                                originalEntries: entries.length,
                                compactedEntries: compactedEntries.length,
                                bytesReclaimed: originalSize - newSize,
                                duration: Date.now() - startTime
                            }];
                }
            });
        });
    };
    /**
     * Rotate the operations log
     */
    OperationsLog.prototype.rotate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var logPath, _a, rotatedFiles, nextNumber, timestamp, rotatedName, rotatedPath;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logPath = path.join(this.folderPath, this.logName);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs.access(logPath)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        return [2 /*return*/]; // No log to rotate
                    case 4: return [4 /*yield*/, this.getRotatedFiles()];
                    case 5:
                        rotatedFiles = _b.sent();
                        nextNumber = rotatedFiles.length > 0
                            ? Math.max.apply(Math, rotatedFiles.map(function (f) { return _this.extractRotationNumber(f); })) + 1
                            : 1;
                        timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
                        rotatedName = "".concat(this.logName, ".").concat(nextNumber, ".").concat(timestamp);
                        rotatedPath = path.join(this.folderPath, rotatedName);
                        // Move current log to rotated
                        return [4 /*yield*/, fs.rename(logPath, rotatedPath)];
                    case 6:
                        // Move current log to rotated
                        _b.sent();
                        if (!this.options.compressionEnabled) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.compressFile(rotatedPath)];
                    case 7:
                        _b.sent();
                        return [4 /*yield*/, fs.unlink(rotatedPath)];
                    case 8:
                        _b.sent();
                        _b.label = 9;
                    case 9: 
                    // Clean up old rotated files
                    return [4 /*yield*/, this.cleanupRotatedFiles()];
                    case 10:
                        // Clean up old rotated files
                        _b.sent();
                        // Reset stats
                        this.currentSize = 0;
                        this.entryCount = 0;
                        this.oldestTimestamp = undefined;
                        this.newestTimestamp = undefined;
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Truncate the operations log
     */
    OperationsLog.prototype.truncate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var logPath, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logPath = path.join(this.folderPath, this.logName);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs.truncate(logPath)];
                    case 2:
                        _a.sent();
                        this.currentSize = 0;
                        this.entryCount = 0;
                        this.oldestTimestamp = undefined;
                        this.newestTimestamp = undefined;
                        return [3 /*break*/, 4];
                    case 3:
                        err_2 = _a.sent();
                        if (err_2.code !== 'ENOENT') {
                            throw err_2;
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get statistics about the operations log
     */
    OperationsLog.prototype.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var rotatedFiles;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRotatedFiles()];
                    case 1:
                        rotatedFiles = _a.sent();
                        return [2 /*return*/, {
                                currentSize: this.currentSize,
                                entryCount: this.entryCount,
                                oldestEntry: this.oldestTimestamp,
                                newestEntry: this.newestTimestamp,
                                rotatedFiles: rotatedFiles.length
                            }];
                }
            });
        });
    };
    /**
     * Merge multiple operation logs
     */
    OperationsLog.merge = function (logs_1, outputPath_1) {
        return __awaiter(this, arguments, void 0, function (logs, outputPath, outputName) {
            var allEntries, _i, logs_2, log, entries, mergedPath, mergedData;
            if (outputName === void 0) { outputName = 'operations.log'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        allEntries = [];
                        _i = 0, logs_2 = logs;
                        _a.label = 1;
                    case 1:
                        if (!(_i < logs_2.length)) return [3 /*break*/, 4];
                        log = logs_2[_i];
                        return [4 /*yield*/, log.readEntries()];
                    case 2:
                        entries = _a.sent();
                        allEntries.push.apply(allEntries, entries);
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        // Sort by timestamp
                        allEntries.sort(function (a, b) { return (a.timestamp || 0) - (b.timestamp || 0); });
                        mergedPath = path.join(outputPath, outputName);
                        mergedData = allEntries.map(function (e) { return JSON.stringify(e); }).join('\n') + '\n';
                        return [4 /*yield*/, AtomicOperations_1.AtomicOperations.writeFile(mergedPath, mergedData)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    OperationsLog.prototype.loadStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var logPath, stats, entries, timestamps, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logPath = path.join(this.folderPath, this.logName);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fs.stat(logPath)];
                    case 2:
                        stats = _a.sent();
                        this.currentSize = stats.size;
                        return [4 /*yield*/, this.readEntries()];
                    case 3:
                        entries = _a.sent();
                        this.entryCount = entries.length;
                        if (entries.length > 0) {
                            timestamps = entries
                                .map(function (e) { return e.timestamp; })
                                .filter(function (t) { return t !== undefined; });
                            if (timestamps.length > 0) {
                                this.oldestTimestamp = Math.min.apply(Math, timestamps);
                                this.newestTimestamp = Math.max.apply(Math, timestamps);
                            }
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        err_3 = _a.sent();
                        if (err_3.code !== 'ENOENT') {
                            throw err_3;
                        }
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    OperationsLog.prototype.shouldRotate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var age;
            return __generator(this, function (_a) {
                // Check size
                if (this.currentSize >= this.options.maxSize) {
                    return [2 /*return*/, true];
                }
                // Check age
                if (this.oldestTimestamp) {
                    age = Date.now() - this.oldestTimestamp;
                    if (age >= this.options.maxAge) {
                        return [2 /*return*/, true];
                    }
                }
                return [2 /*return*/, false];
            });
        });
    };
    OperationsLog.prototype.getRotatedFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files, pattern_1, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.readdir(this.folderPath)];
                    case 1:
                        files = _b.sent();
                        pattern_1 = new RegExp("^".concat(this.logName, "\\.\\d+\\."));
                        return [2 /*return*/, files
                                .filter(function (f) { return pattern_1.test(f); })
                                .sort(function (a, b) {
                                var numA = _this.extractRotationNumber(a);
                                var numB = _this.extractRotationNumber(b);
                                return numA - numB;
                            })];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OperationsLog.prototype.extractRotationNumber = function (filename) {
        var match = filename.match(/\.(\d+)\./);
        return match ? parseInt(match[1], 10) : 0;
    };
    OperationsLog.prototype.compressFile = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var compressedPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        compressedPath = "".concat(filePath, ".gz");
                        return [4 /*yield*/, (0, promises_1.pipeline)((0, fs_1.createReadStream)(filePath), zlib.createGzip(), (0, fs_1.createWriteStream)(compressedPath))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    OperationsLog.prototype.cleanupRotatedFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var rotatedFiles, filesToDelete, _i, filesToDelete_1, file, filePath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRotatedFiles()];
                    case 1:
                        rotatedFiles = _a.sent();
                        if (!(rotatedFiles.length > this.options.maxFiles)) return [3 /*break*/, 5];
                        filesToDelete = rotatedFiles.slice(0, rotatedFiles.length - this.options.maxFiles);
                        _i = 0, filesToDelete_1 = filesToDelete;
                        _a.label = 2;
                    case 2:
                        if (!(_i < filesToDelete_1.length)) return [3 /*break*/, 5];
                        file = filesToDelete_1[_i];
                        filePath = path.join(this.folderPath, file);
                        return [4 /*yield*/, fs.unlink(filePath).catch(function () { })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return OperationsLog;
}());
exports.OperationsLog = OperationsLog;
/**
 * Operations Log Manager for managing multiple logs
 */
var OperationsLogManager = /** @class */ (function () {
    function OperationsLogManager() {
        this.logs = new Map();
    }
    OperationsLogManager.prototype.getLog = function (folderPath, logName, options) {
        return __awaiter(this, void 0, void 0, function () {
            var key, log;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = "".concat(folderPath, ":").concat(logName || 'operations.log');
                        log = this.logs.get(key);
                        if (!!log) return [3 /*break*/, 2];
                        log = new OperationsLog(folderPath, logName, options);
                        return [4 /*yield*/, log.initialize()];
                    case 1:
                        _a.sent();
                        this.logs.set(key, log);
                        _a.label = 2;
                    case 2: return [2 /*return*/, log];
                }
            });
        });
    };
    OperationsLogManager.prototype.compactAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, _a, _b, key, log, result, err_4;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        results = new Map();
                        _i = 0, _a = this.logs;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        _b = _a[_i], key = _b[0], log = _b[1];
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, log.compact()];
                    case 3:
                        result = _c.sent();
                        results.set(key, result);
                        return [3 /*break*/, 5];
                    case 4:
                        err_4 = _c.sent();
                        console.error("Error compacting log ".concat(key, ":"), err_4);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, results];
                }
            });
        });
    };
    OperationsLogManager.prototype.rotateAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, log, err_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = this.logs.values();
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        log = _a[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, log.rotate()];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        err_5 = _b.sent();
                        console.error('Error rotating log:', err_5);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    OperationsLogManager.prototype.clear = function () {
        this.logs.clear();
    };
    return OperationsLogManager;
}());
exports.OperationsLogManager = OperationsLogManager;
exports.operationsLogManager = new OperationsLogManager();
