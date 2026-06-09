import type { CacheEntry } from "./types";

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 30 * 60 * 1000;

export function getCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${String(params[k])}`)
    .join("&");
  return `${prefix}:${sorted}`;
}

export function getFromCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() - entry.createdAt > entry.ttl) {
    store.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  store.set(key, {
    data,
    createdAt: Date.now(),
    ttl,
    key,
  });
}

export function invalidateCache(prefix?: string): void {
  if (prefix) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) {
        store.delete(key);
      }
    }
  } else {
    store.clear();
  }
}

export function getCacheSize(): number {
  return store.size;
}

export function getCacheStats(): {
  size: number;
  entries: Array<{ key: string; age: number; ttl: number }>;
} {
  const entries: Array<{ key: string; age: number; ttl: number }> = [];

  for (const [key, entry] of store) {
    entries.push({
      key,
      age: Date.now() - entry.createdAt,
      ttl: entry.ttl,
    });
  }

  return { size: store.size, entries };
}
