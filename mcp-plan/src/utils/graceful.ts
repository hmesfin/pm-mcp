// src/utils/graceful.ts
// Graceful degradation utilities

import * as fs from 'fs/promises';

/**
 * Retry options
 */
export interface RetryOptions {
  maxRetries: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

/**
 * Execute with fallback - returns fallback value/result if primary fails
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: T | ((error: unknown) => T | Promise<T>)
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    if (typeof fallback === 'function') {
      return await (fallback as (error: unknown) => T | Promise<T>)(error);
    }
    return fallback;
  }
}

/**
 * Execute with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxRetries,
    delay = 1000,
    backoff = 'linear',
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: unknown;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      if (onRetry) {
        onRetry(error, attempt + 1);
      }

      // Calculate delay based on backoff strategy
      const waitTime =
        backoff === 'exponential' ? delay * Math.pow(2, attempt) : delay;

      await sleep(waitTime);
      attempt++;
    }
  }

  throw lastError;
}

/**
 * Execute with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Safe JSON parse result
 */
export interface SafeParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Safely parse JSON with optional default value
 */
export function safeJsonParse<T = unknown>(
  input: string,
  options?: { default?: T }
): SafeParseResult<T> {
  if (input === null || input === undefined || input === '') {
    return {
      success: false,
      error: 'Empty or null input',
      data: options?.default,
    };
  }

  try {
    const data = JSON.parse(input) as T;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Parse error',
      data: options?.default,
    };
  }
}

/**
 * Safe file read result
 */
export interface SafeFileResult {
  success: boolean;
  data?: string;
  error?: string;
}

/**
 * Safely read a file with optional default value
 */
export async function safeFileRead(
  path: string,
  options?: { default?: string }
): Promise<SafeFileResult> {
  try {
    const data = await fs.readFile(path, 'utf-8');
    return { success: true, data };
  } catch (error: any) {
    let errorMessage: string;

    if (error.code === 'ENOENT') {
      errorMessage = `File not found: ${path}`;
    } else if (error.code === 'EACCES') {
      errorMessage = `Permission denied: ${path}`;
    } else {
      errorMessage = error.message || 'Unknown file read error';
    }

    return {
      success: false,
      error: errorMessage,
      data: options?.default,
    };
  }
}

/**
 * Safe GitHub API call result
 */
export interface SafeGitHubResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimited?: boolean;
  notFound?: boolean;
  authError?: boolean;
}

/**
 * Safely execute a GitHub API call
 */
export async function safeGitHubCall<T>(
  apiCall: () => Promise<T>,
  options?: { fallback?: T }
): Promise<SafeGitHubResult<T>> {
  try {
    const data = await apiCall();
    return { success: true, data };
  } catch (error: any) {
    const status = error.status || error.response?.status;

    const result: SafeGitHubResult<T> = {
      success: false,
      error: error.message || 'GitHub API error',
      data: options?.fallback,
    };

    if (status === 403 || status === 429) {
      result.rateLimited = true;
    } else if (status === 404) {
      result.notFound = true;
    } else if (status === 401) {
      result.authError = true;
    }

    return result;
  }
}

/**
 * Step definition for graceful degradation
 */
export type DegradationStep<T> =
  | (() => Promise<T>)
  | { fn: () => Promise<T>; fallback?: T };

/**
 * Degradation result
 */
export interface DegradationResult<T> {
  success: boolean;
  degraded: boolean;
  results: (T | undefined)[];
  failedSteps: number[];
  degradedSteps: number[];
  errors: Error[];
}

/**
 * Execute multiple steps with graceful degradation
 */
export async function degradeGracefully<T>(
  steps: DegradationStep<T>[],
  options?: { continueOnError?: boolean }
): Promise<DegradationResult<T>> {
  const continueOnError = options?.continueOnError ?? true;

  const results: (T | undefined)[] = [];
  const failedSteps: number[] = [];
  const degradedSteps: number[] = [];
  const errors: Error[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const fn = typeof step === 'function' ? step : step.fn;
    const fallback = typeof step === 'function' ? undefined : step.fallback;

    try {
      const result = await fn();
      results.push(result);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      errors.push(errorObj);
      failedSteps.push(i);

      if (fallback !== undefined) {
        results.push(fallback);
        degradedSteps.push(i);
      } else {
        results.push(undefined);
        degradedSteps.push(i);
      }

      if (!continueOnError) {
        return {
          success: false,
          degraded: true,
          results,
          failedSteps,
          degradedSteps,
          errors,
        };
      }
    }
  }

  return {
    success: failedSteps.length === 0 || continueOnError,
    degraded: failedSteps.length > 0,
    results,
    failedSteps,
    degradedSteps,
    errors,
  };
}

/**
 * Helper: Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
