// src/performance/benchmark.ts
// Performance benchmarking utilities

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  count: number;
  mean: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  stdDev: number;
}

/**
 * Benchmark result interface
 */
export interface BenchmarkResult<T> {
  name: string;
  value?: T;
  duration: number;
  timestamp: number;
  error?: Error;
}

/**
 * Benchmark interface
 */
export interface Benchmark {
  name: string;
  record(duration: number): void;
  getStats(): PerformanceMetrics;
  reset(): void;
  run<T>(fn: () => T): T;
  runAsync<T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Create a benchmark instance
 */
export function createBenchmark(name: string): Benchmark {
  const measurements: number[] = [];

  return {
    name,

    record(duration: number): void {
      measurements.push(duration);
    },

    getStats(): PerformanceMetrics {
      if (measurements.length === 0) {
        return {
          count: 0,
          mean: 0,
          min: 0,
          max: 0,
          p50: 0,
          p95: 0,
          p99: 0,
          stdDev: 0,
        };
      }

      const sorted = [...measurements].sort((a, b) => a - b);
      const sum = measurements.reduce((a, b) => a + b, 0);
      const mean = sum / measurements.length;

      return {
        count: measurements.length,
        mean,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p50: percentile(sorted, 50),
        p95: percentile(sorted, 95),
        p99: percentile(sorted, 99),
        stdDev: standardDeviation(measurements, mean),
      };
    },

    reset(): void {
      measurements.length = 0;
    },

    run<T>(fn: () => T): T {
      const start = performance.now();
      const result = fn();
      const duration = performance.now() - start;
      this.record(duration);
      return result;
    },

    async runAsync<T>(fn: () => Promise<T>): Promise<T> {
      const start = performance.now();
      const result = await fn();
      const duration = performance.now() - start;
      this.record(duration);
      return result;
    },
  };
}

/**
 * Measure synchronous function execution
 */
export function measureSync<T>(name: string, fn: () => T): BenchmarkResult<T> {
  const start = performance.now();
  const timestamp = Date.now();

  try {
    const value = fn();
    const duration = performance.now() - start;
    return { name, value, duration, timestamp };
  } catch (error) {
    const duration = performance.now() - start;
    return {
      name,
      duration,
      timestamp,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Measure asynchronous function execution
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<BenchmarkResult<T>> {
  const start = performance.now();
  const timestamp = Date.now();

  try {
    const value = await fn();
    const duration = performance.now() - start;
    return { name, value, duration, timestamp };
  } catch (error) {
    const duration = performance.now() - start;
    return {
      name,
      duration,
      timestamp,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Performance tracker for multiple operations
 */
export class PerformanceTracker {
  private benchmarks = new Map<string, Benchmark>();

  /**
   * Track a measurement for an operation
   */
  track(operation: string, duration: number): void {
    if (!this.benchmarks.has(operation)) {
      this.benchmarks.set(operation, createBenchmark(operation));
    }
    this.benchmarks.get(operation)!.record(duration);
  }

  /**
   * Get metrics for all operations
   */
  getMetrics(): { operations: string[] } {
    return {
      operations: Array.from(this.benchmarks.keys()),
    };
  }

  /**
   * Get metrics for a specific operation
   */
  getOperationMetrics(operation: string): PerformanceMetrics {
    const benchmark = this.benchmarks.get(operation);
    if (!benchmark) {
      return {
        count: 0,
        mean: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        stdDev: 0,
      };
    }
    return benchmark.getStats();
  }

  /**
   * Check if mean is within budget
   */
  checkBudget(operation: string, budgetMs: number): boolean {
    const metrics = this.getOperationMetrics(operation);
    return metrics.mean <= budgetMs;
  }

  /**
   * Check if p95 is within budget
   */
  checkP95Budget(operation: string, budgetMs: number): boolean {
    const metrics = this.getOperationMetrics(operation);
    return metrics.p95 <= budgetMs;
  }

  /**
   * Generate a performance report
   */
  generateReport(): string {
    const lines: string[] = ['Performance Report', '='.repeat(50)];

    for (const [operation, benchmark] of this.benchmarks) {
      const stats = benchmark.getStats();
      lines.push('');
      lines.push(`Operation: ${operation}`);
      lines.push(`  count: ${stats.count}`);
      lines.push(`  mean: ${stats.mean.toFixed(2)}ms`);
      lines.push(`  min: ${stats.min.toFixed(2)}ms`);
      lines.push(`  max: ${stats.max.toFixed(2)}ms`);
      lines.push(`  p50: ${stats.p50.toFixed(2)}ms`);
      lines.push(`  p95: ${stats.p95.toFixed(2)}ms`);
      lines.push(`  p99: ${stats.p99.toFixed(2)}ms`);
      lines.push(`  stdDev: ${stats.stdDev.toFixed(2)}ms`);
    }

    return lines.join('\n');
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    const metrics: Record<string, PerformanceMetrics> = {};
    for (const [operation, benchmark] of this.benchmarks) {
      metrics[operation] = benchmark.getStats();
    }
    return JSON.stringify(metrics, null, 2);
  }

  /**
   * Reset all tracked operations
   */
  reset(): void {
    this.benchmarks.clear();
  }

  /**
   * Wrap an async function with tracking
   */
  wrapAsync<Args extends unknown[], R>(
    operation: string,
    fn: (...args: Args) => Promise<R>
  ): (...args: Args) => Promise<R> {
    return async (...args: Args): Promise<R> => {
      const start = performance.now();
      const result = await fn(...args);
      const duration = performance.now() - start;
      this.track(operation, duration);
      return result;
    };
  }

  /**
   * Wrap a sync function with tracking
   */
  wrapSync<Args extends unknown[], R>(
    operation: string,
    fn: (...args: Args) => R
  ): (...args: Args) => R {
    return (...args: Args): R => {
      const start = performance.now();
      const result = fn(...args);
      const duration = performance.now() - start;
      this.track(operation, duration);
      return result;
    };
  }
}
