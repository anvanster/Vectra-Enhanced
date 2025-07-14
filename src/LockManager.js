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
exports.lockManager = exports.LockManager = void 0;
var lockfile = __importStar(require("proper-lockfile"));
var path = __importStar(require("path"));
var fs = __importStar(require("fs/promises"));
var LockManager = /** @class */ (function () {
    function LockManager() {
        this.defaultOptions = {
            retries: 10,
            minTimeout: 100,
            maxTimeout: 1000,
            stale: 30000
        };
        this.locks = new Map();
    }
    LockManager.prototype.acquireWriteLock = function (indexPath, options) {
        return __awaiter(this, void 0, void 0, function () {
            var indexFile, opts, err_1, lockFile, release_1, lock_1, release, lock;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        indexFile = path.join(indexPath, 'index.json');
                        opts = __assign(__assign({}, this.defaultOptions), options);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 6]);
                        return [4 /*yield*/, fs.access(indexFile)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 3:
                        err_1 = _a.sent();
                        lockFile = path.join(indexPath, '.vectra.lock');
                        return [4 /*yield*/, fs.writeFile(lockFile, '', { flag: 'a' })];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, lockfile.lock(lockFile, {
                                retries: opts.retries,
                                minTimeout: opts.minTimeout,
                                maxTimeout: opts.maxTimeout,
                                stale: opts.stale,
                                update: 5000
                            })];
                    case 5:
                        release_1 = _a.sent();
                        lock_1 = {
                            release: function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, release_1()];
                                        case 1:
                                            _a.sent();
                                            this.locks.delete(indexPath);
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                            extend: function (ms) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/];
                                });
                            }); }
                        };
                        this.locks.set(indexPath, lock_1);
                        return [2 /*return*/, lock_1];
                    case 6: return [4 /*yield*/, lockfile.lock(indexFile, {
                            retries: opts.retries,
                            minTimeout: opts.minTimeout,
                            maxTimeout: opts.maxTimeout,
                            stale: opts.stale,
                            update: 5000
                        })];
                    case 7:
                        release = _a.sent();
                        lock = {
                            release: function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, release()];
                                        case 1:
                                            _a.sent();
                                            this.locks.delete(indexPath);
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                            extend: function (ms) { return __awaiter(_this, void 0, void 0, function () {
                                var newRelease;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, lockfile.unlock(indexFile)];
                                        case 1:
                                            _a.sent();
                                            return [4 /*yield*/, lockfile.lock(indexFile, {
                                                    retries: opts.retries,
                                                    minTimeout: opts.minTimeout,
                                                    maxTimeout: opts.maxTimeout,
                                                    stale: ms,
                                                    update: Math.min(ms / 2, 5000)
                                                })];
                                        case 2:
                                            newRelease = _a.sent();
                                            lock.release = function () { return __awaiter(_this, void 0, void 0, function () {
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0: return [4 /*yield*/, newRelease()];
                                                        case 1:
                                                            _a.sent();
                                                            this.locks.delete(indexPath);
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); };
                                            return [2 /*return*/];
                                    }
                                });
                            }); }
                        };
                        this.locks.set(indexPath, lock);
                        return [2 /*return*/, lock];
                }
            });
        });
    };
    LockManager.prototype.acquireReadLock = function (indexPath, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                // For read locks, we'll use a simpler approach
                // In a real implementation, you might want to use reader-writer locks
                // For now, we'll just return a no-op lock for reads since they don't modify data
                return [2 /*return*/, {
                        release: function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/];
                            });
                        }); },
                        extend: function (ms) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/];
                            });
                        }); }
                    }];
            });
        });
    };
    LockManager.prototype.tryAcquireWriteLock = function (indexPath, options) {
        return __awaiter(this, void 0, void 0, function () {
            var indexFile_1, opts, err_2, lockFile, release_2, lock_2, release_3, lock_3, err_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        indexFile_1 = path.join(indexPath, 'index.json');
                        opts = __assign(__assign(__assign({}, this.defaultOptions), options), { retries: 0 });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 6]);
                        return [4 /*yield*/, fs.access(indexFile_1)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 3:
                        err_2 = _a.sent();
                        lockFile = path.join(indexPath, '.vectra.lock');
                        return [4 /*yield*/, fs.writeFile(lockFile, '', { flag: 'a' })];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, lockfile.lock(lockFile, {
                                retries: 0,
                                stale: opts.stale,
                                update: 5000
                            })];
                    case 5:
                        release_2 = _a.sent();
                        lock_2 = {
                            release: function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, release_2()];
                                        case 1:
                                            _a.sent();
                                            this.locks.delete(indexPath);
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                            extend: function (ms) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/];
                                });
                            }); }
                        };
                        this.locks.set(indexPath, lock_2);
                        return [2 /*return*/, lock_2];
                    case 6: return [4 /*yield*/, lockfile.lock(indexFile_1, {
                            retries: 0,
                            stale: opts.stale,
                            update: 5000
                        })];
                    case 7:
                        release_3 = _a.sent();
                        lock_3 = {
                            release: function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, release_3()];
                                        case 1:
                                            _a.sent();
                                            this.locks.delete(indexPath);
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                            extend: function (ms) { return __awaiter(_this, void 0, void 0, function () {
                                var newRelease;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, lockfile.unlock(indexFile_1)];
                                        case 1:
                                            _a.sent();
                                            return [4 /*yield*/, lockfile.lock(indexFile_1, {
                                                    retries: 0,
                                                    stale: ms,
                                                    update: Math.min(ms / 2, 5000)
                                                })];
                                        case 2:
                                            newRelease = _a.sent();
                                            lock_3.release = function () { return __awaiter(_this, void 0, void 0, function () {
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0: return [4 /*yield*/, newRelease()];
                                                        case 1:
                                                            _a.sent();
                                                            this.locks.delete(indexPath);
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); };
                                            return [2 /*return*/];
                                    }
                                });
                            }); }
                        };
                        this.locks.set(indexPath, lock_3);
                        return [2 /*return*/, lock_3];
                    case 8:
                        err_3 = _a.sent();
                        return [2 /*return*/, null];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    LockManager.prototype.isWriteLocked = function (indexPath) {
        return __awaiter(this, void 0, void 0, function () {
            var indexFile, err_4, lockFile, err2_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        indexFile = path.join(indexPath, 'index.json');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 10]);
                        return [4 /*yield*/, fs.access(indexFile)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, lockfile.check(indexFile)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        err_4 = _a.sent();
                        lockFile = path.join(indexPath, '.vectra.lock');
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 8, , 9]);
                        return [4 /*yield*/, fs.access(lockFile)];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, lockfile.check(lockFile)];
                    case 7: return [2 /*return*/, _a.sent()];
                    case 8:
                        err2_1 = _a.sent();
                        return [2 /*return*/, false];
                    case 9: return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    LockManager.prototype.releaseAllLocks = function () {
        return __awaiter(this, void 0, void 0, function () {
            var releases;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        releases = Array.from(this.locks.values()).map(function (lock) { return lock.release(); });
                        return [4 /*yield*/, Promise.all(releases)];
                    case 1:
                        _a.sent();
                        this.locks.clear();
                        return [2 /*return*/];
                }
            });
        });
    };
    return LockManager;
}());
exports.LockManager = LockManager;
exports.lockManager = new LockManager();
process.on('exit', function () {
    exports.lockManager.releaseAllLocks().catch(function () { });
});
process.on('SIGINT', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.lockManager.releaseAllLocks()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
process.on('SIGTERM', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.lockManager.releaseAllLocks()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
