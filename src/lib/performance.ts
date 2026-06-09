"use client";

import { memo, type ComponentType } from "react";

export function memoWithDisplayName<T extends Record<string, unknown>>(
  Component: ComponentType<T>,
  displayName: string,
): ComponentType<T> {
  const Memoized = memo(Component);
  Memoized.displayName = `Memoized${displayName}`;
  return Memoized;
}

export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private readonly maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

let webVitalsReported = false;

export function reportWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  rating: string;
}) {
  if (typeof window === "undefined") return;

  if (!webVitalsReported) {
    webVitalsReported = true;
  }

  const body = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    page: window.location.pathname,
    timestamp: Date.now(),
  };

  if (metric.rating === "poor") {
    console.warn(`[WebVitals] Poor ${metric.name}: ${metric.value}`, body);
  }

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/vitals", JSON.stringify(body));
  }
}
