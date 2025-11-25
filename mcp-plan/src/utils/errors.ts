// src/utils/errors.ts
// Custom error classes and error handling utilities

/**
 * Error codes for categorizing errors
 */
export const ErrorCode = {
  UNKNOWN: 'UNKNOWN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  GITHUB_ERROR: 'GITHUB_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_PERMISSION_ERROR: 'FILE_PERMISSION_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface MCPErrorOptions {
  cause?: Error;
  context?: Record<string, any>;
}

/**
 * Base error class for all MCP errors
 */
export class MCPError extends Error {
  public readonly code: ErrorCodeType;
  public readonly cause?: Error;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCodeType = ErrorCode.UNKNOWN,
    options?: MCPErrorOptions
  ) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.cause = options?.cause;
    this.context = options?.context;

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error for invalid input parameters
 */
export class ValidationError extends MCPError {
  public readonly field?: string;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    field?: string,
    details?: Record<string, any>
  ) {
    super(message, ErrorCode.VALIDATION_ERROR);
    this.name = 'ValidationError';
    this.field = field;
    this.details = details;
  }
}

/**
 * GitHub API error
 */
export class GitHubError extends MCPError {
  public readonly statusCode?: number;
  public readonly rateLimit?: {
    limit: number;
    remaining: number;
    reset: Date;
  };

  constructor(
    message: string,
    statusCode?: number,
    options?: {
      rateLimit?: { limit: number; remaining: number; reset: Date };
      cause?: Error;
      context?: Record<string, any>;
    }
  ) {
    super(message, ErrorCode.GITHUB_ERROR, options);
    this.name = 'GitHubError';
    this.statusCode = statusCode;
    this.rateLimit = options?.rateLimit;
  }

  get isRateLimited(): boolean {
    return this.statusCode === 403 || this.statusCode === 429;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isAuthError(): boolean {
    return this.statusCode === 401;
  }
}

/**
 * File system error
 */
export class FileSystemError extends MCPError {
  public readonly path?: string;
  public readonly operation?: string;

  constructor(
    message: string,
    path?: string,
    operation?: string,
    code: ErrorCodeType = ErrorCode.FILE_NOT_FOUND
  ) {
    super(message, code);
    this.name = 'FileSystemError';
    this.path = path;
    this.operation = operation;
  }

  /**
   * Create FileSystemError from errno code
   */
  static fromErrno(errno: string, path: string, operation?: string): FileSystemError {
    let message: string;
    let code: ErrorCodeType = ErrorCode.FILE_NOT_FOUND;

    switch (errno) {
      case 'ENOENT':
        message = `File or directory not found: ${path}`;
        code = ErrorCode.FILE_NOT_FOUND;
        break;
      case 'EACCES':
        message = `Permission denied: ${path}`;
        code = ErrorCode.FILE_PERMISSION_ERROR;
        break;
      case 'EEXIST':
        message = `File already exists: ${path}`;
        break;
      case 'EISDIR':
        message = `Expected file but found directory: ${path}`;
        break;
      case 'ENOTDIR':
        message = `Expected directory but found file: ${path}`;
        break;
      case 'EMFILE':
        message = `Too many open files`;
        break;
      default:
        message = `File system error (${errno}): ${path}`;
    }

    return new FileSystemError(message, path, operation, code);
  }
}

/**
 * Parse error for invalid content
 */
export class ParseError extends MCPError {
  public readonly source?: string;
  public readonly line?: number;
  public readonly column?: number;
  public readonly format?: string;

