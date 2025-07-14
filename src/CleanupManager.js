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
exports.CleanupManager = void 0;
var fs = __importStar(require("fs/promises"));
var path = __importStar(require("path"));
var CleanupManager = /** @class */ (function () {
    function CleanupManager() {
    }
    /**
     * Deletes a metadata file safely
     */
    CleanupManager.deleteMetadataFile = function (folderPath, metadataFile) {
        return __awaiter(this, void 0, void 0, function () {
            var metadataPath, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!metadataFile)
                            return [2 /*return*/];
                        metadataPath = path.join(folderPath, metadataFile);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs.unlink(metadataPath)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        // Ignore if file doesn't exist
                        if (err_1.code !== 'ENOENT') {
                            throw new Error("Failed to delete metadata file ".concat(metadataFile, ": ").concat(err_1.message));
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Finds orphaned metadata files (files not referenced in the index)
     */
    CleanupManager.findOrphanedMetadataFiles = function (folderPath, referencedFiles) {
        return __awaiter(this, void 0, void 0, function () {
            var orphaned, files, _i, files_1, file, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        orphaned = [];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs.readdir(folderPath)];
                    case 2:
                        files = _a.sent();
                        for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                            file = files_1[_i];
                            // Check if it's a metadata file (UUID.json pattern)
                            if (file.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$/i)) {
                                if (!referencedFiles.has(file)) {
                                    orphaned.push(file);
                                }
                            }
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        err_2 = _a.sent();
                        // Directory might not exist
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/, orphaned];
                }
            });
        });
    };
    /**
     * Cleans up orphaned metadata files
     */
    CleanupManager.cleanupOrphanedFiles = function (folderPath, orphanedFiles) {
        return __awaiter(this, void 0, void 0, function () {
            var stats, _i, orphanedFiles_1, file, filePath, stat, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        stats = {
                            metadataFilesDeleted: 0,
                            orphanedFilesDeleted: 0,
                            bytesReclaimed: 0,
                            errors: []
                        };
                        _i = 0, orphanedFiles_1 = orphanedFiles;
                        _a.label = 1;
                    case 1:
                        if (!(_i < orphanedFiles_1.length)) return [3 /*break*/, 7];
                        file = orphanedFiles_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        filePath = path.join(folderPath, file);
                        return [4 /*yield*/, fs.stat(filePath)];
                    case 3:
                        stat = _a.sent();
                        return [4 /*yield*/, fs.unlink(filePath)];
                    case 4:
                        _a.sent();
                        stats.orphanedFilesDeleted++;
                        stats.bytesReclaimed += stat.size;
                        return [3 /*break*/, 6];
                    case 5:
                        err_3 = _a.sent();
                        stats.errors.push("Failed to delete ".concat(file, ": ").concat(err_3.message));
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7: return [2 /*return*/, stats];
                }
            });
        });
    };
    /**
     * Gets all referenced metadata files from index items
     */
    CleanupManager.getReferencedMetadataFiles = function (items) {
        var referenced = new Set();
        for (var _i = 0, _a = items.values(); _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.metadataFile) {
                referenced.add(item.metadataFile);
            }
        }
        return referenced;
    };
    /**
     * Performs a full cleanup of the index
     */
    CleanupManager.performFullCleanup = function (folderPath, items) {
        return __awaiter(this, void 0, void 0, function () {
            var referenced, orphaned;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        referenced = this.getReferencedMetadataFiles(items);
                        return [4 /*yield*/, this.findOrphanedMetadataFiles(folderPath, referenced)];
                    case 1:
                        orphaned = _a.sent();
                        return [4 /*yield*/, this.cleanupOrphanedFiles(folderPath, orphaned)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Validates that all referenced metadata files exist
     */
    CleanupManager.validateMetadataFiles = function (folderPath, items) {
        return __awaiter(this, void 0, void 0, function () {
            var missing, _i, _a, _b, id, item, metadataPath, err_4;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        missing = [];
                        _i = 0, _a = items.entries();
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        _b = _a[_i], id = _b[0], item = _b[1];
                        if (!item.metadataFile) return [3 /*break*/, 5];
                        metadataPath = path.join(folderPath, item.metadataFile);
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, fs.access(metadataPath)];
                    case 3:
                        _c.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        err_4 = _c.sent();
                        missing.push("Item ".concat(id, " references missing file: ").concat(item.metadataFile));
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, missing];
                }
            });
        });
    };
    /**
     * Cleans up old backup files
     */
    CleanupManager.cleanupOldBackups = function (folderPath_1) {
        return __awaiter(this, arguments, void 0, function (folderPath, pattern, maxAge // 7 days
        ) {
            var deletedCount, now, files, _i, files_2, file, filePath, stat, err_5, err_6;
            if (pattern === void 0) { pattern = /\.(backup|tmp)$/; }
            if (maxAge === void 0) { maxAge = 7 * 24 * 60 * 60 * 1000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        deletedCount = 0;
                        now = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 11, , 12]);
                        return [4 /*yield*/, fs.readdir(folderPath)];
                    case 2:
                        files = _a.sent();
                        _i = 0, files_2 = files;
                        _a.label = 3;
                    case 3:
                        if (!(_i < files_2.length)) return [3 /*break*/, 10];
                        file = files_2[_i];
                        if (!pattern.test(file)) return [3 /*break*/, 9];
                        filePath = path.join(folderPath, file);
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 8, , 9]);
                        return [4 /*yield*/, fs.stat(filePath)];
                    case 5:
                        stat = _a.sent();
                        if (!(now - stat.mtime.getTime() > maxAge)) return [3 /*break*/, 7];
                        return [4 /*yield*/, fs.unlink(filePath)];
                    case 6:
                        _a.sent();
                        deletedCount++;
                        _a.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        err_5 = _a.sent();
                        return [3 /*break*/, 9];
                    case 9:
                        _i++;
                        return [3 /*break*/, 3];
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        err_6 = _a.sent();
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/, deletedCount];
                }
            });
        });
    };
    /**
     * Estimates disk space used by metadata files
     */
    CleanupManager.getMetadataStorageStats = function (folderPath, items) {
        return __awaiter(this, void 0, void 0, function () {
            var totalFiles, totalBytes, _i, _a, item, metadataPath, stat, err_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        totalFiles = 0;
                        totalBytes = 0;
                        _i = 0, _a = items.values();
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        item = _a[_i];
                        if (!item.metadataFile) return [3 /*break*/, 5];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        metadataPath = path.join(folderPath, item.metadataFile);
                        return [4 /*yield*/, fs.stat(metadataPath)];
                    case 3:
                        stat = _b.sent();
                        totalFiles++;
                        totalBytes += stat.size;
                        return [3 /*break*/, 5];
                    case 4:
                        err_7 = _b.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, {
                            totalFiles: totalFiles,
                            totalBytes: totalBytes,
                            averageFileSize: totalFiles > 0 ? Math.round(totalBytes / totalFiles) : 0
                        }];
                }
            });
        });
    };
    return CleanupManager;
}());
exports.CleanupManager = CleanupManager;
