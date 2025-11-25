// src/performance/index.ts
// Performance utilities - caching, memoization, and benchmarking

// Cache utilities
export {
  createCache,
  TemplateCache,
  PlanCache,
  type Cache,
  type CacheOptions,
  type CacheStats,
  type SetOptions,
} from './cache.js';

// Memoization utilities
export {
  memoize,
  memoizeAsync,
  memoizeWithTTL,
  createMemoizedFunction,
  LazyValue,
  lazy,
  lazyAsync,
  type MemoizeOptions,
  type MemoizedFunction,
  type LazyValueInterface,
  type AsyncLazyValueInterface,
} from './memoize.js';

// Benchmark utilities
export {
  createBenchmark,
  measureSync,
  measureAsync,
  PerformanceTracker,
  type Benchmark,
  type BenchmarkResult,
  type PerformanceMetrics,
} from './benchmark.js';
