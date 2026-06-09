import { existsSync, readFileSync } from "fs";

import { config } from "../utils/config";

import type { CheckResult, DoctorIssue } from "../utils/types";

export async function checkEnv(): Promise<CheckResult> {
  const start = Date.now();
  const issues: DoctorIssue[] = [];

  const envFiles = [config.paths.envLocal, config.paths.envDevelopment, config.paths.envExample];
  const existingEnvFile = envFiles.find((f) => existsSync(f));

  if (!existingEnvFile) {
    issues.push({
      category: "env",
      severity: "error",
      message: "未找到环境变量文件 (.env.local / .env.development / .env.example)",
      fix: "运行: cp .env.example .env.local 并填入正确的值",
      autoFixable: false,
    });
    return {
      category: "env",
      name: "环境变量检查",
      passed: false,
      issues,
      duration: Date.now() - start,
    };
  }

  let envContent = "";
  try {
    envContent = readFileSync(existingEnvFile, "utf-8");
  } catch {
    issues.push({
      category: "env",
      severity: "error",
      message: `无法读取环境变量文件: ${existingEnvFile}`,
      autoFixable: false,
    });
    return {
      category: "env",
      name: "环境变量检查",
      passed: false,
      issues,
      duration: Date.now() - start,
    };
  }

  const lines = envContent.split("\n");
  const envMap: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const value = trimmed
      .substring(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    envMap[key] = value;
  }

  for (const v of config.requiredEnvVars) {
    const value = envMap[v.key];
    if (!value) {
      issues.push({
        category: "env",
        severity: "error",
        message: `${v.key} 未设置`,
        fix: `在 .env.local 中添加: ${v.key}="your-value"`,
        autoFixable: true,
      });
    } else if (
      value.includes("your-") ||
      value.includes("change-me") ||
      value === "sk-your-openai-api-key"
    ) {
      issues.push({
        category: "env",
        severity: "warning",
        message: `${v.key} 使用了占位值: "${value}"`,
        fix: `将 ${v.key} 替换为真实值`,
        autoFixable: false,
      });
    } else if (v.pattern && !v.pattern.test(value)) {
      issues.push({
        category: "env",
        severity: "warning",
        message: `${v.key} 格式不正确: "${value.substring(0, 20)}..."`,
        fix: `${v.key} 应符合格式: ${v.pattern}`,
        autoFixable: false,
      });
    }
  }

  for (const key of config.optionalEnvVars) {
    if (!envMap[key]) {
      issues.push({
        category: "env",
        severity: "info",
        message: `可选变量 ${key} 未设置`,
        autoFixable: false,
      });
    }
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  return {
    category: "env",
    name: "环境变量检查",
    passed: !hasErrors,
    issues,
    duration: Date.now() - start,
  };
}
