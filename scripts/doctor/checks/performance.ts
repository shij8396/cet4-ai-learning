import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

import { config } from "../utils/config";

import type { CheckResult, DoctorIssue } from "../utils/types";

function getDirSize(dir: string): number {
  if (!existsSync(dir)) return 0;
  let size = 0;
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        const st = statSync(fullPath);
        if (st.isDirectory() && entry !== "node_modules") {
          size += getDirSize(fullPath);
        } else if (st.isFile()) {
          size += st.size;
        }
      } catch {
        /* skip */
      }
    }
  } catch {
    /* skip */
  }
  return size;
}

export async function checkPerformance(): Promise<CheckResult> {
  const start = Date.now();
  const issues: DoctorIssue[] = [];

  const nextDir = `${config.projectRoot}/.next`;
  if (existsSync(nextDir)) {
    const nextSize = getDirSize(nextDir);
    const nextSizeMB = Math.round(nextSize / (1024 * 1024));
    if (nextSizeMB > 500) {
      issues.push({
        category: "performance",
        severity: "warning",
        message: `.next 目录过大: ${nextSizeMB}MB`,
        fix: "运行: rm -rf .next && npm run build 清理构建缓存",
        autoFixable: true,
      });
    }
  }

  const nodeModulesDir = `${config.projectRoot}/node_modules`;
  if (existsSync(nodeModulesDir)) {
    const nmSize = getDirSize(nodeModulesDir);
    const nmSizeMB = Math.round(nmSize / (1024 * 1024));
    if (nmSizeMB > 800) {
      issues.push({
        category: "performance",
        severity: "info",
        message: `node_modules 大小: ${nmSizeMB}MB`,
        fix: "考虑使用 pnpm 或清理未使用的依赖",
        autoFixable: false,
      });
    }
  }

  const cacheDir = `${config.projectRoot}/.cache`;
  if (existsSync(cacheDir)) {
    const cacheSize = getDirSize(cacheDir);
    const cacheSizeMB = Math.round(cacheSize / (1024 * 1024));
    if (cacheSizeMB > 50) {
      issues.push({
        category: "performance",
        severity: "warning",
        message: `缓存目录过大: ${cacheSizeMB}MB`,
        fix: "清理 .cache 目录",
        autoFixable: true,
      });
    }
  }

  const tsconfigPath = config.paths.tsconfig;
  if (existsSync(tsconfigPath)) {
    const tsconfigRaw = JSON.parse(readFileSync(tsconfigPath, "utf-8"));
    if (tsconfigRaw.compilerOptions) {
      if (!tsconfigRaw.compilerOptions.incremental) {
        issues.push({
          category: "performance",
          severity: "info",
          message: "TypeScript 未启用增量编译 (incremental)",
          fix: '在 tsconfig.json 中添加 "incremental": true',
          autoFixable: false,
        });
      }
    }
  }

  const nextConfigPath = config.paths.nextConfig;
  if (existsSync(nextConfigPath)) {
    const content = readFileSync(nextConfigPath, "utf-8");
    if (!content.includes("compression") && !content.includes("CompressionPlugin")) {
      issues.push({
        category: "performance",
        severity: "info",
        message: "Next.js 未启用 gzip/brotli 压缩",
        fix: "在 next.config 中配置 compression 插件",
        autoFixable: false,
      });
    }
    if (!content.includes("images") || !content.includes("minimumCacheTTL")) {
      issues.push({
        category: "performance",
        severity: "info",
        message: "Next.js 图片未配置缓存策略",
        fix: "在 next.config 中配置 images.minimumCacheTTL",
        autoFixable: false,
      });
    }
  }

  const passed = issues.every((i) => i.severity !== "error");
  return {
    category: "performance",
    name: "性能分析",
    passed,
    issues,
    duration: Date.now() - start,
  };
}
