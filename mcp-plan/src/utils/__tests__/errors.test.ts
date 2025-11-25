// src/utils/__tests__/errors.test.ts
// Tests for custom error classes and error handling utilities

import { describe, it, expect, vi } from 'vitest';
import {
  MCPError,
  ValidationError,
  GitHubError,
  FileSystemError,
  ParseError,
  ConfigurationError,
  formatErrorMessage,
  formatErrorForMCP,
  isRetryableError,
  getErrorSuggestion,
  wrapError,
  ErrorCode,
} from '../errors.js';

describe('Custom Error Classes', () => {
  describe('MCPError (base class)', () => {
    it('should create error with message', () => {
      const error = new MCPError('Something went wrong');

      expect(error.message).toBe('Something went wrong');
      expect(error.name).toBe('MCPError');
    });

    it('should have error code', () => {
      const error = new MCPError('Error', ErrorCode.UNKNOWN);

      expect(error.code).toBe(ErrorCode.UNKNOWN);
    });

    it('should be instanceof Error', () => {
      const error = new MCPError('test');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof MCPError).toBe(true);
    });

    it('should have stack trace', () => {
      const error = new MCPError('test');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('MCPError');
    });

    it('should accept cause for error chaining', () => {
      const cause = new Error('Original error');
      const error = new MCPError('Wrapped error', ErrorCode.UNKNOWN, { cause });

      expect(error.cause).toBe(cause);
    });

    it('should accept context data', () => {
      const error = new MCPError('Error', ErrorCode.UNKNOWN, {
        context: { userId: 123, action: 'create' },
      });

      expect(error.context).toEqual({ userId: 123, action: 'create' });
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input');

      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should include field information', () => {
      const error = new ValidationError('Invalid email', 'email');

      expect(error.field).toBe('email');
    });

    it('should include validation details', () => {
      const error = new ValidationError('Invalid email', 'email', {
        received: 'not-an-email',
        expected: 'valid email format',
      });

      expect(error.details).toEqual({
        received: 'not-an-email',
        expected: 'valid email format',
      });
    });
  });

  describe('GitHubError', () => {
    it('should create GitHub error', () => {
      const error = new GitHubError('Rate limit exceeded');

      expect(error.name).toBe('GitHubError');
      expect(error.code).toBe(ErrorCode.GITHUB_ERROR);
    });

    it('should include HTTP status code', () => {
      const error = new GitHubError('Not found', 404);

      expect(error.statusCode).toBe(404);
    });

    it('should include rate limit info', () => {
      const error = new GitHubError('Rate limited', 403, {
        rateLimit: {
          limit: 5000,
          remaining: 0,
          reset: new Date('2024-01-01T12:00:00Z'),
        },
      });

      expect(error.rateLimit).toBeDefined();
      expect(error.rateLimit?.remaining).toBe(0);
    });

    it('should identify rate limit errors', () => {
      const error = new GitHubError('Rate limited', 403);

      expect(error.isRateLimited).toBe(true);
    });

    it('should identify not found errors', () => {
      const error = new GitHubError('Repo not found', 404);

      expect(error.isNotFound).toBe(true);
    });

    it('should identify authentication errors', () => {
      const error = new GitHubError('Bad credentials', 401);

      expect(error.isAuthError).toBe(true);
    });
  });

  describe('FileSystemError', () => {
    it('should create file system error', () => {
      const error = new FileSystemError('File not found');

      expect(error.name).toBe('FileSystemError');
      expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
    });

    it('should include file path', () => {
      const error = new FileSystemError('Cannot read file', '/path/to/file.md');

      expect(error.path).toBe('/path/to/file.md');
    });

    it('should include operation type', () => {
      const error = new FileSystemError('Permission denied', '/path', 'write');

      expect(error.operation).toBe('write');
    });

    it('should create from ENOENT', () => {
      const error = FileSystemError.fromErrno('ENOENT', '/missing/file.md');

      expect(error.message).toContain('not found');
      expect(error.path).toBe('/missing/file.md');
    });

    it('should create from EACCES', () => {
      const error = FileSystemError.fromErrno('EACCES', '/protected/file.md');

      expect(error.message.toLowerCase()).toContain('permission');
    });

    it('should create from EEXIST', () => {
      const error = FileSystemError.fromErrno('EEXIST', '/existing/file.md');

      expect(error.message).toContain('exists');
    });
  });

  describe('ParseError', () => {
    it('should create parse error', () => {
      const error = new ParseError('Invalid markdown');

      expect(error.name).toBe('ParseError');
      expect(error.code).toBe(ErrorCode.PARSE_ERROR);
    });

    it('should include source content', () => {
      const error = new ParseError('Invalid JSON', '{ invalid }');

      expect(error.source).toBe('{ invalid }');
    });

    it('should include line and column', () => {
      const error = new ParseError('Unexpected token', '{ invalid }', {
        line: 1,
        column: 3,
      });

      expect(error.line).toBe(1);
      expect(error.column).toBe(3);
    });

    it('should include format type', () => {
      const error = new ParseError('Invalid YAML', 'content', {
        format: 'yaml',
      });

      expect(error.format).toBe('yaml');
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError('Missing config');

      expect(error.name).toBe('ConfigurationError');
      expect(error.code).toBe(ErrorCode.CONFIGURATION_ERROR);
    });

    it('should include config key', () => {
      const error = new ConfigurationError('Missing token', 'GITHUB_TOKEN');

      expect(error.configKey).toBe('GITHUB_TOKEN');
    });

    it('should include expected value type', () => {
      const error = new ConfigurationError('Invalid type', 'timeout', 'number');

      expect(error.expectedType).toBe('number');
    });
  });
});

