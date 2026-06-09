import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message: string = "请先登录") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "权限不足") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "资源不存在") {
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "请求过于频繁，请稍后再试") {
    super(message, "RATE_LIMITED", 429);
    this.name = "RateLimitError";
  }
}

export class AIServiceError extends AppError {
  constructor(
    message: string = "AI 服务暂时不可用",
    public aiProvider?: string,
    public retryAfter?: number,
  ) {
    super(message, "AI_SERVICE_ERROR", 503);
    this.name = "AIServiceError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "数据库错误") {
    super(message, "DATABASE_ERROR", 500);
    this.name = "DatabaseError";
  }
}

export interface APIErrorResponse {
  error: string;
  code: string;
  details?: unknown;
  timestamp: string;
}

export function formatErrorResponse(error: unknown): APIErrorResponse {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString(),
    };
  }

  if (error instanceof Error) {
    return {
      error: process.env.NODE_ENV === "development" ? error.message : "服务器内部错误",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
  }

  return {
    error: "未知错误",
    code: "UNKNOWN_ERROR",
    timestamp: new Date().toISOString(),
  };
}

export function apiErrorResponse(error: unknown, status?: number) {
  const body = formatErrorResponse(error);
  const httpStatus = status ?? (error instanceof AppError ? error.status : 500);

  if (process.env.NODE_ENV === "development" && error instanceof Error) {
    console.error(`[API Error] ${error.name}: ${error.message}`, error.stack);
  }

  return NextResponse.json(body, { status: httpStatus });
}

export function apiSuccessResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}
