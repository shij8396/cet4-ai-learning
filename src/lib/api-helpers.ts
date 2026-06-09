import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

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

export class UnauthorizedError extends Error {
  constructor() {
    super("请先登录");
    this.name = "UnauthorizedError";
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const message = error instanceof Error ? error.message : "服务器内部错误";
  return NextResponse.json({ error: message }, { status: 500 });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