describe('Error Utility Functions', () => {
  describe('formatErrorMessage', () => {
    it('should format basic error message', () => {
      const error = new Error('Something failed');
      const message = formatErrorMessage(error);

      expect(message).toBe('Something failed');
    });

    it('should format MCPError with code', () => {
      const error = new MCPError('Failed', ErrorCode.VALIDATION_ERROR);
      const message = formatErrorMessage(error);

      expect(message).toContain('VALIDATION_ERROR');
    });

    it('should format ValidationError with field', () => {
      const error = new ValidationError('Invalid value', 'email');
      const message = formatErrorMessage(error);

      expect(message).toContain('email');
    });

    it('should format GitHubError with status', () => {
      const error = new GitHubError('Not found', 404);
      const message = formatErrorMessage(error);

      expect(message).toContain('404');
    });

    it('should handle non-Error objects', () => {
      const message = formatErrorMessage('string error');

      expect(message).toBe('string error');
    });

    it('should handle null/undefined', () => {
      expect(formatErrorMessage(null)).toBe('Unknown error');
      expect(formatErrorMessage(undefined)).toBe('Unknown error');
    });
  });

  describe('formatErrorForMCP', () => {
    it('should return MCP-compatible error object', () => {
      const error = new ValidationError('Invalid input');
      const result = formatErrorForMCP(error);

      expect(result).toHaveProperty('content');
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0].type).toBe('text');
    });

    it('should include error code', () => {
      const error = new MCPError('Error', ErrorCode.GITHUB_ERROR);
      const result = formatErrorForMCP(error);

      expect(result.content[0].text).toContain('GITHUB_ERROR');
    });

    it('should include suggestion when available', () => {
      const error = new GitHubError('Bad credentials', 401);
      const result = formatErrorForMCP(error);

      expect(result.content[0].text.toLowerCase()).toContain('token');
    });

    it('should mark as error', () => {
      const error = new Error('test');
      const result = formatErrorForMCP(error);

      expect(result.isError).toBe(true);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for rate limit errors', () => {
      const error = new GitHubError('Rate limited', 429);

      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for server errors', () => {
      const error = new GitHubError('Server error', 500);

      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for 502 bad gateway', () => {
      const error = new GitHubError('Bad gateway', 502);

      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for 503 service unavailable', () => {
      const error = new GitHubError('Service unavailable', 503);

      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for validation errors', () => {
      const error = new ValidationError('Invalid input');

      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for 401 unauthorized', () => {
      const error = new GitHubError('Unauthorized', 401);

      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for 404 not found', () => {
      const error = new GitHubError('Not found', 404);

      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for file not found', () => {
      const error = new FileSystemError('Not found', '/path');

      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('getErrorSuggestion', () => {
    it('should suggest setting GITHUB_TOKEN for auth errors', () => {
      const error = new GitHubError('Unauthorized', 401);
      const suggestion = getErrorSuggestion(error);

      expect(suggestion.toLowerCase()).toContain('github_token');
    });

    it('should suggest checking file path for file not found', () => {
      const error = new FileSystemError('Not found', '/missing/file.md');
      const suggestion = getErrorSuggestion(error);

      expect(suggestion.toLowerCase()).toContain('path');
    });

    it('should suggest waiting for rate limit errors', () => {
      const error = new GitHubError('Rate limited', 429);
      const suggestion = getErrorSuggestion(error);

      expect(suggestion.toLowerCase()).toContain('wait');
    });

    it('should suggest checking input for validation errors', () => {
      const error = new ValidationError('Invalid', 'field');
      const suggestion = getErrorSuggestion(error);

      expect(suggestion.toLowerCase()).toContain('input');
    });

    it('should return generic suggestion for unknown errors', () => {
      const error = new Error('Unknown');
      const suggestion = getErrorSuggestion(error);

      expect(suggestion).toBeTruthy();
    });
  });

  describe('wrapError', () => {
    it('should wrap standard error in MCPError', () => {
      const original = new Error('Original message');
      const wrapped = wrapError(original, 'Context message');

      expect(wrapped).toBeInstanceOf(MCPError);
      expect(wrapped.message).toContain('Context message');
      expect(wrapped.cause).toBe(original);
    });

    it('should preserve MCPError subclass', () => {
      const original = new GitHubError('GitHub issue', 500);
      const wrapped = wrapError(original, 'Context');

      expect(wrapped).toBeInstanceOf(GitHubError);
    });

    it('should add context to error', () => {
      const original = new Error('Original');
      const wrapped = wrapError(original, 'Context', { userId: 123 });

      expect(wrapped.context).toEqual({ userId: 123 });
    });

    it('should handle string errors', () => {
      const wrapped = wrapError('string error', 'Context');

      expect(wrapped).toBeInstanceOf(MCPError);
      expect(wrapped.message).toContain('string error');
    });
  });
});

describe('Error Code Constants', () => {
  it('should have unique error codes', () => {
    const codes = Object.values(ErrorCode);
    const uniqueCodes = new Set(codes);

    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('should have descriptive error codes', () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.GITHUB_ERROR).toBe('GITHUB_ERROR');
    expect(ErrorCode.FILE_NOT_FOUND).toBe('FILE_NOT_FOUND');
    expect(ErrorCode.PARSE_ERROR).toBe('PARSE_ERROR');
    expect(ErrorCode.CONFIGURATION_ERROR).toBe('CONFIGURATION_ERROR');
  });
});
