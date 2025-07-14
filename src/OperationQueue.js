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
exports.OperationQueue = void 0;
var events_1 = require("events");
var uuid_1 = require("uuid");
var OperationQueue = /** @class */ (function (_super) {
    __extends(OperationQueue, _super);
    function OperationQueue(options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        _this.queue = [];
        _this.processing = new Map();
        _this.isProcessing = false;
        _this.handlers = new Map();
        _this.options = __assign({ maxConcurrency: 1, maxRetries: 3, retryDelay: 100, priorityQueue: true }, options);
        return _this;
    }
    OperationQueue.prototype.enqueue = function (type_1, data_1) {
        return __awaiter(this, arguments, void 0, function (type, data, priority) {
            var _this = this;
            if (priority === void 0) { priority = 0; }
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var operation = {
                            id: (0, uuid_1.v4)(),
                            type: type,
                            data: data,
                            priority: priority,
                            timestamp: Date.now(),
                            retries: 0,
                            maxRetries: _this.options.maxRetries,
                            resolve: resolve,
                            reject: reject
                        };
                        _this.queue.push(operation);
                        if (_this.options.priorityQueue) {
                            _this.queue.sort(function (a, b) {
                                // Higher priority first
                                if (a.priority !== b.priority) {
                                    return b.priority - a.priority;
                                }
                                // Earlier timestamp first for same priority
                                return a.timestamp - b.timestamp;
                            });
                        }
                        _this.emit('enqueued', operation);
                        _this.processNext();
                    })];
            });
        });
    };
    OperationQueue.prototype.processNext = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _loop_1, this_1;
            return __generator(this, function (_a) {
                if (this.isProcessing || this.queue.length === 0) {
                    return [2 /*return*/];
                }
                if (this.processing.size >= this.options.maxConcurrency) {
                    return [2 /*return*/];
                }
                this.isProcessing = true;
                try {
                    _loop_1 = function () {
                        var operation = this_1.queue.shift();
                        this_1.processing.set(operation.id, operation);
                        // Process operation asynchronously
                        this_1.processOperation(operation).catch(function (err) {
                            console.error("Failed to process operation ".concat(operation.id, ":"), err);
                        });
                    };
                    this_1 = this;
                    while (this.queue.length > 0 && this.processing.size < this.options.maxConcurrency) {
                        _loop_1();
                    }
                }
                finally {
                    this.isProcessing = false;
                }
                return [2 /*return*/];
            });
        });
    };
    OperationQueue.prototype.processOperation = function (operation) {
        return __awaiter(this, void 0, void 0, function () {
            var handler, result, error_1, delay;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, 3, 4]);
                        this.emit('processing', operation);
                        handler = this.handlers.get(operation.type);
                        if (!handler) {
                            throw new Error("No handler registered for operation type: ".concat(operation.type));
                        }
                        return [4 /*yield*/, handler(operation.data)];
                    case 1:
                        result = _a.sent();
                        this.processing.delete(operation.id);
                        operation.resolve(result);
                        this.emit('completed', operation, result);
                        return [3 /*break*/, 4];
                    case 2:
                        error_1 = _a.sent();
                        operation.retries++;
                        if (operation.retries < operation.maxRetries) {
                            delay = this.options.retryDelay * Math.pow(2, operation.retries - 1);
                            this.emit('retry', operation, error_1, operation.retries);
                            setTimeout(function () {
                                _this.processing.delete(operation.id);
                                _this.queue.unshift(operation); // Add back to front of queue
                                _this.processNext();
                            }, delay);
                        }
                        else {
                            // Max retries exceeded
                            this.processing.delete(operation.id);
                            operation.reject(error_1);
                            this.emit('failed', operation, error_1);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        // Always try to process the next item
                        this.processNext();
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    OperationQueue.prototype.setHandler = function (type, handler) {
        this.handlers.set(type, handler);
    };
    OperationQueue.prototype.getQueueLength = function () {
        return this.queue.length;
    };
    OperationQueue.prototype.getProcessingCount = function () {
        return this.processing.size;
    };
    OperationQueue.prototype.drain = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        var checkDrained = function () {
                            if (_this.queue.length === 0 && _this.processing.size === 0) {
                                resolve();
                            }
                            else {
                                setTimeout(checkDrained, 10);
                            }
                        };
                        checkDrained();
                    })];
            });
        });
    };
    OperationQueue.prototype.clear = function () {
        // Reject all pending operations
        for (var _i = 0, _a = this.queue; _i < _a.length; _i++) {
            var op = _a[_i];
            op.reject(new Error('Queue cleared'));
        }
        this.queue = [];
    };
    OperationQueue.prototype.pause = function () {
        this.options.maxConcurrency = 0;
    };
    OperationQueue.prototype.resume = function (maxConcurrency) {
        this.options.maxConcurrency = maxConcurrency !== null && maxConcurrency !== void 0 ? maxConcurrency : 1;
        this.processNext();
    };
    return OperationQueue;
}(events_1.EventEmitter));
exports.OperationQueue = OperationQueue;
