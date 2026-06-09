import { existsSync, readFileSync } from "fs";

import { config } from "../utils/config";

import type { CheckResult, DoctorIssue } from "../utils/types";

export async function checkNextAuth(): Promise<CheckResult> {
  const start = Date.now();
  const issues: DoctorIssue[] = [];

  const routePath = config.paths.nextAuthRoute;
  if (!existsSync(routePath)) {
    issues.push({
      category: "nextauth",
      severity: "error",
      message: "NextAuth API 路由不存在",
      file: routePath,
      fix: `创建 ${routePath}: export { GET, POST } from "@/lib/auth"`,
      autoFixable: false,
    });
    return {
      category: "nextauth",
      name: "NextAuth 检测",
      passed: false,
      issues,
      duration: Date.now() - start,
    };
  }

  const routeContent = readFileSync(routePath, "utf-8");
  if (!routeContent.includes("GET") || !routeContent.includes("POST")) {
    issues.push({
      category: "nextauth",
      severity: "error",
      message: "NextAuth route 未正确导出 GET/POST handlers",
      file: routePath,
      fix: "export const { GET, POST } = handlers; (从 @/lib/auth 导入)",
      autoFixable: false,
    });
  }

  const authPath = config.paths.auth;
  if (!existsSync(authPath)) {
    issues.push({
      category: "nextauth",
      severity: "error",
      message: "auth.ts 不存在",
      file: authPath,
      fix: "创建 src/lib/auth.ts 并配置 NextAuth",
      autoFixable: false,
    });
    return {
      category: "nextauth",
      name: "NextAuth 检测",
      passed: false,
      issues,
      duration: Date.now() - start,
    };
  }

  const authContent = readFileSync(authPath, "utf-8");

  if (!authContent.includes("NextAuth(")) {
    issues.push({
      category: "nextauth",
      severity: "error",
      message: "auth.ts 未调用 NextAuth()",
      file: authPath,
      autoFixable: false,
    });
  }

  if (!authContent.includes("PrismaAdapter")) {
    issues.push({
      category: "nextauth",
      severity: "warning",
      message: "未使用 PrismaAdapter",
      file: authPath,
      fix: "import { PrismaAdapter } from '@auth/prisma-adapter'",
      autoFixable: false,
    });
  }

  if (!authContent.includes("CredentialsProvider")) {
    issues.push({
      category: "nextauth",
      severity: "warning",
      message: "未配置 CredentialsProvider",
      file: authPath,
      autoFixable: false,
    });
  }

  const envFiles = [config.paths.envLocal, config.paths.envDevelopment];
  let hasAuthSecret = false;
  let hasAuthUrl = false;

  for (const envFile of envFiles) {
    if (!existsSync(envFile)) continue;
    const content = readFileSync(envFile, "utf-8");
    if (content.includes("AUTH_SECRET=") && !content.includes("AUTH_SECRET=change-me")) {
      hasAuthSecret = true;
    }
    if (content.includes("AUTH_URL=")) {
      hasAuthUrl = true;
    }
  }

  if (!hasAuthSecret) {
    issues.push({
      category: "nextauth",
      severity: "error",
      message: "AUTH_SECRET 未设置或使用了默认值",
      fix: "运行: openssl rand -base64 32 并设置到 AUTH_SECRET",
      autoFixable: false,
    });
  }

  if (!hasAuthUrl) {
    issues.push({
      category: "nextauth",
      severity: "error",
      message: "AUTH_URL 未设置",
      fix: '在 .env.local 中添加: AUTH_URL="http://localhost:3000"',
      autoFixable: true,
    });
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  return {
    category: "nextauth",
    name: "NextAuth 检测",
    passed: !hasErrors && issues.every((i) => i.severity !== "error"),
    issues,
    duration: Date.now() - start,
  };
}
