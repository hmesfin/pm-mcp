// src/performance/__tests__/memoize.test.ts
// Tests for memoization utilities

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  memoize,
  memoizeAsync,
  memoizeWithTTL,
  createMemoizedFunction,
  LazyValue,
  lazy,
  lazyAsync,
} from '../memoize.js';

describe('Memoization', () => {
  describe('memoize', () => {
    it('should cache function results', () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoized = memoize(fn);

      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cache based on arguments', () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoized = memoize(fn);

      expect(memoized(5)).toBe(10);
      expect(memoized(10)).toBe(20);
      expect(memoized(5)).toBe(10);

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple arguments', () => {
      const fn = vi.fn((a: number, b: number) => a + b);
      const memoized = memoize(fn);

      expect(memoized(1, 2)).toBe(3);
      expect(memoized(1, 2)).toBe(3);
      expect(memoized(2, 1)).toBe(3);

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle object arguments with custom key function', () => {
      const fn = vi.fn((obj: { id: number }) => obj.id * 2);
      const memoized = memoize(fn, {
        keyFn: (obj) => obj.id.toString(),
      });

      expect(memoized({ id: 5 })).toBe(10);
      expect(memoized({ id: 5 })).toBe(10);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should allow clearing cache', () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoized = createMemoizedFunction(fn);

      expect(memoized(5)).toBe(10);
      expect(fn).toHaveBeenCalledTimes(1);

      memoized.clear();

      expect(memoized(5)).toBe(10);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should report cache size', () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoized = createMemoizedFunction(fn);

      memoized(1);
      memoized(2);
      memoized(3);

      expect(memoized.size()).toBe(3);
    });

    it('should respect max cache size', () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoized = memoize(fn, { maxSize: 2 });

      memoized(1);
      memoized(2);
      memoized(3);

      // First entry should be evicted
      memoized(1); // Will recalculate

      expect(fn).toHaveBeenCalledTimes(4);
    });
  });

  describe('memoizeAsync', () => {
    it('should cache async function results', async () => {
      const fn = vi.fn(async (x: number) => x * 2);
      const memoized = memoizeAsync(fn);

      expect(await memoized(5)).toBe(10);
      expect(await memoized(5)).toBe(10);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent calls to same key', async () => {
      let callCount = 0;
      const fn = vi.fn(async (x: number) => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return x * 2;
      });

      const memoized = memoizeAsync(fn);

      // Start multiple concurrent calls
      const results = await Promise.all([
        memoized(5),
        memoized(5),
        memoized(5),
      ]);

      expect(results).toEqual([10, 10, 10]);
      expect(callCount).toBe(1); // Only one actual call
    });

    it('should not cache rejected promises', async () => {
      let attempts = 0;
      const fn = vi.fn(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('first call fails');
        }
        return 'success';
      });

      const memoized = memoizeAsync(fn);

      await expect(memoized()).rejects.toThrow('first call fails');
      expect(await memoized()).toBe('success');

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('memoizeWithTTL', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return cached value within TTL', () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoized = memoizeWithTTL(fn, 1000);

      expect(memoized(5)).toBe(10);

      vi.advanceTimersByTime(500);

      expect(memoized(5)).toBe(10);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should recalculate after TTL expires', () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoized = memoizeWithTTL(fn, 1000);

      expect(memoized(5)).toBe(10);

      vi.advanceTimersByTime(1001);

      expect(memoized(5)).toBe(10);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should have separate TTL for each key', () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoized = memoizeWithTTL(fn, 1000);

      memoized(1);
      vi.advanceTimersByTime(500);
      memoized(2);
      vi.advanceTimersByTime(600);

      // Key 1 should be expired (1100ms total), key 2 should still be valid (600ms)
      memoized(1); // recalculates
      memoized(2); // cached

      expect(fn).toHaveBeenCalledTimes(3);
    });
  });
});

