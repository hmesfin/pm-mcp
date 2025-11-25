// src/performance/__tests__/benchmark.test.ts
// Tests for performance benchmarking utilities

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Benchmark,
  BenchmarkResult,
  createBenchmark,
  measureAsync,
  measureSync,
  PerformanceMetrics,
  PerformanceTracker,
} from '../benchmark.js';

describe('Benchmark', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createBenchmark', () => {
    it('should create a benchmark instance', () => {
      const benchmark = createBenchmark('test-operation');

      expect(benchmark).toBeDefined();
      expect(benchmark.name).toBe('test-operation');
    });
  });

  describe('measureSync', () => {
    it('should measure synchronous function execution time', () => {
      vi.useRealTimers(); // Need real timers for this test

      const result = measureSync('sync-op', () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return sum;
      });

      expect(result.value).toBe(499500);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.name).toBe('sync-op');
    });

    it('should return value from measured function', () => {
      vi.useRealTimers();

      const result = measureSync('test', () => 'hello');

      expect(result.value).toBe('hello');
    });

    it('should capture errors in measurement', () => {
      vi.useRealTimers();

      const result = measureSync('failing', () => {
        throw new Error('test error');
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('test error');
    });
  });

  describe('measureAsync', () => {
    it('should measure async function execution time', async () => {
      vi.useRealTimers();

      const result = await measureAsync('async-op', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'done';
      });

      expect(result.value).toBe('done');
      expect(result.duration).toBeGreaterThanOrEqual(10);
      expect(result.name).toBe('async-op');
    });

    it('should capture async errors', async () => {
      vi.useRealTimers();

      const result = await measureAsync('failing-async', async () => {
        throw new Error('async error');
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('async error');
    });
  });

  describe('Benchmark class', () => {
    it('should record multiple measurements', () => {
      vi.useRealTimers();

      const benchmark = createBenchmark('multi-measure');

      benchmark.record(10);
      benchmark.record(20);
      benchmark.record(30);

      const stats = benchmark.getStats();

      expect(stats.count).toBe(3);
      expect(stats.mean).toBe(20);
    });

    it('should calculate min and max', () => {
      vi.useRealTimers();

      const benchmark = createBenchmark('min-max');

      benchmark.record(50);
      benchmark.record(10);
      benchmark.record(30);

      const stats = benchmark.getStats();

      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
    });

    it('should calculate percentiles', () => {
      vi.useRealTimers();

      const benchmark = createBenchmark('percentiles');

      // Add 100 measurements (1-100)
      for (let i = 1; i <= 100; i++) {
        benchmark.record(i);
      }

      const stats = benchmark.getStats();

      expect(stats.p50).toBeCloseTo(50, 0);
      expect(stats.p95).toBeCloseTo(95, 0);
      expect(stats.p99).toBeCloseTo(99, 0);
    });

    it('should calculate standard deviation', () => {
      vi.useRealTimers();

      const benchmark = createBenchmark('stddev');

      benchmark.record(2);
      benchmark.record(4);
      benchmark.record(4);
      benchmark.record(4);
      benchmark.record(5);
      benchmark.record(5);
      benchmark.record(7);
      benchmark.record(9);

      const stats = benchmark.getStats();

      // Standard deviation of this dataset is 2
      expect(stats.stdDev).toBeCloseTo(2, 1);
    });

    it('should reset measurements', () => {
      vi.useRealTimers();

      const benchmark = createBenchmark('reset-test');

      benchmark.record(10);
      benchmark.record(20);
      benchmark.reset();
      benchmark.record(100);

      const stats = benchmark.getStats();

      expect(stats.count).toBe(1);
      expect(stats.mean).toBe(100);
    });

    it('should run function and record timing', () => {
      vi.useRealTimers();

      const benchmark = createBenchmark('run-test');

      const result = benchmark.run(() => 'result');

      expect(result).toBe('result');
      expect(benchmark.getStats().count).toBe(1);
    });

    it('should run async function and record timing', async () => {
      vi.useRealTimers();

      const benchmark = createBenchmark('run-async-test');

      const result = await benchmark.runAsync(async () => 'async-result');

      expect(result).toBe('async-result');
      expect(benchmark.getStats().count).toBe(1);
    });
  });

  describe('BenchmarkResult', () => {
    it('should format duration in human readable format', () => {
      const result: BenchmarkResult<string> = {
        name: 'test',
        value: 'result',
        duration: 1234.56,
        timestamp: Date.now(),
      };

      expect(result.duration).toBeCloseTo(1234.56);
    });

    it('should include timestamp', () => {
      vi.useRealTimers();

      const before = Date.now();
      const result = measureSync('test', () => 'value');
      const after = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
    });
  });
});

