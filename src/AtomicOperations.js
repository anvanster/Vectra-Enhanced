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
exports.AtomicOperations = void 0;
var fs = __importStar(require("fs/promises"));
var path = __importStar(require("path"));
var uuid_1 = require("uuid");
var AtomicOperations = /** @class */ (function () {
    function AtomicOperations() {
    }
    /**
     * Atomically write data to a file by writing to a temporary file first
     * then renaming it to the target path.
     */
    AtomicOperations.writeFile = function (filePath_1, data_1) {
        return __awaiter(this, arguments, void 0, function (filePath, data, options) {
            var _a, retries, _b, retryDelay, _loop_1, this_1, attempt, state_1;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = options.retries, retries = _a === void 0 ? 3 : _a, _b = options.retryDelay, retryDelay = _b === void 0 ? 100 : _b;
                        _loop_1 = function (attempt) {
                            var err_1, isLastAttempt, delay_1;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        _d.trys.push([0, 2, , 4]);
                                        return [4 /*yield*/, this_1.performAtomicWrite(filePath, data)];
                                    case 1:
                                        _d.sent();
                                        return [2 /*return*/, { value: void 0 }];
                                    case 2:
                                        err_1 = _d.sent();
                                        isLastAttempt = attempt === retries;
                                        // Don't retry on certain errors
                                        if (this_1.isNonRetriableError(err_1)) {
                                            throw err_1;
                                        }
                                        if (isLastAttempt) {
                                            throw new Error("Atomic write failed after ".concat(retries, " attempts: ").concat(err_1.message));
                                        }
                                        delay_1 = retryDelay * Math.pow(2, attempt - 1);
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                                    case 3:
                                        _d.sent();
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        attempt = 1;
                        _c.label = 1;
                    case 1:
                        if (!(attempt <= retries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _c.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _c.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AtomicOperations.performAtomicWrite = function (filePath, data) {
        return __awaiter(this, void 0, void 0, function () {
            var dir, tempPath, fd, err_2, cleanupErr_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dir = path.dirname(filePath);
                        tempPath = path.join(dir, ".".concat(path.basename(filePath), ".").concat((0, uuid_1.v4)(), ".tmp"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 12]);
                        // Write to temporary file
                        return [4 /*yield*/, fs.writeFile(tempPath, data, { flag: 'w' })];
                    case 2:
                        // Write to temporary file
                        _a.sent();
                        return [4 /*yield*/, fs.open(tempPath, 'r')];
                    case 3:
                        fd = _a.sent();
                        return [4 /*yield*/, fd.sync()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, fd.close()];
                    case 5:
                        _a.sent();
                        // Atomically rename temp file to target
                        return [4 /*yield*/, fs.rename(tempPath, filePath)];
                    case 6:
                        // Atomically rename temp file to target
                        _a.sent();
                        return [3 /*break*/, 12];
                    case 7:
                        err_2 = _a.sent();
                        _a.label = 8;
                    case 8:
                        _a.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, fs.unlink(tempPath)];
                    case 9:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        cleanupErr_1 = _a.sent();
                        return [3 /*break*/, 11];
                    case 11: throw err_2;
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    AtomicOperations.isNonRetriableError = function (err) {
        // Don't retry on these errors
        var nonRetriableCodes = [
            'EACCES', // Permission denied
            'EISDIR', // Is a directory
            'ENOTDIR', // Not a directory
            'EINVAL', // Invalid argument
            'ENOENT', // No such file or directory (for parent dir)
        ];
        // If error doesn't have a code, check message
        if (!err.code) {
            // Don't retry on validation errors
            if (err.message && err.message.includes('Invalid')) {
                return true;
            }
            return false;
        }
        return nonRetriableCodes.includes(err.code);
    };
    /**
     * Read file with retry logic for handling concurrent access
     */
    AtomicOperations.readFile = function (filePath_1) {
        return __awaiter(this, arguments, void 0, function (filePath, retries) {
            var _loop_2, i, state_2;
            if (retries === void 0) { retries = 3; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _loop_2 = function (i) {
                            var _b, err_3;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 2, , 5]);
                                        _b = {};
                                        return [4 /*yield*/, fs.readFile(filePath)];
                                    case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                    case 2:
                                        err_3 = _c.sent();
                                        if (!(err_3.code === 'ENOENT' && i < retries - 1)) return [3 /*break*/, 4];
                                        // File doesn't exist yet, wait a bit and retry
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 10 * (i + 1)); })];
                                    case 3:
                                        // File doesn't exist yet, wait a bit and retry
                                        _c.sent();
                                        return [2 /*return*/, "continue"];
                                    case 4: throw err_3;
                                    case 5: return [2 /*return*/];
                                }
                            });
                        };
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < retries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_2(i)];
                    case 2:
                        state_2 = _a.sent();
                        if (typeof state_2 === "object")
                            return [2 /*return*/, state_2.value];
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: throw new Error("Failed to read file after ".concat(retries, " attempts"));
                }
            });
        });
    };
    /**
     * Atomically update a JSON file
     */
    AtomicOperations.updateJsonFile = function (filePath_1, updateFn_1) {
        return __awaiter(this, arguments, void 0, function (filePath, updateFn, options) {
            var _a, retries, _b, retryDelay, _loop_3, this_2, attempt, state_3;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = options.retries, retries = _a === void 0 ? 3 : _a, _b = options.retryDelay, retryDelay = _b === void 0 ? 100 : _b;
                        _loop_3 = function (attempt) {
                            var data, json, updated, err_4, isLastAttempt, delay_2;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        _d.trys.push([0, 4, , 6]);
                                        return [4 /*yield*/, this_2.readFile(filePath)];
                                    case 1:
                                        data = _d.sent();
                                        json = JSON.parse(data.toString());
                                        return [4 /*yield*/, updateFn(json)];
                                    case 2:
                                        updated = _d.sent();
                                        return [4 /*yield*/, this_2.writeFile(filePath, JSON.stringify(updated), options)];
                                    case 3:
                                        _d.sent();
                                        return [2 /*return*/, { value: void 0 }];
                                    case 4:
                                        err_4 = _d.sent();
                                        isLastAttempt = attempt === retries;
                                        if (this_2.isNonRetriableError(err_4)) {
                                            throw err_4;
                                        }
                                        if (isLastAttempt) {
                                            throw new Error("Atomic JSON update failed after ".concat(retries, " attempts: ").concat(err_4.message));
                                        }
                                        delay_2 = retryDelay * Math.pow(2, attempt - 1);
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_2); })];
                                    case 5:
                                        _d.sent();
                                        return [3 /*break*/, 6];
                                    case 6: return [2 /*return*/];
                                }
                            });
                        };
                        this_2 = this;
                        attempt = 1;
                        _c.label = 1;
                    case 1:
                        if (!(attempt <= retries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_3(attempt)];
                    case 2:
                        state_3 = _c.sent();
                        if (typeof state_3 === "object")
                            return [2 /*return*/, state_3.value];
                        _c.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create a backup of a file before modifying it
     */
    AtomicOperations.createBackup = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var backupPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        backupPath = "".concat(filePath, ".").concat(Date.now(), ".backup");
                        return [4 /*yield*/, fs.copyFile(filePath, backupPath)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, backupPath];
                }
            });
        });
    };
    /**
     * Restore from a backup file
     */
    AtomicOperations.restoreBackup = function (backupPath, targetPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.copyFile(backupPath, targetPath)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clean up old backup files
     */
    AtomicOperations.cleanupBackups = function (dir_1, pattern_1) {
        return __awaiter(this, arguments, void 0, function (dir, pattern, maxAge // 7 days
        ) {
            var files, now, _i, files_1, file, filePath, stats;
            if (maxAge === void 0) { maxAge = 7 * 24 * 60 * 60 * 1000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.readdir(dir)];
                    case 1:
                        files = _a.sent();
                        now = Date.now();
                        _i = 0, files_1 = files;
                        _a.label = 2;
                    case 2:
                        if (!(_i < files_1.length)) return [3 /*break*/, 6];
                        file = files_1[_i];
                        if (!pattern.test(file)) return [3 /*break*/, 5];
                        filePath = path.join(dir, file);
                        return [4 /*yield*/, fs.stat(filePath)];
                    case 3:
                        stats = _a.sent();
                        if (!(now - stats.mtime.getTime() > maxAge)) return [3 /*break*/, 5];
                        return [4 /*yield*/, fs.unlink(filePath)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return AtomicOperations;
}());
exports.AtomicOperations = AtomicOperations;