describe('LazyValue', () => {
  describe('lazy (sync)', () => {
    it('should not compute until accessed', () => {
      const compute = vi.fn(() => 'value');
      const lazyVal = lazy(compute);

      expect(compute).not.toHaveBeenCalled();

      expect(lazyVal.get()).toBe('value');
      expect(compute).toHaveBeenCalledTimes(1);
    });

    it('should compute only once', () => {
      const compute = vi.fn(() => 'value');
      const lazyVal = lazy(compute);

      lazyVal.get();
      lazyVal.get();
      lazyVal.get();

      expect(compute).toHaveBeenCalledTimes(1);
    });

    it('should report initialization status', () => {
      const lazyVal = lazy(() => 'value');

      expect(lazyVal.isInitialized()).toBe(false);

      lazyVal.get();

      expect(lazyVal.isInitialized()).toBe(true);
    });

    it('should allow reset', () => {
      const compute = vi.fn(() => Math.random());
      const lazyVal = lazy(compute);

      const first = lazyVal.get();
      lazyVal.reset();
      const second = lazyVal.get();

      expect(compute).toHaveBeenCalledTimes(2);
      expect(first).not.toBe(second);
    });

    it('should cache error and rethrow', () => {
      const error = new Error('compute failed');
      const compute = vi.fn(() => {
        throw error;
      });
      const lazyVal = lazy(compute);

      expect(() => lazyVal.get()).toThrow('compute failed');
      expect(() => lazyVal.get()).toThrow('compute failed');

      expect(compute).toHaveBeenCalledTimes(1);
    });

    it('should support map transformation', () => {
      const lazyVal = lazy(() => 5);
      const mapped = lazyVal.map((x) => x * 2);

      expect(mapped.get()).toBe(10);
    });
  });

  describe('lazyAsync', () => {
    it('should not compute until accessed', async () => {
      const compute = vi.fn(async () => 'async-value');
      const lazyVal = lazyAsync(compute);

      expect(compute).not.toHaveBeenCalled();

      expect(await lazyVal.get()).toBe('async-value');
      expect(compute).toHaveBeenCalledTimes(1);
    });

    it('should compute only once for concurrent access', async () => {
      let callCount = 0;
      const compute = vi.fn(async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'value';
      });

      const lazyVal = lazyAsync(compute);

      const results = await Promise.all([
        lazyVal.get(),
        lazyVal.get(),
        lazyVal.get(),
      ]);

      expect(results).toEqual(['value', 'value', 'value']);
      expect(callCount).toBe(1);
    });

    it('should cache resolved value', async () => {
      const compute = vi.fn(async () => 'cached');
      const lazyVal = lazyAsync(compute);

      await lazyVal.get();
      await lazyVal.get();

      expect(compute).toHaveBeenCalledTimes(1);
    });

    it('should not cache rejected promise after reset', async () => {
      let shouldFail = true;
      const compute = vi.fn(async () => {
        if (shouldFail) {
          shouldFail = false;
          throw new Error('first fail');
        }
        return 'success';
      });

      const lazyVal = lazyAsync(compute);

      await expect(lazyVal.get()).rejects.toThrow('first fail');

      lazyVal.reset();

      expect(await lazyVal.get()).toBe('success');
    });
  });
});

describe('LazyValue class', () => {
  it('should provide value via getter', () => {
    const lazyVal = new LazyValue(() => 42);

    expect(lazyVal.value).toBe(42);
  });

  it('should support flatMap', () => {
    const lazyVal = lazy(() => 5);
    const flatMapped = lazyVal.flatMap((x) => lazy(() => x * 3));

    expect(flatMapped.get()).toBe(15);
  });

  it('should support orElse for error recovery', () => {
    const lazyVal = lazy<number>(() => {
      throw new Error('fail');
    });

    const recovered = lazyVal.orElse(0);

    expect(recovered.get()).toBe(0);
  });
});
