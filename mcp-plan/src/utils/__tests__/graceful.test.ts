// src/utils/__tests__/graceful.test.ts
// Tests for graceful degradation utilities

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withFallback,
  withRetry,
  withTimeout,
  safeJsonParse,
  safeFileRead,
  safeGitHubCall,
  degradeGracefully,
  RetryOptions,
} from '../graceful.js';
import * as fs from 'fs/promises';

// Mock fs module
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  access: vi.fn(),
}));

describe('Graceful Degradation Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('withFallback', () => {
    it('should return primary result when successful', async () => {
      const primary = vi.fn().mockResolvedValue('success');
      const fallback = vi.fn().mockResolvedValue('fallback');

      const result = await withFallback(primary, fallback);

      expect(result).toBe('success');
      expect(primary).toHaveBeenCalled();
      expect(fallback).not.toHaveBeenCalled();
    });

    it('should return fallback when primary fails', async () => {
      const primary = vi.fn().mockRejectedValue(new Error('failed'));
      const fallback = vi.fn().mockResolvedValue('fallback');

      const result = await withFallback(primary, fallback);

      expect(result).toBe('fallback');
      expect(primary).toHaveBeenCalled();
      expect(fallback).toHaveBeenCalled();
    });

    it('should throw when both fail', async () => {
      const primary = vi.fn().mockRejectedValue(new Error('primary failed'));
      const fallback = vi.fn().mockRejectedValue(new Error('fallback failed'));

      await expect(withFallback(primary, fallback)).rejects.toThrow('fallback failed');
    });

    it('should pass error to fallback function', async () => {
      const error = new Error('primary error');
      const primary = vi.fn().mockRejectedValue(error);
      const fallback = vi.fn().mockResolvedValue('fallback');

      await withFallback(primary, fallback);

      expect(fallback).toHaveBeenCalledWith(error);
    });

    it('should accept static fallback value', async () => {
      const primary = vi.fn().mockRejectedValue(new Error('failed'));

      const result = await withFallback(primary, 'default');

      expect(result).toBe('default');
    });
  });

  describe('withRetry', () => {
    it('should return on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn, { maxRetries: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, { maxRetries: 3, delay: 100 });

      // Fast-forward through retry delays
      await vi.advanceTimersByTimeAsync(100);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));

      const promise = withRetry(fn, { maxRetries: 3, delay: 100 });

      // Prevent unhandled rejection warning during timer advancement
      promise.catch(() => {});

      // Fast-forward through all retries
      await vi.advanceTimersByTimeAsync(300);

      await expect(promise).rejects.toThrow('always fails');
      expect(fn).toHaveBeenCalledTimes(4); // initial + 3 retries
    });

    it('should apply exponential backoff', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      const resultPromise = withRetry(fn, {
        maxRetries: 3,
        delay: 100,
        backoff: 'exponential',
      });

      // First retry after 100ms
      await vi.advanceTimersByTimeAsync(100);
      // Second retry after 200ms (100 * 2)
      await vi.advanceTimersByTimeAsync(200);

      await resultPromise;

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const onRetry = vi.fn();

      const resultPromise = withRetry(fn, {
        maxRetries: 3,
        delay: 100,
        onRetry,
      });

      await vi.advanceTimersByTimeAsync(100);
      await resultPromise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    });

    it('should not retry non-retryable errors when shouldRetry provided', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('non-retryable'));

      const shouldRetry = vi.fn().mockReturnValue(false);

      await expect(
        withRetry(fn, { maxRetries: 3, shouldRetry })
      ).rejects.toThrow('non-retryable');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalled();
    });
  });

  describe('withTimeout', () => {
    it('should return result before timeout', async () => {
      const fn = vi.fn().mockImplementation(async () => {
        return 'success';
      });

      const result = await withTimeout(fn, 1000);

      expect(result).toBe('success');
    });

    it('should throw on timeout', async () => {
      const fn = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return 'too late';
      });

      const promise = withTimeout(fn, 1000);

      // Prevent unhandled rejection warning during timer advancement
      promise.catch(() => {});

      await vi.advanceTimersByTimeAsync(1000);

      await expect(promise).rejects.toThrow('timed out');
    });

    it('should include timeout duration in error', async () => {
      const fn = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      });

      const promise = withTimeout(fn, 500);

      // Prevent unhandled rejection warning during timer advancement
      promise.catch(() => {});

      await vi.advanceTimersByTimeAsync(500);

      await expect(promise).rejects.toThrow('500');
    });

    it('should clean up timeout on success', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const fn = vi.fn().mockResolvedValue('success');

      await withTimeout(fn, 1000);

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key": "value"}');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ key: 'value' });
    });

    it('should return error for invalid JSON', () => {
      const result = safeJsonParse('{ invalid }');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return default value on parse error', () => {
      const result = safeJsonParse('invalid', { default: 'fallback' });

      expect(result.success).toBe(false);
      expect(result.data).toBe('fallback');
    });

    it('should handle empty string', () => {
      const result = safeJsonParse('');

      expect(result.success).toBe(false);
    });

    it('should handle null input', () => {
      const result = safeJsonParse(null as any);

      expect(result.success).toBe(false);
    });

    it('should parse arrays', () => {
      const result = safeJsonParse('[1, 2, 3]');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });

    it('should parse primitives', () => {
      expect(safeJsonParse('123').data).toBe(123);
      expect(safeJsonParse('"string"').data).toBe('string');
      expect(safeJsonParse('true').data).toBe(true);
      expect(safeJsonParse('null').data).toBe(null);
    });
  });

  describe('safeFileRead', () => {
    it('should read existing file', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('file content');

      const result = await safeFileRead('/path/to/file.md');

      expect(result.success).toBe(true);
      expect(result.data).toBe('file content');
    });

    it('should return error for missing file', async () => {
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });

      const result = await safeFileRead('/missing/file.md');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return default value for missing file', async () => {
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });

      const result = await safeFileRead('/missing/file.md', { default: 'default content' });

      expect(result.success).toBe(false);
      expect(result.data).toBe('default content');
    });

    it('should handle permission errors', async () => {
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'EACCES' });

      const result = await safeFileRead('/protected/file.md');

      expect(result.success).toBe(false);
      expect(result.error?.toLowerCase()).toContain('permission');
    });
  });

  describe('safeGitHubCall', () => {
    it('should return result on success', async () => {
      const apiCall = vi.fn().mockResolvedValue({ data: 'response' });

      const result = await safeGitHubCall(apiCall);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: 'response' });
    });

    it('should handle rate limit errors', async () => {
      const apiCall = vi.fn().mockRejectedValue({
        status: 403,
        message: 'rate limit exceeded',
      });

      const result = await safeGitHubCall(apiCall);

      expect(result.success).toBe(false);
      expect(result.rateLimited).toBe(true);
    });

    it('should handle not found errors', async () => {
      const apiCall = vi.fn().mockRejectedValue({
        status: 404,
        message: 'Not Found',
      });

      const result = await safeGitHubCall(apiCall);

      expect(result.success).toBe(false);
      expect(result.notFound).toBe(true);
    });

    it('should handle auth errors', async () => {
      const apiCall = vi.fn().mockRejectedValue({
        status: 401,
        message: 'Bad credentials',
      });

      const result = await safeGitHubCall(apiCall);

      expect(result.success).toBe(false);
      expect(result.authError).toBe(true);
    });

    it('should return fallback data on error when provided', async () => {
      const apiCall = vi.fn().mockRejectedValue(new Error('failed'));

      const result = await safeGitHubCall(apiCall, { fallback: [] });

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
    });
  });

  describe('degradeGracefully', () => {
    it('should execute all steps in order', async () => {
      const steps = [
        vi.fn().mockResolvedValue('step1'),
        vi.fn().mockResolvedValue('step2'),
        vi.fn().mockResolvedValue('step3'),
      ];

      const result = await degradeGracefully(steps);

      expect(result.success).toBe(true);
      expect(result.results).toEqual(['step1', 'step2', 'step3']);
      expect(result.failedSteps).toEqual([]);
    });

    it('should continue on step failure with degraded result', async () => {
      const steps = [
        vi.fn().mockResolvedValue('step1'),
        vi.fn().mockRejectedValue(new Error('step2 failed')),
        vi.fn().mockResolvedValue('step3'),
      ];

      const result = await degradeGracefully(steps, { continueOnError: true });

      expect(result.success).toBe(true);
      expect(result.degraded).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.failedSteps).toContain(1);
    });

    it('should stop on error when continueOnError is false', async () => {
      const steps = [
        vi.fn().mockResolvedValue('step1'),
        vi.fn().mockRejectedValue(new Error('step2 failed')),
        vi.fn().mockResolvedValue('step3'),
      ];

      const result = await degradeGracefully(steps, { continueOnError: false });

      expect(result.success).toBe(false);
      expect(steps[2]).not.toHaveBeenCalled();
    });

    it('should use step fallback on failure', async () => {
      const steps = [
        { fn: vi.fn().mockResolvedValue('step1') },
        {
          fn: vi.fn().mockRejectedValue(new Error('failed')),
          fallback: 'default step2',
        },
        { fn: vi.fn().mockResolvedValue('step3') },
      ];

      const result = await degradeGracefully(steps, { continueOnError: true });

      expect(result.results[1]).toBe('default step2');
    });

    it('should report which steps were degraded', async () => {
      const steps = [
        vi.fn().mockResolvedValue('step1'),
        vi.fn().mockRejectedValue(new Error('failed')),
      ];

      const result = await degradeGracefully(steps, { continueOnError: true });

      expect(result.degradedSteps).toContain(1);
    });
  });
});
