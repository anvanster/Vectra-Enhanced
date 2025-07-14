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
exports.LocalDocument = void 0;
var fs = __importStar(require("fs/promises"));
var path = __importStar(require("path"));
/**
 * Represents an indexed document stored on disk.
 */
var LocalDocument = /** @class */ (function () {
    /**
     * Creates a new `LocalDocument` instance.
     * @param index Parent index that contains the document.
     * @param id ID of the document.
     * @param uri URI of the document.
     */
    function LocalDocument(index, id, uri) {
        this._index = index;
        this._id = id;
        this._uri = uri;
    }
    Object.defineProperty(LocalDocument.prototype, "folderPath", {
        /**
         * Returns the folder path where the document is stored.
         */
        get: function () {
            return this._index.folderPath;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LocalDocument.prototype, "id", {
        /**
         * Returns the ID of the document.
         */
        get: function () {
            return this._id;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LocalDocument.prototype, "uri", {
        /**
         * Returns the URI of the document.
         */
        get: function () {
            return this._uri;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Returns the length of the document in tokens.
     * @remarks
     * This value will be estimated for documents longer then 40k bytes.
     * @returns Length of the document in tokens.
     */
    LocalDocument.prototype.getLength = function () {
        return __awaiter(this, void 0, void 0, function () {
            var text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadText()];
                    case 1:
                        text = _a.sent();
                        if (text.length <= 40000) {
                            return [2 /*return*/, this._index.tokenizer.encode(text).length];
                        }
                        else {
                            return [2 /*return*/, Math.ceil(text.length / 4)];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Determines if the document has additional metadata storred on disk.
     * @returns True if the document has metadata; otherwise, false.
     */
    LocalDocument.prototype.hasMetadata = function () {
        return __awaiter(this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.access(path.join(this.folderPath, "".concat(this.id, ".json")))];
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
     * Loads the metadata for the document from disk.
     * @returns Metadata for the document.
     */
    LocalDocument.prototype.loadMetadata = function () {
        return __awaiter(this, void 0, void 0, function () {
            var json, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this._metadata == undefined)) return [3 /*break*/, 5];
                        json = void 0;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs.readFile(path.join(this.folderPath, "".concat(this.id, ".json")))];
                    case 2:
                        json = (_a.sent()).toString();
                        return [3 /*break*/, 4];
                    case 3:
                        err_2 = _a.sent();
                        throw new Error("Error reading metadata for document \"".concat(this.uri, "\": ").concat(err_2.toString()));
                    case 4:
                        try {
                            this._metadata = JSON.parse(json);
                        }
                        catch (err) {
                            throw new Error("Error parsing metadata for document \"".concat(this.uri, "\": ").concat(err.toString()));
                        }
                        _a.label = 5;
                    case 5: return [2 /*return*/, this._metadata];
                }
            });
        });
    };
    /**
     * Loads the text for the document from disk.
     * @returns Text for the document.
     */
    LocalDocument.prototype.loadText = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, err_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(this._text == undefined)) return [3 /*break*/, 4];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        _a = this;
                        return [4 /*yield*/, fs.readFile(path.join(this.folderPath, "".concat(this.id, ".txt")))];
                    case 2:
                        _a._text = (_b.sent()).toString();
                        return [3 /*break*/, 4];
                    case 3:
                        err_3 = _b.sent();
                        throw new Error("Error reading text file for document \"".concat(this.uri, "\": ").concat(err_3.toString()));
                    case 4: return [2 /*return*/, this._text];
                }
            });
        });
    };
    return LocalDocument;
}());
exports.LocalDocument = LocalDocument;
