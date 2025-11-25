// src/performance/memoize.ts
// Memoization and lazy loading utilities

/**
 * Options for memoization
 */
export interface MemoizeOptions<Args extends unknown[]> {
  keyFn?: (...args: Args) => string;
  maxSize?: number;
}

/**
 * Memoized function with cache management
 */
export interface MemoizedFunction<Args extends unknown[], R> {
  (...args: Args): R;
  clear(): void;
  size(): number;
}

/**
 * Create a key from arguments
 */
function defaultKeyFn(...args: unknown[]): string {
  return JSON.stringify(args);
}

/**
 * Memoize a synchronous function
 */
export function memoize<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  options: MemoizeOptions<Args> = {}
): (...args: Args) => R {
  const { keyFn = defaultKeyFn, maxSize } = options;
  const cache = new Map<string, R>();
  const accessOrder: string[] = [];

  return (...args: Args): R => {
    const key = keyFn(...args);

    if (cache.has(key)) {
      // Update access order for LRU
      const idx = accessOrder.indexOf(key);
      if (idx > -1) {
        accessOrder.splice(idx, 1);
        accessOrder.push(key);
      }
      return cache.get(key)!;
    }

    const result = fn(...args);

    // Evict oldest if at max size
    if (maxSize && cache.size >= maxSize) {
      const oldestKey = accessOrder.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    cache.set(key, result);
    accessOrder.push(key);

    return result;
  };
}

/**
 * Create a memoized function with cache management methods
 */
export function createMemoizedFunction<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  options: MemoizeOptions<Args> = {}
): MemoizedFunction<Args, R> {
  const { keyFn = defaultKeyFn, maxSize } = options;
  const cache = new Map<string, R>();
  const accessOrder: string[] = [];

  const memoized = (...args: Args): R => {
    const key = keyFn(...args);

    if (cache.has(key)) {
      const idx = accessOrder.indexOf(key);
      if (idx > -1) {
        accessOrder.splice(idx, 1);
        accessOrder.push(key);
      }
      return cache.get(key)!;
    }

    const result = fn(...args);

    if (maxSize && cache.size >= maxSize) {
      const oldestKey = accessOrder.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    cache.set(key, result);
    accessOrder.push(key);

    return result;
  };

  memoized.clear = () => {
    cache.clear();
    accessOrder.length = 0;
  };

  memoized.size = () => cache.size;

  return memoized;
}

/**
 * Memoize an async function
 */
export function memoizeAsync<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  options: MemoizeOptions<Args> = {}
): (...args: Args) => Promise<R> {
  const { keyFn = defaultKeyFn } = options;
  const cache = new Map<string, Promise<R>>();
  const resolved = new Map<string, R>();

  return async (...args: Args): Promise<R> => {
    const key = keyFn(...args);

    // Return cached resolved value
    if (resolved.has(key)) {
      return resolved.get(key)!;
    }

    // Return in-flight promise to prevent concurrent calls
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    // Create new promise
    const promise = fn(...args);
    cache.set(key, promise);

    try {
      const result = await promise;
      resolved.set(key, result);
      return result;
    } catch (error) {
      // Don't cache failed promises
      cache.delete(key);
      throw error;
    }
  };
}

/**
 * Memoize with time-to-live
 */
export function memoizeWithTTL<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  ttl: number,
  options: MemoizeOptions<Args> = {}
): (...args: Args) => R {
  const { keyFn = defaultKeyFn } = options;
  const cache = new Map<string, { value: R; timestamp: number }>();

  return (...args: Args): R => {
    const key = keyFn(...args);
    const now = Date.now();

    const entry = cache.get(key);
    if (entry && now - entry.timestamp < ttl) {
      return entry.value;
    }

    const result = fn(...args);
    cache.set(key, { value: result, timestamp: now });

    return result;
  };
}

/**
 * Lazy value interface
 */
export interface LazyValueInterface<T> {
  get(): T;
  isInitialized(): boolean;
  reset(): void;
  map<U>(fn: (value: T) => U): LazyValueInterface<U>;
  flatMap<U>(fn: (value: T) => LazyValueInterface<U>): LazyValueInterface<U>;
  orElse(defaultValue: T): LazyValueInterface<T>;
}

/**
 * Lazy value class
 */
export class LazyValue<T> implements LazyValueInterface<T> {
  private computed = false;
  private cachedValue?: T;
  private cachedError?: Error;
  private readonly compute: () => T;

  constructor(compute: () => T) {
    this.compute = compute;
  }

  get value(): T {
    return this.get();
  }

  get(): T {
    if (!this.computed) {
      try {
        this.cachedValue = this.compute();
      } catch (error) {
        this.cachedError = error instanceof Error ? error : new Error(String(error));
      }
      this.computed = true;
    }

    if (this.cachedError) {
      throw this.cachedError;
    }

    return this.cachedValue!;
  }

  isInitialized(): boolean {
    return this.computed;
  }

  reset(): void {
    this.computed = false;
    this.cachedValue = undefined;
    this.cachedError = undefined;
  }

  map<U>(fn: (value: T) => U): LazyValue<U> {
    return new LazyValue(() => fn(this.get()));
  }

  flatMap<U>(fn: (value: T) => LazyValueInterface<U>): LazyValue<U> {
    return new LazyValue(() => fn(this.get()).get());
  }

  orElse(defaultValue: T): LazyValue<T> {
    return new LazyValue(() => {
      try {
        return this.get();
      } catch {
        return defaultValue;
      }
    });
  }
}

/**
 * Create a lazy synchronous value
 */
export function lazy<T>(compute: () => T): LazyValue<T> {
  return new LazyValue(compute);
}

/**
 * Async lazy value interface
 */
export interface AsyncLazyValueInterface<T> {
  get(): Promise<T>;
  isInitialized(): boolean;
  reset(): void;
}

/**
 * Async lazy value class
 */
class AsyncLazyValue<T> implements AsyncLazyValueInterface<T> {
  private promise?: Promise<T>;
  private resolved = false;
  private cachedValue?: T;
  private readonly compute: () => Promise<T>;

  constructor(compute: () => Promise<T>) {
    this.compute = compute;
  }

  async get(): Promise<T> {
    if (this.resolved) {
      return this.cachedValue!;
    }

    if (this.promise) {
      return this.promise;
    }

    this.promise = this.compute();

    try {
      this.cachedValue = await this.promise;
      this.resolved = true;
      return this.cachedValue;
    } catch (error) {
      this.promise = undefined;
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.resolved;
  }

  reset(): void {
    this.promise = undefined;
    this.resolved = false;
    this.cachedValue = undefined;
  }
}

/**
 * Create a lazy async value
 */
export function lazyAsync<T>(compute: () => Promise<T>): AsyncLazyValueInterface<T> {
  return new AsyncLazyValue(compute);
}
