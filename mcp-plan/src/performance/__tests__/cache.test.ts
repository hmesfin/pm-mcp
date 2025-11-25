// src/performance/__tests__/cache.test.ts
// Tests for caching utilities

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Cache,
  createCache,
  TemplateCache,
  PlanCache,
  CacheStats,
} from '../cache.js';

describe('Cache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createCache', () => {
    it('should create a cache with default options', () => {
      const cache = createCache<string>();

      expect(cache).toBeDefined();
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should create a cache with custom TTL', () => {
      const cache = createCache<string>({ ttl: 5000 });

      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');
    });

    it('should create a cache with max size', () => {
      const cache = createCache<string>({ maxSize: 2 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Oldest entry should be evicted
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });
  });

  describe('Cache operations', () => {
    it('should set and get values', () => {
      const cache = createCache<number>();

      cache.set('count', 42);
      expect(cache.get('count')).toBe(42);
    });

    it('should return undefined for missing keys', () => {
      const cache = createCache<string>();

      expect(cache.get('missing')).toBeUndefined();
    });

    it('should check if key exists', () => {
      const cache = createCache<string>();

      cache.set('exists', 'yes');
      expect(cache.has('exists')).toBe(true);
      expect(cache.has('missing')).toBe(false);
    });

    it('should delete entries', () => {
      const cache = createCache<string>();

      cache.set('key', 'value');
      expect(cache.has('key')).toBe(true);

      cache.delete('key');
      expect(cache.has('key')).toBe(false);
    });

    it('should clear all entries', () => {
      const cache = createCache<string>();

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });

    it('should return cache size', () => {
      const cache = createCache<string>();

      expect(cache.size()).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', () => {
      const cache = createCache<string>({ ttl: 1000 });

      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');

      // Advance time past TTL
      vi.advanceTimersByTime(1001);

      expect(cache.get('key')).toBeUndefined();
    });

    it('should not expire entries before TTL', () => {
      const cache = createCache<string>({ ttl: 1000 });

      cache.set('key', 'value');

      // Advance time but not past TTL
      vi.advanceTimersByTime(500);

      expect(cache.get('key')).toBe('value');
    });

    it('should allow per-entry TTL override', () => {
      const cache = createCache<string>({ ttl: 10000 });

      cache.set('short', 'value', { ttl: 500 });
      cache.set('long', 'value');

      vi.advanceTimersByTime(600);

      expect(cache.get('short')).toBeUndefined();
      expect(cache.get('long')).toBe('value');
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entries when full', () => {
      const cache = createCache<string>({ maxSize: 3 });

      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');

      // Access 'a' to make it recently used
      cache.get('a');

      // Add new entry, should evict 'b' (least recently used)
      cache.set('d', '4');

      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
    });

    it('should update access time on get', () => {
      const cache = createCache<string>({ maxSize: 2 });

      cache.set('first', '1');
      cache.set('second', '2');

      // Access first to update its access time
      cache.get('first');

      // Add third, should evict 'second'
      cache.set('third', '3');

      expect(cache.has('first')).toBe(true);
      expect(cache.has('second')).toBe(false);
      expect(cache.has('third')).toBe(true);
    });
  });

  describe('Cache statistics', () => {
    it('should track hits and misses', () => {
      const cache = createCache<string>();

      cache.set('key', 'value');

      cache.get('key'); // hit
      cache.get('key'); // hit
      cache.get('missing'); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it('should calculate hit ratio', () => {
      const cache = createCache<string>();

      cache.set('key', 'value');

      cache.get('key'); // hit
      cache.get('key'); // hit
      cache.get('key'); // hit
      cache.get('missing'); // miss

      const stats = cache.getStats();
      expect(stats.hitRatio).toBe(0.75);
    });

    it('should track evictions', () => {
      const cache = createCache<string>({ maxSize: 2 });

      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3'); // evicts 'a'

      const stats = cache.getStats();
      expect(stats.evictions).toBe(1);
    });

    it('should reset stats', () => {
      const cache = createCache<string>();

      cache.set('key', 'value');
      cache.get('key');
      cache.get('missing');

      cache.resetStats();
      const stats = cache.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const cache = createCache<string>();
      const factory = vi.fn().mockResolvedValue('computed');

      cache.set('key', 'cached');

      const result = await cache.getOrSet('key', factory);

      expect(result).toBe('cached');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should compute and cache value if missing', async () => {
      const cache = createCache<string>();
      const factory = vi.fn().mockResolvedValue('computed');

      const result = await cache.getOrSet('key', factory);

      expect(result).toBe('computed');
      expect(factory).toHaveBeenCalledTimes(1);
      expect(cache.get('key')).toBe('computed');
    });

    it('should handle sync factory functions', async () => {
      const cache = createCache<number>();

      const result = await cache.getOrSet('key', () => 42);

      expect(result).toBe(42);
    });
  });
});

describe('TemplateCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should cache template content', () => {
    const cache = new TemplateCache();

    cache.setTemplate('blog/post.md', '# {{title}}');

    expect(cache.getTemplate('blog/post.md')).toBe('# {{title}}');
  });

  it('should invalidate single template', () => {
    const cache = new TemplateCache();

    cache.setTemplate('template1', 'content1');
    cache.setTemplate('template2', 'content2');

    cache.invalidate('template1');

    expect(cache.getTemplate('template1')).toBeUndefined();
    expect(cache.getTemplate('template2')).toBe('content2');
  });

  it('should invalidate by pattern', () => {
    const cache = new TemplateCache();

    cache.setTemplate('blog/post.md', 'post');
    cache.setTemplate('blog/index.md', 'index');
    cache.setTemplate('saas/dashboard.md', 'dashboard');

    cache.invalidateByPattern('blog/');

    expect(cache.getTemplate('blog/post.md')).toBeUndefined();
    expect(cache.getTemplate('blog/index.md')).toBeUndefined();
    expect(cache.getTemplate('saas/dashboard.md')).toBe('dashboard');
  });

  it('should warm cache with multiple templates', async () => {
    const cache = new TemplateCache();

    const loader = vi.fn()
      .mockResolvedValueOnce('content1')
      .mockResolvedValueOnce('content2');

    await cache.warmCache(['path1', 'path2'], loader);

    expect(loader).toHaveBeenCalledTimes(2);
    expect(cache.getTemplate('path1')).toBe('content1');
    expect(cache.getTemplate('path2')).toBe('content2');
  });

  it('should provide template-specific stats', () => {
    const cache = new TemplateCache();

    cache.setTemplate('t1', 'c1');
    cache.getTemplate('t1'); // hit
    cache.getTemplate('t2'); // miss

    const stats = cache.getStats();
    expect(stats.templateCount).toBe(1);
    expect(stats.hits).toBeGreaterThanOrEqual(1);
  });
});

