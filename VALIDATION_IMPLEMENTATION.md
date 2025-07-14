# Vector and Metadata Validation Implementation

## Overview

Vectra now includes comprehensive validation for both vectors and metadata, ensuring data integrity and consistency throughout the database.

## Features

### 1. Vector Validation

#### Supported Constraints:
- **Dimensions**: Enforce exact vector dimensions
- **Value Range**: Set min/max values for vector elements
- **NaN/Infinity**: Control whether special values are allowed
- **Type Safety**: Ensure all elements are numbers

#### Example:
```typescript
const vectorOptions: VectorValidationOptions = {
    dimensions: 384,        // Exact dimensions required
    minValue: -1,          // Minimum value for any element
    maxValue: 1,           // Maximum value for any element
    allowNaN: false,       // Reject NaN values
    allowInfinity: false,  // Reject Infinity values
    normalize: false       // Don't auto-normalize
};

await index.createIndex({ 
    version: 1,
    vectorOptions 
});
```

### 2. Metadata Validation with JSON Schema

#### Supported Types:
- `string`: With minLength, maxLength, pattern, enum
- `number`: With minimum, maximum, enum
- `boolean`: Simple true/false
- `array`: With item type validation
- `object`: Nested object validation

#### Example Schema:
```typescript
const metadataSchema: MetadataSchema = {
    type: 'object',
    properties: {
        title: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 200 
        },
        category: { 
            type: 'string', 
            enum: ['article', 'product', 'review'] 
        },
        score: { 
            type: 'number', 
            minimum: 0, 
            maximum: 100 
        },
        tags: { 
            type: 'array', 
            items: { type: 'string' } 
        },
        active: { 
            type: 'boolean' 
        }
    },
    required: ['title', 'category'],
    additionalProperties: false  // No extra fields allowed
};

await index.createIndex({ 
    version: 1,
    metadata_config: { schema: metadataSchema }
});
```

### 3. Built-in Validations

Even without a schema, the following rules are enforced:
- Metadata keys must be non-empty strings
- Keys starting with underscore (_) are reserved
- Vector must be a non-empty array of numbers

## Usage

### Basic Usage
```typescript
const index = new LocalIndex('./my-index');

// Create index with validation
await index.createIndex({
    version: 1,
    vectorOptions: {
        dimensions: 3,
        minValue: -1,
        maxValue: 1
    },
    metadata_config: {
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', minLength: 1 }
            },
            required: ['name']
        }
    }
});

// Valid insert
await index.insertItem({
    id: 'item-1',
    vector: [0.5, -0.5, 0],
    metadata: { name: 'Valid Item' }
});

// Invalid - wrong dimensions
try {
    await index.insertItem({
        id: 'item-2',
        vector: [1, 2], // Only 2 dimensions!
        metadata: { name: 'Invalid' }
    });
} catch (err) {
    // Error: Vector must have exactly 3 dimensions
}
```

### Direct Validation
```typescript
import { Validator } from './Validator';

// Validate vector directly
Validator.validateVector([1, 2, 3], { dimensions: 3 });

// Validate metadata directly
Validator.validateMetadata(
    { name: 'test', age: 25 },
    { 
        type: 'object',
        properties: {
            name: { type: 'string' },
            age: { type: 'number', minimum: 0 }
        }
    }
);

// Create reusable validator
const validator = Validator.createValidator(
    { dimensions: 3 },
    { type: 'object', required: ['name'] }
);

validator([1, 2, 3], { name: 'test' }); // Valid
validator([1, 2], { name: 'test' });    // Throws error
```

## Error Handling

Validation errors provide detailed information:
```typescript
try {
    await index.insertItem(invalidItem);
} catch (err) {
    if (err.message.includes('validation failed')) {
        console.error('Validation error:', err.message);
        // Examples:
        // "Vector validation failed: Vector must have exactly 384 dimensions, got 3"
        // "Metadata validation failed: Missing required property: category"
        // "Vector validation failed: Vector element at index 2 is NaN"
    }
}
```

## Schema Examples

### Product Catalog
```typescript
const productSchema: MetadataSchema = {
    type: 'object',
    properties: {
        sku: { type: 'string', pattern: '^[A-Z0-9]{8}$' },
        name: { type: 'string', minLength: 1, maxLength: 200 },
        price: { type: 'number', minimum: 0 },
        inStock: { type: 'boolean' },
        categories: { 
            type: 'array', 
            items: { type: 'string' },
            minLength: 1
        }
    },
    required: ['sku', 'name', 'price', 'inStock'],
    additionalProperties: false
};
```

### Document Store
```typescript
const documentSchema: MetadataSchema = {
    type: 'object',
    properties: {
        documentId: { type: 'string' },
        title: { type: 'string', maxLength: 500 },
        author: { type: 'string' },
        publishDate: { type: 'string', pattern: '^\d{4}-\d{2}-\d{2}$' },
        wordCount: { type: 'number', minimum: 0 },
        language: { type: 'string', enum: ['en', 'es', 'fr', 'de'] }
    },
    required: ['documentId', 'title']
};
```

## Benefits

1. **Data Integrity**: Prevent invalid data from entering the database
2. **Type Safety**: Catch errors early before they corrupt the index
3. **Consistency**: Ensure all items follow the same structure
4. **Documentation**: Schema serves as documentation for data structure
5. **Performance**: Validation happens before expensive operations

## Performance Considerations

- Validation adds minimal overhead (< 1ms per item)
- Validation happens in-memory before any I/O
- Failed validations prevent unnecessary disk operations
- Schema validation uses optimized property lookups

## Migration Guide

For existing indices without validation:
1. Validation is optional - existing indices work without changes
2. Add validation to new indices gradually
3. Use loose schemas initially, tighten over time
4. Consider data migration tools for schema changes

## Best Practices

1. **Start Simple**: Begin with basic dimension validation
2. **Document Schemas**: Keep schemas in version control
3. **Validate Early**: Catch errors at data entry points
4. **Use Enums**: For fields with known values
5. **Test Schemas**: Write tests for your validation rules
6. **Version Schemas**: Plan for schema evolution

This implementation provides robust data validation while maintaining the simplicity and performance of the Vectra vector database.