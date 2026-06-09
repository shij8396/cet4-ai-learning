interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 5 * 60 * 1000;

function getCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}:${params[k]}`)
    .join(",");
  return `${prefix}:${sorted}`;
}

export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });

  if (memoryCache.size > 1000) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
}

export function invalidateCache(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

export function clearAllCache(): void {
  memoryCache.clear();
}

export function withCache<T>(
  prefix: string,
  params: Record<string, unknown>,
  fetcher: () => Promise<T>,
  ttl?: number,
): Promise<T> {
  const key = getCacheKey(prefix, params);
  const cached = getCached<T>(key);
  if (cached !== null) return Promise.resolve(cached);

  return fetcher().then((data) => {
    setCache(key, data, ttl);
    return data;
  });
}

export const queryCache = {
  words: {
    prefix: "words",
    ttl: 10 * 60 * 1000,
  },
  reading: {
    prefix: "reading",
    ttl: 5 * 60 * 1000,
  },
  analytics: {
    prefix: "analytics",
    ttl: 2 * 60 * 1000,
  },
  user: {
    prefix: "user",
    ttl: 60 * 1000,
  },
};
