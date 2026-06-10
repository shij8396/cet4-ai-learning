import {
  AIServiceError,
  AppError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "./errors";
import { logger } from "./logger";

export interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 1;
const DEFAULT_RETRY_DELAY = 1000;

function parseAPIError(data: unknown, status: number): AppError {
  if (typeof data === "object" && data !== null && "code" in data) {
    const err = data as { code: string; error: string; details?: unknown };
    switch (err.code) {
      case "VALIDATION_ERROR":
        return new ValidationError(err.error, err.details);
      case "UNAUTHORIZED":
        return new AuthError(err.error);
      case "FORBIDDEN":
        return new ForbiddenError(err.error);
      case "NOT_FOUND":
        return new NotFoundError(err.error);
      case "RATE_LIMITED":
        return new RateLimitError(err.error);
      case "AI_SERVICE_ERROR":
        return new AIServiceError(err.error);
      default:
        return new AppError(err.error, err.code, status);
    }
  }
  return new AppError(`请求失败 (${status})`, "HTTP_ERROR", status);
}

async function fetchWithTimeout(url: string, options: FetchOptions): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
      body: fetchOptions.body ? JSON.stringify(fetchOptions.body) : undefined,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiClient<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
  const { retries = DEFAULT_RETRIES, retryDelay = DEFAULT_RETRY_DELAY } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);

      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: response.statusText };
        }
        throw parseAPIError(errorData, response.status);
      }

      const data = await response.json();

      if (data && typeof data === "object" && "success" in data && "data" in data) {
        return (data as { data: T }).data;
      }

      return data as T;
    } catch (error) {
      lastError = error;

      if (error instanceof AppError) {
        if (error.status >= 500 && attempt < retries) {
          logger.warn(`API 请求失败，正在重试 (${attempt + 1}/${retries})`, {
            url,
            error: error.message,
          });
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AppError("请求超时，请检查网络连接", "TIMEOUT", 408);
      }

      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new AppError("网络连接失败，请检查网络", "NETWORK_ERROR", 0);
      }

      throw new AppError(
        error instanceof Error ? error.message : "未知请求错误",
        "UNKNOWN_ERROR",
        500,
      );
    }
  }

  throw lastError;
}

export function createAPI() {
  return {
    get<T = unknown>(url: string, options?: FetchOptions) {
      return apiClient<T>(url, { ...options, method: "GET" });
    },

    post<T = unknown>(url: string, body?: unknown, options?: FetchOptions) {
      return apiClient<T>(url, { ...options, method: "POST", body });
    },

    put<T = unknown>(url: string, body?: unknown, options?: FetchOptions) {
      return apiClient<T>(url, { ...options, method: "PUT", body });
    },

    patch<T = unknown>(url: string, body?: unknown, options?: FetchOptions) {
      return apiClient<T>(url, { ...options, method: "PATCH", body });
    },

    delete<T = unknown>(url: string, options?: FetchOptions) {
      return apiClient<T>(url, { ...options, method: "DELETE" });
    },
  };
}

export const api = createAPI();