  constructor(
    message: string,
    source?: string,
    options?: {
      line?: number;
      column?: number;
      format?: string;
    }
  ) {
    super(message, ErrorCode.PARSE_ERROR);
    this.name = 'ParseError';
    this.source = source;
    this.line = options?.line;
    this.column = options?.column;
    this.format = options?.format;
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends MCPError {
  public readonly configKey?: string;
  public readonly expectedType?: string;

  constructor(
    message: string,
    configKey?: string,
    expectedType?: string
  ) {
    super(message, ErrorCode.CONFIGURATION_ERROR);
    this.name = 'ConfigurationError';
    this.configKey = configKey;
    this.expectedType = expectedType;
  }
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return 'Unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof MCPError) {
    let message = `[${error.code}] ${error.message}`;

    if (error instanceof ValidationError && error.field) {
      message = `[${error.code}] ${error.field}: ${error.message}`;
    }

    if (error instanceof GitHubError && error.statusCode) {
      message = `[${error.code}] HTTP ${error.statusCode}: ${error.message}`;
    }

    return message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/**
 * Format error for MCP response
 */
export function formatErrorForMCP(error: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
} {
  const message = formatErrorMessage(error);
  const suggestion = getErrorSuggestion(error);

  let text = `Error: ${message}`;
  if (suggestion) {
    text += `\n\nSuggestion: ${suggestion}`;
  }

  return {
    content: [{ type: 'text', text }],
    isError: true,
  };
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof GitHubError) {
    // Rate limits and server errors are retryable
    const retryableStatuses = [429, 500, 502, 503, 504];
    return error.statusCode !== undefined && retryableStatuses.includes(error.statusCode);
  }

  if (error instanceof FileSystemError) {
    // File not found is not retryable
    return false;
  }

  if (error instanceof ValidationError) {
    // Validation errors are not retryable
    return false;
  }

  // Network errors might be retryable
  if (error instanceof Error) {
    const networkErrors = ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND'];
    return networkErrors.some((code) => error.message.includes(code));
  }

  return false;
}

/**
 * Get a helpful suggestion for an error
 */
export function getErrorSuggestion(error: unknown): string {
  if (error instanceof GitHubError) {
    if (error.isAuthError) {
      return 'Check that GITHUB_TOKEN environment variable is set and has the required permissions (repo, admin:org).';
    }
    if (error.isRateLimited) {
      return 'GitHub API rate limit exceeded. Wait a few minutes and try again, or use a personal access token with higher limits.';
    }
    if (error.isNotFound) {
      return 'Repository or resource not found. Check that the owner and repo names are correct and you have access.';
    }
    return 'Check your GitHub API credentials and network connection.';
  }

  if (error instanceof FileSystemError) {
    if (error.code === ErrorCode.FILE_NOT_FOUND) {
      return `Check that the file path is correct: ${error.path}`;
    }
    if (error.code === ErrorCode.FILE_PERMISSION_ERROR) {
      return `Check file permissions for: ${error.path}`;
    }
    return 'Check file paths and permissions.';
  }

  if (error instanceof ValidationError) {
    return `Check your input parameters${error.field ? ` for '${error.field}'` : ''}.`;
  }

  if (error instanceof ParseError) {
    return `Check the format of your ${error.format || 'content'}. Ensure it's valid ${error.format?.toUpperCase() || 'syntax'}.`;
  }

  if (error instanceof ConfigurationError) {
    return `Check your configuration${error.configKey ? ` for '${error.configKey}'` : ''}.`;
  }

  return 'Check the error details and try again. If the problem persists, check the documentation or file an issue.';
}

/**
 * Wrap an error with additional context
 */
export function wrapError(
  error: unknown,
  contextMessage: string,
  context?: Record<string, any>
): MCPError {
  // If it's already an MCPError subclass, preserve the type
  if (error instanceof MCPError) {
    const wrapped = Object.create(Object.getPrototypeOf(error));
    Object.assign(wrapped, error);
    wrapped.message = `${contextMessage}: ${error.message}`;
    wrapped.context = { ...error.context, ...context };
    return wrapped;
  }

  // Get the original message
  const originalMessage = error instanceof Error ? error.message : String(error);

  // Create new MCPError with original as cause
  return new MCPError(
    `${contextMessage}: ${originalMessage}`,
    ErrorCode.UNKNOWN,
    {
      cause: error instanceof Error ? error : undefined,
      context,
    }
  );
}
