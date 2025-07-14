"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPT3Tokenizer = void 0;
var gpt_3_encoder_1 = require("gpt-3-encoder");
/**
 * Tokenizer that uses GPT-3's encoder.
 */
var GPT3Tokenizer = /** @class */ (function () {
    function GPT3Tokenizer() {
    }
    GPT3Tokenizer.prototype.decode = function (tokens) {
        return (0, gpt_3_encoder_1.decode)(tokens);
    };
    GPT3Tokenizer.prototype.encode = function (text) {
        return (0, gpt_3_encoder_1.encode)(text);
    };
    return GPT3Tokenizer;
}());
exports.GPT3Tokenizer = GPT3Tokenizer;
