import { expect } from 'chai';
import { LocalIndex } from '../lib/LocalIndex';
import { Validator, ValidationError, VectorValidationOptions, MetadataSchema } from '../lib/Validator';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('Validation Tests', function() {
    this.timeout(10000);
    const testIndexPath = path.join(__dirname, 'test-validation-index');
    let index: LocalIndex;

    beforeEach(async () => {
        try {
            await fs.rm(testIndexPath, { recursive: true });
        } catch (err) {
            // Ignore if doesn't exist
        }
    });

    afterEach(async () => {
        try {
            await fs.rm(testIndexPath, { recursive: true });
        } catch (err) {
            // Ignore if doesn't exist
        }
    });

    describe('Vector Validation', () => {
        it('should validate vector dimensions', async () => {
            const vectorOptions: VectorValidationOptions = {
                dimensions: 3
            };

            index = new LocalIndex(testIndexPath);
            await index.createIndex({ 
                version: 1,
                vectorOptions 
            });

            // Valid vector
            await index.insertItem({
                id: 'valid-1',
                vector: [1, 2, 3],
                metadata: {}
            });

            // Invalid vector - wrong dimensions
            let error: any;
            try {
                await index.insertItem({
                    id: 'invalid-1',
                    vector: [1, 2], // Only 2 dimensions
                    metadata: {}
                });
            } catch (err) {
                error = err;
            }

            expect(error).to.exist;
            expect(error.message).to.include('Vector must have exactly 3 dimensions');
        });

        it('should validate vector values', async () => {
            const vectorOptions: VectorValidationOptions = {
                minValue: -1,
                maxValue: 1,
                allowNaN: false,
                allowInfinity: false
            };

            index = new LocalIndex(testIndexPath);
            await index.createIndex({ 
                version: 1,
                vectorOptions 
            });

            // Valid vector
            await index.insertItem({
                id: 'valid-1',
                vector: [0.5, -0.5, 0],
                metadata: {}
            });

            // Invalid vector - value too large
            try {
                await index.insertItem({
                    id: 'invalid-1',
                    vector: [2, 0, 0], // 2 > maxValue
                    metadata: {}
                });
                expect.fail('Should have thrown validation error');
            } catch (err: any) {
                expect(err.message).to.include('above maximum value');
            }

            // Invalid vector - NaN
            try {
                await index.insertItem({
                    id: 'invalid-2',
                    vector: [0, NaN, 0],
                    metadata: {}
                });
                expect.fail('Should have thrown validation error');
            } catch (err: any) {
                expect(err.message).to.include('NaN');
            }

            // Invalid vector - Infinity
            try {
                await index.insertItem({
                    id: 'invalid-3',
                    vector: [0, Infinity, 0],
                    metadata: {}
                });
                expect.fail('Should have thrown validation error');
            } catch (err: any) {
                expect(err.message).to.include('Infinity');
            }
        });

        it('should reject non-numeric vector elements', async () => {
            index = new LocalIndex(testIndexPath);
            await index.createIndex({ version: 1 });

            try {
                await index.insertItem({
                    id: 'invalid',
                    vector: [1, 'two', 3] as any,
                    metadata: {}
                });
                expect.fail('Should have thrown validation error');
            } catch (err: any) {
                expect(err.message).to.include('must be a number');
            }
        });
    });

    describe('Metadata Validation', () => {
        it('should validate metadata schema', async () => {
            const metadataSchema: MetadataSchema = {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1, maxLength: 100 },
                    age: { type: 'number', minimum: 0, maximum: 150 },
                    active: { type: 'boolean' },
                    tags: { type: 'array', items: { type: 'string' } }
                },
                required: ['name', 'active'],
                additionalProperties: false
            };

            index = new LocalIndex(testIndexPath);
            await index.createIndex({ 
                version: 1,
                metadata_config: { schema: metadataSchema }
            });

            // Valid metadata
            await index.insertItem({
                id: 'valid-1',
                vector: [1, 2, 3],
                metadata: {
                    name: 'Test Item',
                    age: 25,
                    active: true,
                    tags: ['tag1', 'tag2']
                }
            });

            // Missing required field
            try {
                await index.insertItem({
                    id: 'invalid-1',
                    vector: [1, 2, 3],
                    metadata: {
                        name: 'Test'
                        // missing 'active' field
                    }
                });
                expect.fail('Should have thrown validation error');
            } catch (err: any) {
                expect(err.message).to.include('Missing required property: active');
            }

            // Invalid type
            try {
                await index.insertItem({
                    id: 'invalid-2',
                    vector: [1, 2, 3],
                    metadata: {
                        name: 'Test',
                        active: 'yes', // Should be boolean
                        age: 25
                    }
                });
                expect.fail('Should have thrown validation error');
            } catch (err: any) {
                expect(err.message).to.include('Expected boolean but got string');
            }

            // Additional property not allowed
            try {
                await index.insertItem({
                    id: 'invalid-3',
                    vector: [1, 2, 3],
                    metadata: {
                        name: 'Test',
                        active: true,
                        extra: 'field'
                    }
                });
                expect.fail('Should have thrown validation error');
            } catch (err: any) {
                expect(err.message).to.include('Additional property not allowed');
            }
        });

        it('should validate string constraints', async () => {
            const metadataSchema: MetadataSchema = {
                type: 'object',
                properties: {
                    code: { 
                        type: 'string', 
                        pattern: '^[A-Z]{3}$' // Exactly 3 uppercase letters
                    },
                    description: {
                        type: 'string',
                        minLength: 10,
                        maxLength: 100
                    }
                }
            };

            index = new LocalIndex(testIndexPath);
            await index.createIndex({ 
                version: 1,
                metadata_config: { schema: metadataSchema }
            });

            // Valid
            await index.insertItem({
                id: 'valid-1',
                vector: [1, 2, 3],
                metadata: {
                    code: 'ABC',
                    description: 'This is a valid description'
                }
            });

            // Invalid pattern
            try {
                await index.insertItem({
                    id: 'invalid-1',
                    vector: [1, 2, 3],
                    metadata: {
                        code: 'abc' // lowercase
                    }
                });
                expect.fail('Should have thrown validation error');
            } catch (err: any) {
                expect(err.message).to.include('does not match pattern');
            }

            // String too short
            try {
                await index.insertItem({
                    id: 'invalid-2',
                    vector: [1, 2, 3],
                    metadata: {
                        description: 'Too short'
                    }
                });
                expect.fail('Should have thrown validation error');
            } catch (err: any) {
                expect(err.message).to.include('String length must be at least 10');
            }
        });

        it('should validate enum values', async () => {
            const metadataSchema: MetadataSchema = {
                type: 'object',
                properties: {
                    status: { 
                        type: 'string', 
                        enum: ['pending', 'active', 'completed', 'cancelled']
                    },
                    priority: {
                        type: 'number',
                        enum: [1, 2, 3]
                    }
                }
            };

            index = new LocalIndex(testIndexPath);
            await index.createIndex({ 
                version: 1,
                metadata_config: { schema: metadataSchema }
            });

            // Valid
            await index.insertItem({
                id: 'valid-1',
                vector: [1, 2, 3],
                metadata: {
                    status: 'active',
                    priority: 2
                }
            });

            // Invalid enum value
            try {
                await index.insertItem({
                    id: 'invalid-1',
                    vector: [1, 2, 3],
                    metadata: {
                        status: 'in-progress' // Not in enum
                    }
                });
                expect.fail('Should have thrown validation error');
            } catch (err: any) {
                expect(err.message).to.include('Value must be one of');
            }
        });

        it('should reject metadata with reserved keys', async () => {
            index = new LocalIndex(testIndexPath);
            await index.createIndex({ version: 1 });

            try {
                await index.insertItem({
                    id: 'invalid',
                    vector: [1, 2, 3],
                    metadata: {
                        _reserved: 'value' // Starts with underscore
                    }
                });
                expect.fail('Should have thrown validation error');
            } catch (err: any) {
                expect(err.message).to.include('cannot start with underscore');
            }
        });
    });

    describe('Direct Validator Tests', () => {
        it('should validate vectors directly', () => {
            // Valid vector
            expect(() => {
                Validator.validateVector([1, 2, 3], { dimensions: 3 });
            }).to.not.throw();

            // Invalid - wrong dimensions
            expect(() => {
                Validator.validateVector([1, 2], { dimensions: 3 });
            }).to.throw(ValidationError);

            // Invalid - empty vector
            expect(() => {
                Validator.validateVector([], {});
            }).to.throw(ValidationError);

            // Invalid - not an array
            expect(() => {
                Validator.validateVector(null as any, {});
            }).to.throw(ValidationError);
        });

        it('should create reusable validator', () => {
            const validator = Validator.createValidator(
                { dimensions: 3, minValue: -1, maxValue: 1 },
                { 
                    type: 'object',
                    properties: {
                        name: { type: 'string' }
                    },
                    required: ['name']
                }
            );

            // Valid
            expect(() => {
                validator([0, 0.5, -0.5], { name: 'test' });
            }).to.not.throw();

            // Invalid vector
            expect(() => {
                validator([0, 2, 0], { name: 'test' });
            }).to.throw();

            // Invalid metadata
            expect(() => {
                validator([0, 0, 0], {});
            }).to.throw();
        });
    });

    describe('Integration Tests', () => {
        it('should handle validation with concurrent operations', async () => {
            const vectorOptions: VectorValidationOptions = {
                dimensions: 3,
                minValue: -1,
                maxValue: 1
            };

            index = new LocalIndex(testIndexPath);
            await index.createIndex({ 
                version: 1,
                vectorOptions 
            });

            const promises: Promise<any>[] = [];
            
            // Mix of valid and invalid operations
            for (let i = 0; i < 10; i++) {
                if (i % 2 === 0) {
                    // Valid
                    promises.push(
                        index.insertItem({
                            id: `valid-${i}`,
                            vector: [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1],
                            metadata: { index: i }
                        })
                    );
                } else {
                    // Invalid
                    promises.push(
                        index.insertItem({
                            id: `invalid-${i}`,
                            vector: [5, 5, 5], // Out of range
                            metadata: { index: i }
                        }).catch(err => ({ error: err.message }))
                    );
                }
            }

            const results = await Promise.all(promises);
            
            // Check that valid items succeeded and invalid ones failed
            let successCount = 0;
            let errorCount = 0;
            
            for (const result of results) {
                if (result && result.error) {
                    errorCount++;
                    expect(result.error).to.include('validation failed');
                } else {
                    successCount++;
                }
            }

            expect(successCount).to.equal(5);
            expect(errorCount).to.equal(5);
        });

        it('should persist validation options', async () => {
            const vectorOptions: VectorValidationOptions = {
                dimensions: 4,
                minValue: 0,
                maxValue: 1
            };

            const metadataSchema: MetadataSchema = {
                type: 'object',
                properties: {
                    category: { type: 'string' }
                },
                required: ['category']
            };

            // Create index with validation
            let index1 = new LocalIndex(testIndexPath);
            await index1.createIndex({ 
                version: 1,
                vectorOptions,
                metadata_config: { schema: metadataSchema }
            });

            await index1.insertItem({
                id: 'test-1',
                vector: [0.1, 0.2, 0.3, 0.4],
                metadata: { category: 'test' }
            });

            // Load index in new instance
            let index2 = new LocalIndex(testIndexPath);
            
            // Validation should still be enforced
            try {
                await index2.insertItem({
                    id: 'test-2',
                    vector: [1, 2, 3], // Wrong dimensions
                    metadata: { category: 'test' }
                });
                expect.fail('Should have thrown validation error');
            } catch (err: any) {
                expect(err.message).to.include('dimensions');
            }

            try {
                await index2.insertItem({
                    id: 'test-3',
                    vector: [0.1, 0.2, 0.3, 0.4],
                    metadata: {} // Missing required field
                });
                expect.fail('Should have thrown validation error');
            } catch (err: any) {
                expect(err.message).to.include('required');
            }
        });
    });
});