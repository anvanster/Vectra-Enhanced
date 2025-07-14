import { MetadataTypes } from './types';

export interface VectorValidationOptions {
    dimensions?: number;
    minValue?: number;
    maxValue?: number;
    allowNaN?: boolean;
    allowInfinity?: boolean;
    normalize?: boolean;
}

export interface MetadataSchema {
    type: 'object';
    properties?: Record<string, PropertySchema>;
    required?: string[];
    additionalProperties?: boolean;
}

export interface PropertySchema {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    pattern?: string;
    enum?: any[];
    items?: PropertySchema;
}

export class ValidationError extends Error {
    constructor(message: string, public field?: string, public value?: any) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class Validator {
    /**
     * Validates a vector according to the specified options
     */
    static validateVector(vector: number[], options: VectorValidationOptions = {}): void {
        // Check if vector exists
        if (!vector || !Array.isArray(vector)) {
            throw new ValidationError('Vector must be a non-empty array', 'vector', vector);
        }

        // Check dimensions if specified
        if (options.dimensions !== undefined && vector.length !== options.dimensions) {
            throw new ValidationError(
                `Vector must have exactly ${options.dimensions} dimensions, got ${vector.length}`,
                'vector.length',
                vector.length
            );
        }

        // Check for empty vector
        if (vector.length === 0) {
            throw new ValidationError('Vector cannot be empty', 'vector', vector);
        }

        // Validate each element
        for (let i = 0; i < vector.length; i++) {
            const value = vector[i];

            // Check if it's a number
            if (typeof value !== 'number') {
                throw new ValidationError(
                    `Vector element at index ${i} must be a number, got ${typeof value}`,
                    `vector[${i}]`,
                    value
                );
            }

            // Check for NaN
            if (!options.allowNaN && isNaN(value)) {
                throw new ValidationError(
                    `Vector element at index ${i} is NaN`,
                    `vector[${i}]`,
                    value
                );
            }

            // Check for Infinity
            if (!options.allowInfinity && !isFinite(value)) {
                throw new ValidationError(
                    `Vector element at index ${i} is Infinity`,
                    `vector[${i}]`,
                    value
                );
            }

            // Check min/max values
            if (options.minValue !== undefined && value < options.minValue) {
                throw new ValidationError(
                    `Vector element at index ${i} is below minimum value ${options.minValue}`,
                    `vector[${i}]`,
                    value
                );
            }

            if (options.maxValue !== undefined && value > options.maxValue) {
                throw new ValidationError(
                    `Vector element at index ${i} is above maximum value ${options.maxValue}`,
                    `vector[${i}]`,
                    value
                );
            }
        }

        // Normalize if requested
        if (options.normalize) {
            const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
            if (magnitude === 0) {
                throw new ValidationError('Cannot normalize zero vector', 'vector', vector);
            }
        }
    }

    /**
     * Validates metadata against a schema
     */
    static validateMetadata(
        metadata: Record<string, MetadataTypes>, 
        schema?: MetadataSchema
    ): void {
        if (!metadata || typeof metadata !== 'object') {
            throw new ValidationError('Metadata must be an object', 'metadata', metadata);
        }

        // If no schema provided, just do basic validation
        if (!schema) {
            // Check for valid property names
            for (const key of Object.keys(metadata)) {
                if (typeof key !== 'string' || key.length === 0) {
                    throw new ValidationError('Metadata keys must be non-empty strings', key, key);
                }
                
                // Check for reserved keys
                if (key.startsWith('_')) {
                    throw new ValidationError(
                        'Metadata keys cannot start with underscore (reserved)',
                        key,
                        key
                    );
                }
            }
            return;
        }

        // Validate against schema
        this.validateObject(metadata, schema, 'metadata');
    }

    private static validateObject(
        obj: Record<string, any>,
        schema: MetadataSchema,
        path: string
    ): void {
        // Check required properties
        if (schema.required) {
            for (const requiredKey of schema.required) {
                if (!(requiredKey in obj)) {
                    throw new ValidationError(
                        `Missing required property: ${requiredKey}`,
                        `${path}.${requiredKey}`,
                        undefined
                    );
                }
            }
        }

        // Validate each property
        for (const [key, value] of Object.entries(obj)) {
            const propertyPath = `${path}.${key}`;

            // Check if additional properties are allowed
            if (schema.properties && !(key in schema.properties)) {
                if (schema.additionalProperties === false) {
                    throw new ValidationError(
                        `Additional property not allowed: ${key}`,
                        propertyPath,
                        value
                    );
                }
                continue;
            }

            // Validate property if schema exists
            if (schema.properties && schema.properties[key]) {
                this.validateProperty(value, schema.properties[key], propertyPath);
            }
        }
    }

    private static validateProperty(
        value: any,
        schema: PropertySchema,
        path: string
    ): void {
        // Check type
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== schema.type) {
            throw new ValidationError(
                `Expected ${schema.type} but got ${actualType}`,
                path,
                value
            );
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
            throw new ValidationError(
                `Value must be one of: ${schema.enum.join(', ')}`,
                path,
                value
            );
        }
    }

    private static validateString(
        value: string,
        schema: PropertySchema,
        path: string
    ): void {
        if (schema.minLength !== undefined && value.length < schema.minLength) {
            throw new ValidationError(
                `String length must be at least ${schema.minLength}`,
                path,
                value
            );
        }

        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            throw new ValidationError(
                `String length must be at most ${schema.maxLength}`,
                path,
                value
            );
        }

        if (schema.pattern) {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(value)) {
                throw new ValidationError(
                    `String does not match pattern: ${schema.pattern}`,
                    path,
                    value
                );
            }
        }
    }

    private static validateNumber(
        value: number,
        schema: PropertySchema,
        path: string
    ): void {
        if (schema.minimum !== undefined && value < schema.minimum) {
            throw new ValidationError(
                `Number must be at least ${schema.minimum}`,
                path,
                value
            );
        }

        if (schema.maximum !== undefined && value > schema.maximum) {
            throw new ValidationError(
                `Number must be at most ${schema.maximum}`,
                path,
                value
            );
        }
    }

    private static validateArray(
        value: any[],
        schema: PropertySchema,
        path: string
    ): void {
        if (schema.minLength !== undefined && value.length < schema.minLength) {
            throw new ValidationError(
                `Array must have at least ${schema.minLength} items`,
                path,
                value
            );
        }

        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            throw new ValidationError(
                `Array must have at most ${schema.maxLength} items`,
                path,
                value
            );
        }

        // Validate array items if schema provided
        if (schema.items) {
            for (let i = 0; i < value.length; i++) {
                this.validateProperty(value[i], schema.items, `${path}[${i}]`);
            }
        }
    }

    /**
     * Creates a validator function for repeated use
     */
    static createValidator(
        vectorOptions?: VectorValidationOptions,
        metadataSchema?: MetadataSchema
    ): (vector: number[], metadata: Record<string, MetadataTypes>) => void {
        return (vector: number[], metadata: Record<string, MetadataTypes>) => {
            if (vectorOptions) {
                this.validateVector(vector, vectorOptions);
            }
            if (metadataSchema) {
                this.validateMetadata(metadata, metadataSchema);
            }
        };
    }
}