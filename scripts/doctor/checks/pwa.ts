import { existsSync, readFileSync } from "fs";

import { config } from "../utils/config";

import type { CheckResult, DoctorIssue } from "../utils/types";

export async function checkPWA(): Promise<CheckResult> {
  const start = Date.now();
  const issues: DoctorIssue[] = [];

  if (!existsSync(config.paths.manifestJson)) {
    issues.push({
      category: "pwa",
      severity: "error",
      message: "public/manifest.json 不存在",
      fix: "创建 PWA manifest.json 文件",
      autoFixable: false,
    });
  } else {
    try {
      const manifest = JSON.parse(readFileSync(config.paths.manifestJson, "utf-8"));
      if (!manifest.name) {
        issues.push({
          category: "pwa",
          severity: "warning",
          message: "manifest.json 缺少 name 字段",
          autoFixable: false,
        });
      }
      if (!manifest.icons || manifest.icons.length === 0) {
        issues.push({
          category: "pwa",
          severity: "warning",
          message: "manifest.json 缺少 icons 配置",
          autoFixable: false,
        });
      }
    } catch {
      issues.push({
        category: "pwa",
        severity: "error",
        message: "manifest.json 格式错误",
        autoFixable: false,
      });
    }
  }

  if (!existsSync(config.paths.iconsDir)) {
    issues.push({
      category: "pwa",
      severity: "warning",
      message: "public/icons 目录不存在",
      autoFixable: false,
    });
  }

  const nextConfigPath = config.paths.nextConfig;
  if (existsSync(nextConfigPath)) {
    const content = readFileSync(nextConfigPath, "utf-8");
    if (!content.includes("next-pwa") && !content.includes("withPWA")) {
      issues.push({
        category: "pwa",
        severity: "warning",
        message: "next.config.ts 未配置 PWA 插件",
        fix: "安装 next-pwa 并在 next.config 中配置",
        autoFixable: false,
      });
    }
  }

  const pkg = config.packageJson;
  const hasPwa = pkg.dependencies?.["next-pwa"] || pkg.devDependencies?.["next-pwa"];
  if (!hasPwa) {
    issues.push({
      category: "pwa",
      severity: "warning",
      message: "next-pwa 未安装",
      fix: "运行: npm install next-pwa",
      autoFixable: true,
    });
  }

  const passed = !issues.some((i) => i.severity === "error");
  return {
    category: "pwa",
    name: "PWA 检测",
    passed,
    issues,
    duration: Date.now() - start,
  };
}
