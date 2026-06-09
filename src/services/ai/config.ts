import type { AIConfig, AIProvider } from "./types";

const configs: Record<AIProvider, Omit<AIConfig, "provider">> = {
  gemini: {
    model: process.env.AI_DEFAULT_MODEL || "gemini-2.0-flash",
    maxTokens: 1024,
    temperature: 0.7,
    topP: 0.95,
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || "3", 10),
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || "30000", 10),
  },
  openrouter: {
    model: "google/gemini-2.0-flash-001",
    maxTokens: 1024,
    temperature: 0.7,
    topP: 0.95,
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || "3", 10),
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || "30000", 10),
  },
  openai: {
    model: "gpt-4o-mini",
    maxTokens: 1024,
    temperature: 0.7,
    topP: 0.95,
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || "3", 10),
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || "30000", 10),
  },
};

export function getAIConfig(provider?: AIProvider): AIConfig {
  const p = provider || (process.env.AI_DEFAULT_PROVIDER as AIProvider) || "gemini";

  if (!configs[p]) {
    return { provider: p as AIProvider, ...configs.gemini };
  }

  return { provider: p, ...configs[p] };
}

export function getApiKey(provider: AIProvider): string {
  switch (provider) {
    case "gemini":
      return process.env.GEMINI_API_KEY || "";
    case "openrouter":
      return process.env.OPENROUTER_API_KEY || "";
    case "openai":
      return process.env.OPENAI_API_KEY || "";
    default:
      return "";
  }
}

export function isProviderAvailable(provider: AIProvider): boolean {
  return getApiKey(provider).length > 0;
}

export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = ["gemini", "openrouter", "openai"];
  return providers.filter((p) => isProviderAvailable(p));
}

export function getFallbackProvider(currentProvider: AIProvider): AIProvider | null {
  const order: AIProvider[] = ["gemini", "openrouter", "openai"];
  const idx = order.indexOf(currentProvider);
  for (let i = idx + 1; i < order.length; i++) {
    if (isProviderAvailable(order[i])) return order[i];
  }
  for (let i = 0; i < idx; i++) {
    if (isProviderAvailable(order[i])) return order[i];
  }
  return null;
}
