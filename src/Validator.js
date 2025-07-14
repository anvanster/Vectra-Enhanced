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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = exports.ValidationError = void 0;
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message, field, value) {
        var _this = _super.call(this, message) || this;
        _this.field = field;
        _this.value = value;
        _this.name = 'ValidationError';
        return _this;
    }
    return ValidationError;
}(Error));
exports.ValidationError = ValidationError;
var Validator = /** @class */ (function () {
    function Validator() {
    }
    /**
     * Validates a vector according to the specified options
     */
    Validator.validateVector = function (vector, options) {
        if (options === void 0) { options = {}; }
        // Check if vector exists
        if (!vector || !Array.isArray(vector)) {
            throw new ValidationError('Vector must be a non-empty array', 'vector', vector);
        }
        // Check dimensions if specified
        if (options.dimensions !== undefined && vector.length !== options.dimensions) {
            throw new ValidationError("Vector must have exactly ".concat(options.dimensions, " dimensions, got ").concat(vector.length), 'vector.length', vector.length);
        }
        // Check for empty vector
        if (vector.length === 0) {
            throw new ValidationError('Vector cannot be empty', 'vector', vector);
        }
        // Validate each element
        for (var i = 0; i < vector.length; i++) {
            var value = vector[i];
            // Check if it's a number
            if (typeof value !== 'number') {
                throw new ValidationError("Vector element at index ".concat(i, " must be a number, got ").concat(typeof value), "vector[".concat(i, "]"), value);
            }
            // Check for NaN
            if (!options.allowNaN && isNaN(value)) {
                throw new ValidationError("Vector element at index ".concat(i, " is NaN"), "vector[".concat(i, "]"), value);
            }
            // Check for Infinity
            if (!options.allowInfinity && !isFinite(value)) {
                throw new ValidationError("Vector element at index ".concat(i, " is Infinity"), "vector[".concat(i, "]"), value);
            }
            // Check min/max values
            if (options.minValue !== undefined && value < options.minValue) {
                throw new ValidationError("Vector element at index ".concat(i, " is below minimum value ").concat(options.minValue), "vector[".concat(i, "]"), value);
            }
            if (options.maxValue !== undefined && value > options.maxValue) {
                throw new ValidationError("Vector element at index ".concat(i, " is above maximum value ").concat(options.maxValue), "vector[".concat(i, "]"), value);
            }
        }
        // Normalize if requested
        if (options.normalize) {
            var magnitude = Math.sqrt(vector.reduce(function (sum, val) { return sum + val * val; }, 0));
            if (magnitude === 0) {
                throw new ValidationError('Cannot normalize zero vector', 'vector', vector);
            }
        }
    };
    /**
     * Validates metadata against a schema
     */
    Validator.validateMetadata = function (metadata, schema) {
        if (!metadata || typeof metadata !== 'object') {
            throw new ValidationError('Metadata must be an object', 'metadata', metadata);
        }
        // If no schema provided, just do basic validation
        if (!schema) {
            // Check for valid property names
            for (var _i = 0, _a = Object.keys(metadata); _i < _a.length; _i++) {
                var key = _a[_i];
                if (typeof key !== 'string' || key.length === 0) {
                    throw new ValidationError('Metadata keys must be non-empty strings', key, key);
                }
                // Check for reserved keys
                if (key.startsWith('_')) {
                    throw new ValidationError('Metadata keys cannot start with underscore (reserved)', key, key);
                }
            }
            return;
        }
        // Validate against schema
        this.validateObject(metadata, schema, 'metadata');
    };
    Validator.validateObject = function (obj, schema, path) {
        // Check required properties
        if (schema.required) {
            for (var _i = 0, _a = schema.required; _i < _a.length; _i++) {
                var requiredKey = _a[_i];
                if (!(requiredKey in obj)) {
                    throw new ValidationError("Missing required property: ".concat(requiredKey), "".concat(path, ".").concat(requiredKey), undefined);
                }
            }
        }
        // Validate each property
        for (var _b = 0, _c = Object.entries(obj); _b < _c.length; _b++) {
            var _d = _c[_b], key = _d[0], value = _d[1];
            var propertyPath = "".concat(path, ".").concat(key);
            // Check if additional properties are allowed
            if (schema.properties && !(key in schema.properties)) {
                if (schema.additionalProperties === false) {
                    throw new ValidationError("Additional property not allowed: ".concat(key), propertyPath, value);
                }
                continue;
            }
            // Validate property if schema exists
            if (schema.properties && schema.properties[key]) {
                this.validateProperty(value, schema.properties[key], propertyPath);
            }
        }
    };
    Validator.validateProperty = function (value, schema, path) {
        // Check type
        var actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== schema.type) {
            throw new ValidationError("Expected ".concat(schema.type, " but got ").concat(actualType), path, value);
        }
        switch (schema.type) {
            case 'string':
                this.validateString(value, schema, path);
                break;
            case 'number':
                this.validateNumber(value, schema, path);
                break;
            case 'boolean':
                // Boolean is already validated by type check
                break;
            case 'array':
                this.validateArray(value, schema, path);
                break;
            case 'object':
                if (value === null) {
                    throw new ValidationError('Value cannot be null', path, value);
                }
                break;
        }
        // Check enum values
        if (schema.enum && !schema.enum.includes(value)) {
            throw new ValidationError("Value must be one of: ".concat(schema.enum.join(', ')), path, value);
        }
    };
    Validator.validateString = function (value, schema, path) {
        if (schema.minLength !== undefined && value.length < schema.minLength) {
            throw new ValidationError("String length must be at least ".concat(schema.minLength), path, value);
        }
        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            throw new ValidationError("String length must be at most ".concat(schema.maxLength), path, value);
        }
        if (schema.pattern) {
            var regex = new RegExp(schema.pattern);
            if (!regex.test(value)) {
                throw new ValidationError("String does not match pattern: ".concat(schema.pattern), path, value);
            }
        }
    };
    Validator.validateNumber = function (value, schema, path) {
        if (schema.minimum !== undefined && value < schema.minimum) {
            throw new ValidationError("Number must be at least ".concat(schema.minimum), path, value);
        }
        if (schema.maximum !== undefined && value > schema.maximum) {
            throw new ValidationError("Number must be at most ".concat(schema.maximum), path, value);
        }
    };
    Validator.validateArray = function (value, schema, path) {
        if (schema.minLength !== undefined && value.length < schema.minLength) {
            throw new ValidationError("Array must have at least ".concat(schema.minLength, " items"), path, value);
        }
        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            throw new ValidationError("Array must have at most ".concat(schema.maxLength, " items"), path, value);
        }
        // Validate array items if schema provided
        if (schema.items) {
            for (var i = 0; i < value.length; i++) {
                this.validateProperty(value[i], schema.items, "".concat(path, "[").concat(i, "]"));
            }
        }
    };
    /**
     * Creates a validator function for repeated use
     */
    Validator.createValidator = function (vectorOptions, metadataSchema) {
        var _this = this;
        return function (vector, metadata) {
            if (vectorOptions) {
                _this.validateVector(vector, vectorOptions);
            }
            if (metadataSchema) {
                _this.validateMetadata(metadata, metadataSchema);
            }
        };
    };
    return Validator;
}());
exports.Validator = Validator;
