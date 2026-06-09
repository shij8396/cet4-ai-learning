import { getAIConfig, getFallbackProvider, isProviderAvailable } from "../config";

import {
  generateText as adapterGenerateText,
  generateTextStream as adapterGenerateStream,
} from "./adapter";

import type { AIRequest, AIResponse, AIStreamChunk, AIError, AIProvider } from "../types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryWithRetry<T>(
  fn: (provider: AIProvider) => Promise<T>,
  provider: AIProvider,
  maxRetries: number,
): Promise<T> {
  let lastError: AIError | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn(provider);
    } catch (err) {
      lastError = err as AIError;
      if (!lastError.retryable) throw lastError;
      if (attempt < maxRetries - 1) {
        await sleep(Math.min(1000 * Math.pow(2, attempt), 8000));
      }
    }
  }

  throw (
    lastError ||
    ({ code: "AI_UNKNOWN", message: "未知错误", provider, retryable: false } as AIError)
  );
}

async function tryWithFallback<T>(
  fn: (provider: AIProvider) => Promise<T>,
  provider: AIProvider,
  maxRetries: number,
): Promise<T> {
  try {
    return await tryWithRetry(fn, provider, maxRetries);
  } catch (error) {
    const fallback = getFallbackProvider(provider);
    if (!fallback) throw error;
    try {
      return await tryWithRetry(fn, fallback, maxRetries);
    } catch {
      throw error;
    }
  }
}

export async function generateText(
  request: AIRequest,
  providerOverride?: AIProvider,
): Promise<AIResponse> {
  const provider = providerOverride || getAIConfig().provider;

  if (!isProviderAvailable(provider)) {
    const fallback = getFallbackProvider(provider);
    if (fallback) {
      return tryWithRetry(
        (p) => adapterGenerateText(request, p),
        fallback,
        getAIConfig(fallback).maxRetries,
      );
    }
  }

  return tryWithFallback(
    (p) => adapterGenerateText(request, p),
    provider,
    getAIConfig(provider).maxRetries,
  );
}

export async function* generateTextStream(
  request: AIRequest,
  providerOverride?: AIProvider,
): AsyncGenerator<AIStreamChunk> {
  const provider = providerOverride || getAIConfig().provider;

  if (!isProviderAvailable(provider)) {
    const fallback = getFallbackProvider(provider);
    if (fallback) {
      yield* adapterGenerateStream(request, fallback);
      return;
    }
  }

  yield* adapterGenerateStream(request, provider);
}
