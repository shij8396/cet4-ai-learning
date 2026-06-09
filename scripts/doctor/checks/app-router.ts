import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

import { config } from "../utils/config";

import type { CheckResult, DoctorIssue } from "../utils/types";

export async function checkAppRouter(): Promise<CheckResult> {
  const start = Date.now();
  const issues: DoctorIssue[] = [];

  if (!existsSync(config.paths.appDir)) {
    issues.push({
      category: "app-router",
      severity: "error",
      message: "src/app 目录不存在",
      autoFixable: false,
    });
    return {
      category: "app-router",
      name: "App Router 检测",
      passed: false,
      issues,
      duration: Date.now() - start,
    };
  }

  if (!existsSync(join(config.paths.appDir, "layout.tsx"))) {
    issues.push({
      category: "app-router",
      severity: "error",
      message: "根 layout.tsx 不存在",
      file: join(config.paths.appDir, "layout.tsx"),
      autoFixable: false,
    });
  }

  if (!existsSync(join(config.paths.appDir, "page.tsx"))) {
    issues.push({
      category: "app-router",
      severity: "info",
      message: "根 page.tsx 不存在（如果有其他路由组则可忽略）",
      file: join(config.paths.appDir, "page.tsx"),
      autoFixable: false,
    });
  }

  if (!existsSync(config.paths.apiDir)) {
    issues.push({
      category: "app-router",
      severity: "info",
      message: "src/app/api 目录不存在",
      autoFixable: false,
    });
  }

  function walkDir(dir: string, depth: number = 0) {
    if (depth > 4 || !existsSync(dir)) return;
    const entries = readdirSync(dir);

    const hasPage = entries.some((e) => e === "page.tsx" || e === "page.ts" || e === "page.jsx");
    const hasRoute = entries.some(
      (e) => e === "route.tsx" || e === "route.ts" || e === "route.jsx",
    );
    const files = entries.filter((e) => {
      const p = join(dir, e);
      try {
        return statSync(p).isFile();
      } catch {
        return false;
      }
    });

    const tsFiles = files.filter((f) => /\.(tsx?|jsx?)$/.test(f));
    if ((hasPage || hasRoute) && tsFiles.length > 2) {
      for (const f of tsFiles) {
        if (
          f !== "page.tsx" &&
          f !== "page.ts" &&
          f !== "route.ts" &&
          f !== "route.tsx" &&
          f !== "layout.tsx" &&
          f !== "layout.ts" &&
          f !== "loading.tsx" &&
          f !== "error.tsx" &&
          f !== "not-found.tsx" &&
          f !== "template.tsx"
        ) {
          issues.push({
            category: "app-router",
            severity: "warning",
            message: `非标准文件与 page/route 共存: ${f}`,
            file: join(dir, f),
            fix: "将非页面文件移到 components/ 或 features/ 目录",
            autoFixable: false,
          });
        }
      }
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        if (
          statSync(fullPath).isDirectory() &&
          !entry.startsWith(".") &&
          !entry.startsWith("(") &&
          entry !== "node_modules"
        ) {
          walkDir(fullPath, depth + 1);
        }
      } catch {
        /* skip */
      }
    }
  }

  walkDir(config.paths.appDir);

  const hasErrors = issues.some((i) => i.severity === "error");
  return {
    category: "app-router",
    name: "App Router 检测",
    passed: !hasErrors,
    issues,
    duration: Date.now() - start,
  };
}
