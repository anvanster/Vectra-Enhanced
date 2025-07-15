import { expect } from 'chai';
import { PathValidator } from '../src/PathValidator';
import * as path from 'path';

describe('PathValidator Security Tests', () => {
    describe('validateId', () => {
        it('should accept valid IDs', () => {
            const validIds = [
                'test123',
                'my-id',
                'my_id',
                'ABC123',
                '123',
                'a',
                'test-123_ABC'
            ];

            validIds.forEach(id => {
                expect(() => PathValidator.validateId(id)).to.not.throw();
                expect(PathValidator.validateId(id)).to.equal(id);
            });
        });

        it('should reject invalid IDs', () => {
            const invalidIds = [
                '../etc/passwd',
                '../../secret',
                '/etc/passwd',
                '~/secret',
                'test/../../etc',
                'test%2F..%2F..%2Fetc',
                'test\0',
                'test\\..\\etc',
                '.hidden',
                'test.txt',
                'test@example',
                'test#123',
                'test$123',
                'test!',
                '',
                null,
                undefined,
                123 as any,
                {} as any
            ];

            invalidIds.forEach(id => {
                if (id !== null && id !== undefined) {
                    expect(() => PathValidator.validateId(id)).to.throw();
                }
            });
        });

        it('should reject IDs that are too long', () => {
            const longId = 'a'.repeat(256);
            expect(() => PathValidator.validateId(longId)).to.throw('ID is too long');
        });
    });

    describe('validateFilename', () => {
        it('should accept valid filenames', () => {
            const validFilenames = [
                'test.json',
                'my-file.txt',
                'my_file.log',
                'ABC123.data',
                '123.tmp',
                'a.b',
                'test-123_ABC.json'
            ];

            validFilenames.forEach(filename => {
                expect(() => PathValidator.validateFilename(filename)).to.not.throw();
                expect(PathValidator.validateFilename(filename)).to.equal(filename);
            });
        });

        it('should reject invalid filenames', () => {
            const invalidFilenames = [
                '../etc/passwd',
                '../../secret.txt',
                '/etc/passwd',
                '~/secret.txt',
                'test/../../../etc/passwd',
                'test%2F..%2F..%2Fetc%2Fpasswd',
                'test\0.txt',
                'test\\..\\etc\\passwd',
                '.hidden',
                '..',
                '.',
                'test@example.txt',
                'test#123.json',
                'test$123.log',
                'test!.txt',
                '',
                null,
                undefined,
                123 as any,
                {} as any
            ];

            invalidFilenames.forEach(filename => {
                if (filename !== null && filename !== undefined) {
                    expect(() => PathValidator.validateFilename(filename)).to.throw();
                }
            });
        });

        it('should reject hidden files', () => {
            expect(() => PathValidator.validateFilename('.hidden')).to.throw('cannot start with a dot');
            expect(() => PathValidator.validateFilename('.gitignore')).to.throw('cannot start with a dot');
        });
    });

    describe('safeJoin', () => {
        const basePath = '/safe/directory';

        it('should safely join valid paths', () => {
            const testCases = [
                { filename: 'test.json', expected: path.join(basePath, 'test.json') },
                { filename: 'subdir.data', expected: path.join(basePath, 'subdir.data') }
            ];

            testCases.forEach(({ filename, expected }) => {
                const result = PathValidator.safeJoin(basePath, filename);
                expect(path.normalize(result)).to.equal(path.normalize(expected));
            });
        });

        it('should prevent path traversal attempts', () => {
            const maliciousFilenames = [
                '../../../etc/passwd',
                '..\\..\\..\\windows\\system32',
                'test/../../etc/passwd',
                '../../../../root/.ssh/id_rsa'
            ];

            maliciousFilenames.forEach(filename => {
                expect(() => PathValidator.safeJoin(basePath, filename)).to.throw();
            });
        });

        it('should handle relative base paths', () => {
            const relativePath = './data';
            const filename = 'test.json';
            const result = PathValidator.safeJoin(relativePath, filename);
            
            // Should resolve to absolute path
            expect(path.isAbsolute(result)).to.be.true;
            expect(result).to.include('test.json');
        });
    });

    describe('safeJoinId', () => {
        const basePath = '/safe/directory';

        it('should safely join ID-based paths', () => {
            const result = PathValidator.safeJoinId(basePath, 'test123', '.json');
            expect(result).to.equal(path.join(basePath, 'test123.json'));
        });

        it('should work without extension', () => {
            const result = PathValidator.safeJoinId(basePath, 'test123');
            expect(result).to.equal(path.join(basePath, 'test123'));
        });

        it('should reject invalid IDs', () => {
            expect(() => PathValidator.safeJoinId(basePath, '../etc/passwd', '.json')).to.throw();
            expect(() => PathValidator.safeJoinId(basePath, 'test/123', '.json')).to.throw();
        });
    });

    describe('sanitizeId', () => {
        it('should sanitize unsafe characters', () => {
            const testCases = [
                { input: 'test/123', expected: 'test_123' },
                { input: 'test@example.com', expected: 'test_example_com' },
                { input: '../etc/passwd', expected: '___etc_passwd' },
                { input: 'hello world!', expected: 'hello_world_' },
                { input: 'test#123$456', expected: 'test_123_456' }
            ];

            testCases.forEach(({ input, expected }) => {
                expect(PathValidator.sanitizeId(input)).to.equal(expected);
            });
        });

        it('should handle edge cases', () => {
            expect(() => PathValidator.sanitizeId('')).to.throw('Input must be a non-empty string');
            expect(() => PathValidator.sanitizeId('!!!')).to.throw('Input cannot be sanitized');
            expect(PathValidator.sanitizeId('a'.repeat(300))).to.have.lengthOf(255);
        });
    });

    describe('isWithinDirectory', () => {
        const basePath = '/safe/directory';

        it('should correctly identify paths within directory', () => {
            const testCases = [
                { path: '/safe/directory/file.txt', expected: true },
                { path: '/safe/directory/sub/file.txt', expected: true },
                { path: '/safe/directory', expected: true },
                { path: '/safe/other/file.txt', expected: false },
                { path: '/etc/passwd', expected: false },
                { path: '/safe/directory/../other/file.txt', expected: false }
            ];

            testCases.forEach(({ path: testPath, expected }) => {
                expect(PathValidator.isWithinDirectory(testPath, basePath)).to.equal(expected);
            });
        });
    });

    describe('Security Edge Cases', () => {
        it('should handle null byte injection', () => {
            expect(() => PathValidator.validateId('test\0.txt')).to.throw();
            expect(() => PathValidator.validateFilename('test\0.txt')).to.throw();
        });

        it('should handle URL encoded paths', () => {
            expect(() => PathValidator.validateId('test%2F..%2Fetc')).to.throw();
            expect(() => PathValidator.validateFilename('test%2F..%2Fetc.txt')).to.throw();
        });

        it('should handle Windows path separators', () => {
            expect(() => PathValidator.validateId('test\\..\\etc')).to.throw();
            expect(() => PathValidator.validateFilename('test\\..\\etc.txt')).to.throw();
        });

        it('should handle Unicode and special characters', () => {
            expect(() => PathValidator.validateId('test→file')).to.throw();
            expect(() => PathValidator.validateId('test\nfile')).to.throw();
            expect(() => PathValidator.validateId('test\rfile')).to.throw();
            expect(() => PathValidator.validateId('test\tfile')).to.throw();
        });
    });
});