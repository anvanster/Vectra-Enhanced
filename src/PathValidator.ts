import * as path from 'path';

/**
 * Security utility for validating and sanitizing file paths to prevent path traversal attacks
 */
export class PathValidator {
    // Regex patterns for validation
    private static readonly SAFE_ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;
    private static readonly SAFE_FILENAME_PATTERN = /^[a-zA-Z0-9_\-\.]+$/;
    private static readonly DANGEROUS_PATTERNS = [
        /\.\./,           // Parent directory traversal
        /^\//,            // Absolute paths
        /^~/,             // Home directory
        /\0/,             // Null bytes
        /%/,              // URL encoding
        /\\/              // Backslashes (Windows paths)
    ];

    /**
     * Validates an ID to ensure it's safe for use in filenames
     * @param id The ID to validate
     * @returns The validated ID
     * @throws Error if the ID is invalid
     */
    public static validateId(id: string): string {
        if (!id || typeof id !== 'string') {
            throw new Error('ID must be a non-empty string');
        }

        // Check length
        if (id.length > 255) {
            throw new Error('ID is too long (max 255 characters)');
        }

        // Check for dangerous patterns
        for (const pattern of this.DANGEROUS_PATTERNS) {
            if (pattern.test(id)) {
                throw new Error(`ID contains forbidden characters: ${pattern}`);
            }
        }

        // Check against safe pattern
        if (!this.SAFE_ID_PATTERN.test(id)) {
            throw new Error('ID can only contain letters, numbers, underscores, and hyphens');
        }

        return id;
    }

    /**
     * Validates a filename to ensure it's safe
     * @param filename The filename to validate
     * @returns The validated filename
     * @throws Error if the filename is invalid
     */
    public static validateFilename(filename: string): string {
        if (!filename || typeof filename !== 'string') {
            throw new Error('Filename must be a non-empty string');
        }

        // Check length
        if (filename.length > 255) {
            throw new Error('Filename is too long (max 255 characters)');
        }

        // Check for dangerous patterns
        for (const pattern of this.DANGEROUS_PATTERNS) {
            if (pattern.test(filename)) {
                throw new Error(`Filename contains forbidden characters: ${pattern}`);
            }
        }

        // Check against safe pattern
        if (!this.SAFE_FILENAME_PATTERN.test(filename)) {
            throw new Error('Filename can only contain letters, numbers, underscores, hyphens, and dots');
        }

        // Prevent hidden files
        if (filename.startsWith('.')) {
            throw new Error('Filename cannot start with a dot');
        }

        return filename;
    }

    /**
     * Safely joins a base path with a filename, ensuring the result is within the base path
     * @param basePath The base directory path
     * @param filename The filename to join
     * @returns The safe joined path
     * @throws Error if the resulting path would escape the base directory
     */
    public static safeJoin(basePath: string, filename: string): string {
        // Validate the filename first
        const validatedFilename = this.validateFilename(filename);

        // Resolve the base path to an absolute path
        const resolvedBase = path.resolve(basePath);

        // Join and resolve the full path
        const fullPath = path.resolve(resolvedBase, validatedFilename);

        // Ensure the resulting path is within the base directory
        if (!fullPath.startsWith(resolvedBase + path.sep) && fullPath !== resolvedBase) {
            throw new Error('Path traversal attempt detected');
        }

        return fullPath;
    }

    /**
     * Safely joins a base path with an ID-based filename
     * @param basePath The base directory path
     * @param id The ID to use
     * @param extension The file extension (including dot)
     * @returns The safe joined path
     */
    public static safeJoinId(basePath: string, id: string, extension: string = ''): string {
        const validatedId = this.validateId(id);
        const filename = validatedId + extension;
        return this.safeJoin(basePath, filename);
    }

    /**
     * Sanitizes a user-provided string to make it safe for use as an ID
     * @param input The input string to sanitize
     * @returns A sanitized ID
     */
    public static sanitizeId(input: string): string {
        if (!input || typeof input !== 'string') {
            throw new Error('Input must be a non-empty string');
        }

        // Replace unsafe characters with underscores
        let sanitized = input.replace(/[^a-zA-Z0-9_\-]/g, '_');

        // Trim to max length
        if (sanitized.length > 255) {
            sanitized = sanitized.substring(0, 255);
        }

        // Ensure it's not empty after sanitization
        if (!sanitized || /^_+$/.test(sanitized)) {
            throw new Error('Input cannot be sanitized to a valid ID');
        }

        return sanitized;
    }

    /**
     * Checks if a path is within a base directory
     * @param checkPath The path to check
     * @param basePath The base directory
     * @returns True if the path is within the base directory
     */
    public static isWithinDirectory(checkPath: string, basePath: string): boolean {
        const resolvedCheck = path.resolve(checkPath);
        const resolvedBase = path.resolve(basePath);
        
        return resolvedCheck.startsWith(resolvedBase + path.sep) || resolvedCheck === resolvedBase;
    }
}