describe('PlanCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should cache parsed plan', () => {
    const cache = new PlanCache();
    const plan = { projectName: 'Test', phases: [] };

    cache.setPlan('/path/to/plan.md', plan as any);

    expect(cache.getPlan('/path/to/plan.md')).toEqual(plan);
  });

  it('should invalidate plan when content changes', () => {
    const cache = new PlanCache();
    const plan = { projectName: 'Test', phases: [] };

    cache.setPlan('/path/plan.md', plan as any, 'hash1');

    // Same hash should return cached
    expect(cache.getPlanIfValid('/path/plan.md', 'hash1')).toEqual(plan);

    // Different hash should invalidate
    expect(cache.getPlanIfValid('/path/plan.md', 'hash2')).toBeUndefined();
  });

  it('should cache session lookups', () => {
    const cache = new PlanCache();
    const session = { number: 1, title: 'Session 1' };

    cache.setSessionLookup('/plan.md', 1, session as any);

    expect(cache.getSessionLookup('/plan.md', 1)).toEqual(session);
  });

  it('should invalidate session lookups when plan invalidated', () => {
    const cache = new PlanCache();
    const plan = { projectName: 'Test', phases: [] };
    const session = { number: 1, title: 'Session 1' };

    cache.setPlan('/plan.md', plan as any);
    cache.setSessionLookup('/plan.md', 1, session as any);

    cache.invalidatePlan('/plan.md');

    expect(cache.getPlan('/plan.md')).toBeUndefined();
    expect(cache.getSessionLookup('/plan.md', 1)).toBeUndefined();
  });
});