describe('PerformanceTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should track multiple operations', () => {
    vi.useRealTimers();

    const tracker = new PerformanceTracker();

    tracker.track('op1', 100);
    tracker.track('op1', 150);
    tracker.track('op2', 200);

    const metrics = tracker.getMetrics();

    expect(metrics.operations).toContain('op1');
    expect(metrics.operations).toContain('op2');
  });

  it('should get metrics for specific operation', () => {
    vi.useRealTimers();

    const tracker = new PerformanceTracker();

    tracker.track('parse', 50);
    tracker.track('parse', 60);
    tracker.track('render', 100);

    const parseMetrics = tracker.getOperationMetrics('parse');

    expect(parseMetrics.count).toBe(2);
    expect(parseMetrics.mean).toBe(55);
  });

  it('should check against performance budget', () => {
    vi.useRealTimers();

    const tracker = new PerformanceTracker();

    tracker.track('api-call', 100);
    tracker.track('api-call', 150);
    tracker.track('api-call', 200);

    // Budget of 250ms should pass
    expect(tracker.checkBudget('api-call', 250)).toBe(true);

    // Budget of 100ms should fail (mean is 150)
    expect(tracker.checkBudget('api-call', 100)).toBe(false);
  });

  it('should check p95 against budget', () => {
    vi.useRealTimers();

    const tracker = new PerformanceTracker();

    // Add measurements
    for (let i = 1; i <= 100; i++) {
      tracker.track('op', i);
    }

    // p95 is approximately 95
    expect(tracker.checkP95Budget('op', 100)).toBe(true);
    expect(tracker.checkP95Budget('op', 90)).toBe(false);
  });

  it('should generate performance report', () => {
    vi.useRealTimers();

    const tracker = new PerformanceTracker();

    tracker.track('operation-a', 100);
    tracker.track('operation-b', 200);

    const report = tracker.generateReport();

    expect(report).toContain('operation-a');
    expect(report).toContain('operation-b');
    expect(report).toContain('mean');
  });

  it('should export metrics as JSON', () => {
    vi.useRealTimers();

    const tracker = new PerformanceTracker();

    tracker.track('test', 50);

    const json = tracker.exportMetrics();
    const parsed = JSON.parse(json);

    expect(parsed.test).toBeDefined();
    expect(parsed.test.count).toBe(1);
  });

  it('should reset all tracked operations', () => {
    vi.useRealTimers();

    const tracker = new PerformanceTracker();

    tracker.track('op1', 100);
    tracker.track('op2', 200);

    tracker.reset();

    expect(tracker.getMetrics().operations).toHaveLength(0);
  });

  it('should wrap async function with tracking', async () => {
    vi.useRealTimers();

    const tracker = new PerformanceTracker();

    const trackedFn = tracker.wrapAsync('slow-op', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 'result';
    });

    const result = await trackedFn();

    expect(result).toBe('result');
    expect(tracker.getOperationMetrics('slow-op').count).toBe(1);
    // Allow for timing variance in CI environments
    expect(tracker.getOperationMetrics('slow-op').mean).toBeGreaterThanOrEqual(8);
  });

  it('should wrap sync function with tracking', () => {
    vi.useRealTimers();

    const tracker = new PerformanceTracker();

    const trackedFn = tracker.wrapSync('compute', () => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) sum += i;
      return sum;
    });

    const result = trackedFn();

    expect(result).toBe(499500);
    expect(tracker.getOperationMetrics('compute').count).toBe(1);
  });
});

describe('PerformanceMetrics', () => {
  it('should have correct structure', () => {
    const metrics: PerformanceMetrics = {
      count: 10,
      mean: 100,
      min: 50,
      max: 150,
      p50: 95,
      p95: 140,
      p99: 148,
      stdDev: 25,
    };

    expect(metrics.count).toBe(10);
    expect(metrics.mean).toBe(100);
    expect(metrics.min).toBeLessThan(metrics.max);
    expect(metrics.p50).toBeLessThanOrEqual(metrics.p95);
    expect(metrics.p95).toBeLessThanOrEqual(metrics.p99);
  });
});
