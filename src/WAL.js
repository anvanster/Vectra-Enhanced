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
exports.walManager = exports.WALManager = exports.WAL = void 0;
var fs = __importStar(require("fs/promises"));
var path = __importStar(require("path"));
var fs_1 = require("fs");
var crypto = __importStar(require("crypto"));
var AtomicOperations_1 = require("./AtomicOperations");
var WAL = /** @class */ (function () {
    function WAL(indexPath, options) {
        if (options === void 0) { options = {}; }
        this.currentSize = 0;
        this.entryCount = 0;
        this.oldestTimestamp = Date.now();
        this.rotationCount = 0;
        this.isClosing = false;
        this.indexPath = indexPath;
        this.walPath = path.join(indexPath, 'wal');
        this.options = {
            maxSize: options.maxSize || 100 * 1024 * 1024, // 100MB
            maxAge: options.maxAge || 24 * 60 * 60 * 1000, // 24 hours
            syncInterval: options.syncInterval || 1000, // 1 second
            checksumEnabled: options.checksumEnabled !== false,
            compressionEnabled: options.compressionEnabled || false
        };
    }
    /**
     * Initialize the WAL
     */
    WAL.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Create WAL directory if it doesn't exist
                    return [4 /*yield*/, fs.mkdir(this.walPath, { recursive: true })];
                    case 1:
                        // Create WAL directory if it doesn't exist
                        _a.sent();
                        // Load existing WAL files
                        return [4 /*yield*/, this.loadExistingWAL()];
                    case 2:
                        // Load existing WAL files
                        _a.sent();
                        // Start write stream
                        return [4 /*yield*/, this.startWriteStream()];
                    case 3:
                        // Start write stream
                        _a.sent();
                        // Start sync timer
                        this.startSyncTimer();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Close the WAL
     */
    WAL.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.isClosing = true;
                        // Stop sync timer
                        if (this.syncTimer) {
                            clearInterval(this.syncTimer);
                            this.syncTimer = undefined;
                        }
                        if (!this.writeStream) return [3 /*break*/, 2];
                        return [4 /*yield*/, new Promise(function (resolve) {
                                _this.writeStream.end(function () { return resolve(); });
                            })];
                    case 1:
                        _a.sent();
                        this.writeStream = undefined;
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Write an entry to the WAL
     */
    WAL.prototype.writeEntry = function (entry) {
        return __awaiter(this, void 0, void 0, function () {
            var fullEntry, entryData, entryBuffer;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isClosing) {
                            throw new Error('WAL is closing');
                        }
                        fullEntry = __assign(__assign({}, entry), { checksum: this.options.checksumEnabled ? this.calculateChecksum(entry) : undefined });
                        return [4 /*yield*/, this.shouldRotate()];
                    case 1:
                        if (!_a.sent()) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.rotate()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        entryData = JSON.stringify(fullEntry) + '\n';
                        entryBuffer = Buffer.from(entryData);
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                _this.writeStream.write(entryBuffer, function (err) {
                                    if (err)
                                        reject(err);
                                    else
                                        resolve();
                                });
                            })];
                    case 4:
                        _a.sent();
                        // Update stats
                        this.currentSize += entryBuffer.length;
                        this.entryCount++;
                        if (this.entryCount === 1) {
                            this.oldestTimestamp = entry.timestamp;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Read all entries from the WAL
     */
    WAL.prototype.readEntries = function () {
        return __awaiter(this, void 0, void 0, function () {
            var entries, walFiles, _i, walFiles_1, file, filePath, fileEntries;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entries = [];
                        return [4 /*yield*/, this.getWALFiles()];
                    case 1:
                        walFiles = _a.sent();
                        _i = 0, walFiles_1 = walFiles;
                        _a.label = 2;
                    case 2:
                        if (!(_i < walFiles_1.length)) return [3 /*break*/, 5];
                        file = walFiles_1[_i];
                        filePath = path.join(this.walPath, file);
                        return [4 /*yield*/, this.readWALFile(filePath)];
                    case 3:
                        fileEntries = _a.sent();
                        entries.push.apply(entries, fileEntries);
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, entries];
                }
            });
        });
    };
    /**
     * Replay WAL entries
     */
    WAL.prototype.replay = function (handler) {
        return __awaiter(this, void 0, void 0, function () {
            var entries, replayedCount, _i, entries_1, entry, calculated, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.readEntries()];
                    case 1:
                        entries = _a.sent();
                        replayedCount = 0;
                        _i = 0, entries_1 = entries;
                        _a.label = 2;
                    case 2:
                        if (!(_i < entries_1.length)) return [3 /*break*/, 7];
                        entry = entries_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        // Validate checksum if enabled
                        if (this.options.checksumEnabled && entry.checksum) {
                            calculated = this.calculateChecksum({
                                id: entry.id,
                                timestamp: entry.timestamp,
                                operation: entry.operation,
                                data: entry.data
                            });
                            if (calculated !== entry.checksum) {
                                console.warn("Checksum mismatch for entry ".concat(entry.id, ", skipping"));
                                return [3 /*break*/, 6];
                            }
                        }
                        return [4 /*yield*/, handler(entry)];
                    case 4:
                        _a.sent();
                        replayedCount++;
                        return [3 /*break*/, 6];
                    case 5:
                        err_1 = _a.sent();
                        console.error("Error replaying entry ".concat(entry.id, ":"), err_1);
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, replayedCount];
                }
            });
        });
    };
    /**
     * Checkpoint the WAL (mark entries as committed)
     */
    WAL.prototype.checkpoint = function () {
        return __awaiter(this, void 0, void 0, function () {
            var checkpointFile, checkpoint;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        checkpointFile = path.join(this.walPath, 'checkpoint');
                        checkpoint = {
                            timestamp: Date.now(),
                            lastEntry: this.entryCount,
                            rotationCount: this.rotationCount
                        };
                        return [4 /*yield*/, AtomicOperations_1.AtomicOperations.writeFile(checkpointFile, JSON.stringify(checkpoint))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clean up old WAL files
     */
    WAL.prototype.cleanup = function () {
        return __awaiter(this, arguments, void 0, function (keepFiles) {
            var walFiles, filesToDelete, _i, filesToDelete_1, file;
            if (keepFiles === void 0) { keepFiles = 2; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getWALFiles()];
                    case 1:
                        walFiles = _a.sent();
                        filesToDelete = walFiles.slice(0, Math.max(0, walFiles.length - keepFiles));
                        _i = 0, filesToDelete_1 = filesToDelete;
                        _a.label = 2;
                    case 2:
                        if (!(_i < filesToDelete_1.length)) return [3 /*break*/, 5];
                        file = filesToDelete_1[_i];
                        return [4 /*yield*/, fs.unlink(path.join(this.walPath, file))];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, filesToDelete.length];
                }
            });
        });
    };
    /**
     * Get WAL statistics
     */
    WAL.prototype.getStats = function () {
        return {
            currentSize: this.currentSize,
            entryCount: this.entryCount,
            oldestEntry: this.oldestTimestamp,
            newestEntry: Date.now(),
            rotationCount: this.rotationCount
        };
    };
    /**
     * Force sync to disk
     */
    WAL.prototype.sync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.writeStream && 'fd' in this.writeStream)) return [3 /*break*/, 2];
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                _this.writeStream.fd.sync(function (err) {
                                    if (err)
                                        reject(err);
                                    else
                                        resolve();
                                });
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    WAL.prototype.loadExistingWAL = function () {
        return __awaiter(this, void 0, void 0, function () {
            var walFiles, latestFile, filePath, stats, entries, match, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getWALFiles()];
                    case 1:
                        walFiles = _a.sent();
                        if (walFiles.length === 0)
                            return [2 /*return*/];
                        latestFile = walFiles[walFiles.length - 1];
                        filePath = path.join(this.walPath, latestFile);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, fs.stat(filePath)];
                    case 3:
                        stats = _a.sent();
                        this.currentSize = stats.size;
                        return [4 /*yield*/, this.readWALFile(filePath)];
                    case 4:
                        entries = _a.sent();
                        this.entryCount = entries.length;
                        if (entries.length > 0) {
                            this.oldestTimestamp = entries[0].timestamp;
                        }
                        match = latestFile.match(/wal\.(\d+)\.log/);
                        if (match) {
                            this.rotationCount = parseInt(match[1], 10);
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        err_2 = _a.sent();
                        console.error('Error loading existing WAL:', err_2);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    WAL.prototype.startWriteStream = function () {
        return __awaiter(this, void 0, void 0, function () {
            var filename, filePath;
            return __generator(this, function (_a) {
                filename = "wal.".concat(this.rotationCount, ".log");
                filePath = path.join(this.walPath, filename);
                this.writeStream = (0, fs_1.createWriteStream)(filePath, {
                    flags: 'a', // Append mode
                    highWaterMark: 64 * 1024 // 64KB buffer
                });
                this.writeStream.on('error', function (err) {
                    console.error('WAL write stream error:', err);
                });
                return [2 /*return*/];
            });
        });
    };
    WAL.prototype.startSyncTimer = function () {
        var _this = this;
        this.syncTimer = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            var err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.sync()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        err_3 = _a.sent();
                        console.error('WAL sync error:', err_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); }, this.options.syncInterval);
    };
    WAL.prototype.shouldRotate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var age;
            return __generator(this, function (_a) {
                // Check size
                if (this.currentSize >= this.options.maxSize) {
                    return [2 /*return*/, true];
                }
                age = Date.now() - this.oldestTimestamp;
                if (age >= this.options.maxAge) {
                    return [2 /*return*/, true];
                }
                return [2 /*return*/, false];
            });
        });
    };
    WAL.prototype.rotate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.writeStream) return [3 /*break*/, 2];
                        return [4 /*yield*/, new Promise(function (resolve) {
                                _this.writeStream.end(function () { return resolve(); });
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        // Increment rotation count
                        this.rotationCount++;
                        // Reset stats
                        this.currentSize = 0;
                        this.entryCount = 0;
                        this.oldestTimestamp = Date.now();
                        // Start new stream
                        return [4 /*yield*/, this.startWriteStream()];
                    case 3:
                        // Start new stream
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WAL.prototype.getWALFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.readdir(this.walPath)];
                    case 1:
                        files = _a.sent();
                        return [2 /*return*/, files
                                .filter(function (f) { return f.match(/^wal\.\d+\.log$/); })
                                .sort(function (a, b) {
                                var aNum = parseInt(a.match(/wal\.(\d+)\.log/)[1], 10);
                                var bNum = parseInt(b.match(/wal\.(\d+)\.log/)[1], 10);
                                return aNum - bNum;
                            })];
                    case 2:
                        err_4 = _a.sent();
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    WAL.prototype.readWALFile = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var entries, content, lines, _i, lines_1, line, entry;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entries = [];
                        return [4 /*yield*/, fs.readFile(filePath, 'utf-8')];
                    case 1:
                        content = _a.sent();
                        lines = content.trim().split('\n');
                        for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                            line = lines_1[_i];
                            if (!line)
                                continue;
                            try {
                                entry = JSON.parse(line);
                                entries.push(entry);
                            }
                            catch (err) {
                                console.warn("Invalid WAL entry: ".concat(line));
                            }
                        }
                        return [2 /*return*/, entries];
                }
            });
        });
    };
    WAL.prototype.calculateChecksum = function (entry) {
        var data = JSON.stringify({
            id: entry.id,
            timestamp: entry.timestamp,
            operation: entry.operation,
            data: entry.data
        });
        return crypto.createHash('sha256').update(data).digest('hex');
    };
    return WAL;
}());
exports.WAL = WAL;
/**
 * WAL Manager for managing multiple WALs
 */
