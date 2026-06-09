import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  if (typeof globalThis !== "undefined") {
    (globalThis as Record<string, unknown>).__rateLimitCleanup = true;
  }
}

export function createRateLimiter(config: RateLimitConfig) {
  startCleanup();

  return async function rateLimit(request: NextRequest) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? "anonymous";
    const key = `${ip}:${request.nextUrl.pathname}`;
    const now = Date.now();

    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + config.windowMs });
      return null;
    }

    entry.count++;

    const remaining = config.maxRequests - entry.count;

    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return NextResponse.json(
        {
          error: "请求过于频繁，请稍后再试",
          code: "RATE_LIMITED",
          retryAfter,
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
          },
        },
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(config.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
    return response;
  };
}

export const apiRateLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000,
});

export const aiRateLimiter = createRateLimiter({
  maxRequests: Number(process.env.AI_RATE_LIMIT_PER_HOUR) || 20,
  windowMs: 60 * 60 * 1000,
});

export const authRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
});
