import { existsSync, readdirSync, readFileSync } from "fs";

import { config } from "../utils/config";

import type { CheckResult, DoctorIssue } from "../utils/types";

export async function checkAISystem(): Promise<CheckResult> {
  const start = Date.now();
  const issues: DoctorIssue[] = [];

  const aiDir = config.paths.aiServices;
  if (!existsSync(aiDir)) {
    issues.push({
      category: "ai",
      severity: "warning",
      message: "AI 服务目录不存在",
      file: aiDir,
      fix: "创建 src/services/ai/ 目录",
      autoFixable: false,
    });
  } else {
    const subdirs = ["engines", "generators", "providers", "prompts", "validators"];
    const existing = readdirSync(aiDir);

    for (const sub of subdirs) {
      if (!existing.includes(sub)) {
        issues.push({
          category: "ai",
          severity: "warning",
          message: `缺失 AI 子模块: ${sub}`,
          file: `${aiDir}/${sub}`,
          autoFixable: false,
        });
      }
    }

    const indexFile = `${aiDir}/index.ts`;
    if (!existsSync(indexFile)) {
      issues.push({
        category: "ai",
        severity: "warning",
        message: "AI 服务缺少 index.ts 入口",
        file: indexFile,
        autoFixable: false,
      });
    } else {
      const content = readFileSync(indexFile, "utf-8");
      if (content.includes("withAIErrorHandling") || content.includes("handleAIServiceError")) {
        // Good: has error handling
      } else {
        issues.push({
          category: "ai",
          severity: "warning",
          message: "AI 服务缺少统一错误处理",
          file: indexFile,
          fix: "添加 withAIErrorHandling 和 handleAIServiceError 工具函数",
          autoFixable: false,
        });
      }
    }
  }

  const envVars = ["OPENAI_API_KEY", "AI_PROVIDER"];
  for (const envFile of [config.paths.envLocal, config.paths.envDevelopment]) {
    if (!existsSync(envFile)) continue;
    const content = readFileSync(envFile, "utf-8");
    for (const v of envVars) {
      if (!content.includes(`${v}=`)) {
        issues.push({
          category: "ai",
          severity: "warning",
          message: `${v} 未在 ${envFile.split("/").pop() || envFile} 中配置`,
          fix: `添加 ${v}=your-key`,
          autoFixable: true,
        });
      }
    }
  }

  const aiRoutes = ["src/app/api/ai/coach/route.ts", "src/app/api/ai/debug/route.ts"];
  for (const route of aiRoutes) {
    const fullPath = `${config.projectRoot}/${route}`;
    if (!existsSync(fullPath)) {
      issues.push({
        category: "ai",
        severity: "info",
        message: `AI API 路由不存在: ${route}`,
        autoFixable: false,
      });
    }
  }

  const passed = !issues.some((i) => i.severity === "error");
  return {
    category: "ai",
    name: "AI 系统检测",
    passed,
    issues,
    duration: Date.now() - start,
  };
}
