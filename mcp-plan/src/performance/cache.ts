// src/performance/cache.ts
// Caching utilities for performance optimization

import { ParsedPlan } from '../services/planParser.js';
import { Session } from '../types/common.js';

/**
 * Cache entry with TTL and access tracking
 */
interface CacheEntry<T> {
  value: T;
  createdAt: number;
  accessedAt: number;
  ttl?: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  hitRatio: number;
  size: number;
}

/**
 * Cache options
 */
export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

/**
 * Set options for individual entries
 */
export interface SetOptions {
  ttl?: number;
}

/**
 * Generic cache interface
 */
export interface Cache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T, options?: SetOptions): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  size(): number;
  getStats(): CacheStats;
  resetStats(): void;
  getOrSet(key: string, factory: () => T | Promise<T>): Promise<T>;
}

/**
 * Create a generic cache with TTL and LRU eviction
 */
export function createCache<T>(options: CacheOptions = {}): Cache<T> {
  const { ttl: defaultTtl, maxSize } = options;
  const entries = new Map<string, CacheEntry<T>>();
  // Track access order for LRU - most recently accessed at the end
  const accessOrder: string[] = [];
  let hits = 0;
  let misses = 0;
  let evictions = 0;

  function isExpired(entry: CacheEntry<T>): boolean {
    const entryTtl = entry.ttl ?? defaultTtl;
    if (!entryTtl) return false;
    return Date.now() - entry.createdAt > entryTtl;
  }

  function updateAccessOrder(key: string): void {
    const idx = accessOrder.indexOf(key);
    if (idx > -1) {
      accessOrder.splice(idx, 1);
    }
    accessOrder.push(key);
  }

  function evictLRU(): void {
    if (!maxSize || entries.size < maxSize) return;

    // Find the oldest accessed key that hasn't expired
    for (let i = 0; i < accessOrder.length; i++) {
      const key = accessOrder[i];
      const entry = entries.get(key);

      // Skip if entry doesn't exist or is expired
      if (!entry || isExpired(entry)) {
        accessOrder.splice(i, 1);
        if (entry) entries.delete(key);
        i--;
        continue;
      }

      // Evict this entry (least recently accessed)
      accessOrder.splice(i, 1);
      entries.delete(key);
      evictions++;
      return;
    }
  }

  return {
    get(key: string): T | undefined {
      const entry = entries.get(key);

      if (!entry) {
        misses++;
        return undefined;
      }

      if (isExpired(entry)) {
        entries.delete(key);
        const idx = accessOrder.indexOf(key);
        if (idx > -1) accessOrder.splice(idx, 1);
        misses++;
        return undefined;
      }

      entry.accessedAt = Date.now();
      updateAccessOrder(key);
      hits++;
      return entry.value;
    },

    set(key: string, value: T, setOptions?: SetOptions): void {
      // Remove existing entry from access order if updating
      const existingIdx = accessOrder.indexOf(key);
      if (existingIdx > -1) {
        accessOrder.splice(existingIdx, 1);
      }

      evictLRU();

      entries.set(key, {
        value,
        createdAt: Date.now(),
        accessedAt: Date.now(),
        ttl: setOptions?.ttl,
      });
      accessOrder.push(key);
    },

    has(key: string): boolean {
      const entry = entries.get(key);
      if (!entry) return false;
      if (isExpired(entry)) {
        entries.delete(key);
        const idx = accessOrder.indexOf(key);
        if (idx > -1) accessOrder.splice(idx, 1);
        return false;
      }
      return true;
    },

    delete(key: string): boolean {
      const idx = accessOrder.indexOf(key);
      if (idx > -1) accessOrder.splice(idx, 1);
      return entries.delete(key);
    },

    clear(): void {
      entries.clear();
      accessOrder.length = 0;
    },

    size(): number {
      return entries.size;
    },

    getStats(): CacheStats {
      const total = hits + misses;
      return {
        hits,
        misses,
        evictions,
        hitRatio: total > 0 ? hits / total : 0,
        size: entries.size,
      };
    },

    resetStats(): void {
      hits = 0;
      misses = 0;
      evictions = 0;
    },

    async getOrSet(key: string, factory: () => T | Promise<T>): Promise<T> {
      const existing = this.get(key);
      if (existing !== undefined) {
        return existing;
      }

      const value = await factory();
      this.set(key, value);
      return value;
    },
  };
}

/**
 * Template cache with pattern-based invalidation
 */
export class TemplateCache {
  private cache: Cache<string>;
  private templateCount = 0;
  // Track keys separately for pattern matching
  private keys = new Set<string>();

  constructor(options: CacheOptions = {}) {
    this.cache = createCache<string>(options);
  }

  getTemplate(path: string): string | undefined {
    return this.cache.get(path);
  }

  setTemplate(path: string, content: string): void {
    const isNew = !this.keys.has(path);
    this.cache.set(path, content);
    this.keys.add(path);
    if (isNew) this.templateCount++;
  }

  invalidate(path: string): void {
    if (this.cache.delete(path)) {
      this.keys.delete(path);
      this.templateCount = Math.max(0, this.templateCount - 1);
    }
  }

  invalidateByPattern(pattern: string): void {
    // Find all keys that start with the pattern
    const keysToDelete: string[] = [];
    for (const key of this.keys) {
      if (key.startsWith(pattern)) {
        keysToDelete.push(key);
      }
    }

    // Delete matching keys
    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.keys.delete(key);
      this.templateCount = Math.max(0, this.templateCount - 1);
    }
  }

  async warmCache(
    paths: string[],
    loader: (path: string) => Promise<string>
  ): Promise<void> {
    for (const path of paths) {
      const content = await loader(path);
      this.setTemplate(path, content);
    }
  }

  getStats(): CacheStats & { templateCount: number } {
    return {
      ...this.cache.getStats(),
      templateCount: this.templateCount,
    };
  }
}

/**
 * Plan cache with hash-based validation
 */
export class PlanCache {
  private planCache: Cache<{ plan: ParsedPlan; hash?: string }>;
  private sessionCache: Cache<Session>;

  constructor(options: CacheOptions = {}) {
    this.planCache = createCache(options);
    this.sessionCache = createCache(options);
  }

  getPlan(path: string): ParsedPlan | undefined {
    const entry = this.planCache.get(path);
    return entry?.plan;
  }

  setPlan(path: string, plan: ParsedPlan, hash?: string): void {
    this.planCache.set(path, { plan, hash });
  }

  getPlanIfValid(path: string, currentHash: string): ParsedPlan | undefined {
    const entry = this.planCache.get(path);
    if (!entry) return undefined;
    if (entry.hash && entry.hash !== currentHash) {
      this.invalidatePlan(path);
      return undefined;
    }
    return entry.plan;
  }

  getSessionLookup(planPath: string, sessionNumber: number): Session | undefined {
    const key = `${planPath}:session:${sessionNumber}`;
    return this.sessionCache.get(key);
  }

  setSessionLookup(planPath: string, sessionNumber: number, session: Session): void {
    const key = `${planPath}:session:${sessionNumber}`;
    this.sessionCache.set(key, session);
  }

  invalidatePlan(path: string): void {
    this.planCache.delete(path);
    // Also invalidate related session lookups
    // Since we can't iterate, we'll clear all session cache for simplicity
    this.sessionCache.clear();
  }
}
