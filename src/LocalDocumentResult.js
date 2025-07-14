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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalDocumentResult = void 0;
var LocalDocument_1 = require("./LocalDocument");
/**
 * Represents a search result for a document stored on disk.
 */
var LocalDocumentResult = /** @class */ (function (_super) {
    __extends(LocalDocumentResult, _super);
    /**
     * @private
     * Internal constructor for `LocalDocumentResult` instances.
     */
    function LocalDocumentResult(index, id, uri, chunks, tokenizer) {
        var _this = _super.call(this, index, id, uri) || this;
        _this._chunks = chunks;
        _this._tokenizer = tokenizer;
        // Compute average score
        var score = 0;
        _this._chunks.forEach(function (chunk) { return score += chunk.score; });
        _this._score = score / _this._chunks.length;
        return _this;
    }
    Object.defineProperty(LocalDocumentResult.prototype, "chunks", {
        /**
         * Returns the chunks of the document that matched the query.
         */
        get: function () {
            return this._chunks;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LocalDocumentResult.prototype, "score", {
        /**
         * Returns the average score of the document result.
         */
        get: function () {
            return this._score;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Renders all of the results chunks as spans of text (sections.)
     * @remarks
     * The returned sections will be sorted by document order and limited to maxTokens in length.
     * @param maxTokens Maximum number of tokens per section.
     * @returns Array of rendered text sections.
     */
    LocalDocumentResult.prototype.renderAllSections = function (maxTokens) {
        return __awaiter(this, void 0, void 0, function () {
            var text, chunks, i, chunk, startPos, endPos, chunkText, tokens, offset, chunkLength, sorted, sections, i, chunk, section;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadText()];
                    case 1:
                        text = _a.sent();
                        chunks = [];
                        for (i = 0; i < this._chunks.length; i++) {
                            chunk = this._chunks[i];
                            startPos = chunk.item.metadata.startPos;
                            endPos = chunk.item.metadata.endPos;
                            chunkText = text.substring(startPos, endPos + 1);
                            tokens = this._tokenizer.encode(chunkText);
                            offset = 0;
                            while (offset < tokens.length) {
                                chunkLength = Math.min(maxTokens, tokens.length - offset);
                                chunks.push({
                                    text: this._tokenizer.decode(tokens.slice(offset, offset + chunkLength)),
                                    startPos: startPos + offset,
                                    endPos: startPos + offset + chunkLength - 1,
                                    score: chunk.score,
                                    tokenCount: chunkLength,
                                    isBm25: false
                                });
                                offset += chunkLength;
                            }
                        }
                        sorted = chunks.sort(function (a, b) { return a.startPos - b.startPos; });
                        sections = [];
                        for (i = 0; i < sorted.length; i++) {
                            chunk = sorted[i];
                            section = sections[sections.length - 1];
                            if (!section || section.tokenCount + chunk.tokenCount > maxTokens) {
                                section = {
                                    chunks: [],
                                    score: 0,
                                    tokenCount: 0
                                };
                                sections.push(section);
                            }
                            section.chunks.push(chunk);
                            section.score += chunk.score;
                            section.tokenCount += chunk.tokenCount;
                        }
                        // Normalize section scores
                        sections.forEach(function (section) { return section.score /= section.chunks.length; });
                        // Return final rendered sections
                        return [2 /*return*/, sections.map(function (section) {
                                var text = '';
                                section.chunks.forEach(function (chunk) { return text += chunk.text; });
                                return {
                                    text: text,
                                    tokenCount: section.tokenCount,
                                    score: section.score,
                                    isBm25: false,
                                };
                            })];
                }
            });
        });
    };
    /**
     * Renders the top spans of text (sections) of the document based on the query result.
     * @remarks
     * The returned sections will be sorted by relevance and limited to the top `maxSections`.
     * @param maxTokens Maximum number of tokens per section.
     * @param maxSections Maximum number of sections to return.
     * @param overlappingChunks Optional. If true, overlapping chunks of text will be added to each section until the maxTokens is reached.
     * @returns Array of rendered text sections.
     */
    LocalDocumentResult.prototype.renderSections = function (maxTokens_1, maxSections_1) {
        return __awaiter(this, arguments, void 0, function (maxTokens, maxSections, overlappingChunks) {
            var text, length, chunks, topChunk, startPos, endPos, chunkText, tokens, sections, i, chunk, section, bm25Sections, i, chunk, section, connector_1, semanticDocTextSections, bm25DocTextSections;
            var _this = this;
            if (overlappingChunks === void 0) { overlappingChunks = true; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadText()];
                    case 1:
                        text = _a.sent();
                        return [4 /*yield*/, this.getLength()];
                    case 2:
                        length = _a.sent();
                        if (length <= maxTokens) {
                            return [2 /*return*/, [{
                                        text: text,
                                        tokenCount: length,
                                        score: 1.0,
                                        isBm25: false,
                                    }]];
                        }
                        chunks = this._chunks.map(function (chunk) {
                            var startPos = chunk.item.metadata.startPos;
                            var endPos = chunk.item.metadata.endPos;
                            var chunkText = text.substring(startPos, endPos + 1);
                            return {
                                text: chunkText,
                                startPos: startPos,
                                endPos: endPos,
                                score: chunk.score,
                                tokenCount: _this._tokenizer.encode(chunkText).length,
                                isBm25: Boolean(chunk.item.metadata.isBm25),
                            };
                        }).filter(function (chunk) { return chunk.tokenCount <= maxTokens; }).sort(function (a, b) { return a.startPos - b.startPos; });
                        // Check for no chunks
                        if (chunks.length === 0) {
                            topChunk = this._chunks[0];
                            startPos = topChunk.item.metadata.startPos;
                            endPos = topChunk.item.metadata.endPos;
                            chunkText = text.substring(startPos, endPos + 1);
                            tokens = this._tokenizer.encode(chunkText);
                            return [2 /*return*/, [{
                                        text: this._tokenizer.decode(tokens.slice(0, maxTokens)),
                                        tokenCount: maxTokens,
                                        score: topChunk.score,
                                        isBm25: false,
                                    }]];
                        }
                        sections = [];
                        for (i = 0; i < chunks.length; i++) {
                            chunk = chunks[i];
                            section = sections[sections.length - 1];
                            if (!chunk.isBm25) {
                                if (!section || section.tokenCount + chunk.tokenCount > maxTokens) {
                                    section = {
                                        chunks: [],
                                        score: 0,
                                        tokenCount: 0
                                    };
                                    sections.push(section);
                                }
                                section.chunks.push(chunk);
                                section.score += chunk.score;
                                section.tokenCount += chunk.tokenCount;
                            }
                        }
                        bm25Sections = [];
                        for (i = 0; i < chunks.length; i++) {
                            chunk = chunks[i];
                            section = bm25Sections[bm25Sections.length - 1];
                            if (chunk.isBm25) {
                                if (!section || section.tokenCount + chunk.tokenCount > maxTokens) {
                                    section = {
                                        chunks: [],
                                        score: 0,
                                        tokenCount: 0
                                    };
                                    bm25Sections.push(section);
                                }
                                section.chunks.push(chunk);
                                section.score += chunk.score;
                                section.tokenCount += chunk.tokenCount;
                            }
                        }
                        // Normalize section scores
                        sections.forEach(function (section) { return section.score /= section.chunks.length; });
                        bm25Sections.forEach(function (section) { return section.score /= section.chunks.length; });
                        // Sort sections by score and limit to maxSections
                        sections.sort(function (a, b) { return b.score - a.score; });
                        bm25Sections.sort(function (a, b) { return b.score - a.score; });
                        if (sections.length > maxSections) {
                            sections.splice(maxSections, sections.length - maxSections);
                        }
                        if (bm25Sections.length > maxSections) {
                            bm25Sections.splice(maxSections, bm25Sections.length - maxSections);
                        }
                        // Combine adjacent chunks of text
                        sections.forEach(function (section) {
                            for (var i = 0; i < section.chunks.length - 1; i++) {
                                var chunk = section.chunks[i];
                                var nextChunk = section.chunks[i + 1];
                                if (chunk.endPos + 1 === nextChunk.startPos) {
                                    chunk.text += nextChunk.text;
                                    chunk.endPos = nextChunk.endPos;
                                    chunk.tokenCount += nextChunk.tokenCount;
                                    section.chunks.splice(i + 1, 1);
                                    i--;
                                }
                            }
                        });
                        // Add overlapping chunks of text to each section until the maxTokens is reached
                        if (overlappingChunks) {
                            connector_1 = {
                                text: '\n\n...\n\n',
                                startPos: -1,
                                endPos: -1,
                                score: 0,
                                tokenCount: this._tokenizer.encode('\n\n...\n\n').length,
                                isBm25: false,
                            };
                            sections.forEach(function (section) {
                                // Insert connectors between chunks
                                if (section.chunks.length > 1) {
                                    for (var i = 0; i < section.chunks.length - 1; i++) {
                                        section.chunks.splice(i + 1, 0, connector_1);
                                        section.tokenCount += connector_1.tokenCount;
                                        i++;
                                    }
                                }
                                // Add chunks to beginning and end of the section until maxTokens is reached
                                var budget = maxTokens - section.tokenCount;
                                if (budget > 40) {
                                    var sectionStart = section.chunks[0].startPos;
                                    var sectionEnd = section.chunks[section.chunks.length - 1].endPos;
                                    if (sectionStart > 0) {
                                        var beforeTex = text.substring(0, section.chunks[0].startPos);
                                        var beforeTokens = _this.encodeBeforeText(beforeTex, Math.ceil(budget / 2));
                                        var beforeBudget = sectionEnd < text.length - 1 ? Math.min(beforeTokens.length, Math.ceil(budget / 2)) : Math.min(beforeTokens.length, budget);
                                        var chunk = {
                                            text: _this._tokenizer.decode(beforeTokens.slice(-beforeBudget)),
                                            startPos: sectionStart - beforeBudget,
                                            endPos: sectionStart - 1,
                                            score: 0,
                                            tokenCount: beforeBudget,
                                            isBm25: false,
                                        };
                                        section.chunks.unshift(chunk);
                                        section.tokenCount += chunk.tokenCount;
                                        budget -= chunk.tokenCount;
                                    }
                                    if (sectionEnd < text.length - 1) {
                                        var afterText = text.substring(sectionEnd + 1);
                                        var afterTokens = _this.encodeAfterText(afterText, budget);
                                        var afterBudget = Math.min(afterTokens.length, budget);
                                        var chunk = {
                                            text: _this._tokenizer.decode(afterTokens.slice(0, afterBudget)),
                                            startPos: sectionEnd + 1,
                                            endPos: sectionEnd + afterBudget,
                                            score: 0,
                                            tokenCount: afterBudget,
                                            isBm25: false,
                                        };
                                        section.chunks.push(chunk);
                                        section.tokenCount += chunk.tokenCount;
                                        budget -= chunk.tokenCount;
                                    }
                                }
                            });
                        }
                        semanticDocTextSections = sections.map(function (section) {
                            var text = '';
                            section.chunks.forEach(function (chunk) { return text += chunk.text; });
                            return {
                                text: text,
                                tokenCount: section.tokenCount,
                                score: section.score,
                                isBm25: false,
                            };
                        });
                        bm25DocTextSections = bm25Sections.map(function (section) {
                            var text = '';
                            section.chunks.forEach(function (chunk) { return text += chunk.text; });
                            return {
                                text: text,
                                tokenCount: section.tokenCount,
                                score: section.score,
                                isBm25: true,
                            };
                        });
                        // Return final rendered sections
                        return [2 /*return*/, __spreadArray(__spreadArray([], semanticDocTextSections, true), bm25DocTextSections, true)];
                }
            });
        });
    };
    LocalDocumentResult.prototype.encodeBeforeText = function (text, budget) {
        var maxLength = budget * 8;
        var substr = text.length <= maxLength ? text : text.substring(text.length - maxLength);
        return this._tokenizer.encode(substr);
    };
    LocalDocumentResult.prototype.encodeAfterText = function (text, budget) {
        var maxLength = budget * 8;
        var substr = text.length <= maxLength ? text : text.substring(0, maxLength);
        return this._tokenizer.encode(substr);
    };
    return LocalDocumentResult;
}(LocalDocument_1.LocalDocument));
exports.LocalDocumentResult = LocalDocumentResult;