var WALManager = /** @class */ (function () {
    function WALManager() {
        this.wals = new Map();
    }
    WALManager.getInstance = function () {
        if (!WALManager.instance) {
            WALManager.instance = new WALManager();
        }
        return WALManager.instance;
    };
    WALManager.prototype.getWAL = function (indexPath, options) {
        return __awaiter(this, void 0, void 0, function () {
            var existingWAL, wal;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        existingWAL = this.wals.get(indexPath);
                        if (existingWAL) {
                            return [2 /*return*/, existingWAL];
                        }
                        wal = new WAL(indexPath, options);
                        return [4 /*yield*/, wal.initialize()];
                    case 1:
                        _a.sent();
                        this.wals.set(indexPath, wal);
                        return [2 /*return*/, wal];
                }
            });
        });
    };
    WALManager.prototype.closeWAL = function (indexPath) {
        return __awaiter(this, void 0, void 0, function () {
            var wal;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wal = this.wals.get(indexPath);
                        if (!wal) return [3 /*break*/, 2];
                        return [4 /*yield*/, wal.close()];
                    case 1:
                        _a.sent();
                        this.wals.delete(indexPath);
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    WALManager.prototype.closeAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var closePromises;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        closePromises = Array.from(this.wals.values()).map(function (wal) { return wal.close(); });
                        return [4 /*yield*/, Promise.all(closePromises)];
                    case 1:
                        _a.sent();
                        this.wals.clear();
                        return [2 /*return*/];
                }
            });
        });
    };
    return WALManager;
}());
exports.WALManager = WALManager;
exports.walManager = WALManager.getInstance();
