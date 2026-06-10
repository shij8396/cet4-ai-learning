import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getUserRole, hasPermission, type Permission } from "@/lib/rbac";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(
    message: string,
    public code: ApiErrorCode,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor() {
    super("请先登录", "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "权限不足") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export async function getAuthUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}

export function requireAuth(): string {
  throw new Error("use getAuthUserIdOrError() instead - async required");
}

export async function getAuthUserIdOrError(): Promise<string> {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

export async function requireApiAuth(): Promise<string> {
  return getAuthUserIdOrError();
}

export async function requireAdmin(): Promise<string> {
  const userId = await requireApiAuth();
  if (getUserRole(userId) !== "ADMIN") {
    throw new ForbiddenError("需要管理员权限");
  }
  return userId;
}

export async function requirePermission(permission: Permission): Promise<string> {
  const userId = await requireApiAuth();
  const role = getUserRole(userId);
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(`需要 ${permission.action}:${permission.resource} 权限`);
  }
  return userId;
}

export function getRequestId(request?: Request) {
  return request?.headers.get("x-request-id") || crypto.randomUUID();
}

export function apiError(
  error: unknown,
  status = 500,
  code: ApiErrorCode = "INTERNAL_ERROR",
  request?: Request,
) {
  const requestId = getRequestId(request);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        requestId,
        details: error.details,
      },
      { status: error.status },
    );
  }

  const message = error instanceof Error ? error.message : "服务器内部错误";
  return NextResponse.json({ error: message, code, requestId }, { status });
}

export function handleApiError(error: unknown, request?: Request) {
  return apiError(error, 500, "INTERNAL_ERROR", request);
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

interface RouteRateLimitConfig {
  key: string;
  maxRequests: number;
  windowMs: number;
}

const routeRateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function enforceRateLimit(request: Request, config: RouteRateLimitConfig) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "anonymous";
  const key = `${config.key}:${ip}`;
  const now = Date.now();
  const existing = routeRateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    routeRateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return null;
  }

  existing.count += 1;
  if (existing.count <= config.maxRequests) {
    return null;
  }

  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return NextResponse.json(
    {
      error: "请求过于频繁，请稍后再试",
      code: "RATE_LIMITED",
      requestId: getRequestId(request),
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(config.maxRequests),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}
