import { existsSync, readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";

import { config } from "../utils/config";

import type { CheckResult, DoctorIssue } from "../utils/types";

export async function checkRoutes(): Promise<CheckResult> {
  const start = Date.now();
  const issues: DoctorIssue[] = [];

  const routeMap = new Map<string, string>();

  function scanRoutes(dir: string, prefix = "/api") {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir);

    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "node_modules") continue;
      const fullPath = join(dir, entry);
      try {
        const st = statSync(fullPath);
        if (st.isDirectory()) {
          let nextPrefix = prefix;
          if (entry.startsWith("[") && entry.endsWith("]")) {
            nextPrefix = `${prefix}/:${entry.slice(1, -1)}`;
          } else if (entry.startsWith("(") && entry.endsWith(")")) {
            nextPrefix = prefix;
          } else {
            nextPrefix = `${prefix}/${entry}`;
          }
          scanRoutes(fullPath, nextPrefix);
        } else if (entry === "route.ts" || entry === "route.tsx") {
          const route = prefix;
          if (routeMap.has(route)) {
            issues.push({
              category: "routes",
              severity: "error",
              message: `重复的路由: ${route}`,
              file: fullPath,
              autoFixable: false,
            });
          } else {
            routeMap.set(route, fullPath);

            const content = readFileSync(fullPath, "utf-8");
            if (
              content.includes("export async function GET") &&
              !content.includes("export async function POST")
            ) {
              issues.push({
                category: "routes",
                severity: "info",
                message: `${route} 仅支持 GET，缺少 POST`,
                file: fullPath,
                autoFixable: false,
              });
            }
          }
        }
      } catch {
        /* skip */
      }
    }
  }

  scanRoutes(config.paths.apiDir, "/api");

  function scanPages(dir: string, prefix = "") {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir);

    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "api") continue;
      const fullPath = join(dir, entry);
      try {
        const st = statSync(fullPath);
        if (st.isDirectory()) {
          let nextPrefix = prefix;
          if (entry.startsWith("[") && entry.endsWith("]")) {
            nextPrefix = `${prefix}/:${entry.slice(1, -1)}`;
          } else if (entry.startsWith("(") && entry.endsWith(")")) {
            if (entry === "(auth)") nextPrefix = prefix;
            else if (entry === "(main)") scanPages(fullPath, prefix);
            continue;
          } else {
            nextPrefix = `${prefix}/${entry}`;
          }
          scanPages(fullPath, nextPrefix);
        } else if (entry === "page.tsx" || entry === "page.ts") {
          const page = prefix || "/";
          if (routeMap.has(page)) {
            issues.push({
              category: "routes",
              severity: "warning",
              message: `页面路由与 API 路由冲突: ${page}`,
              file: fullPath,
              autoFixable: false,
            });
          }
        }
      } catch {
        /* skip */
      }
    }
  }

  scanPages(config.paths.appDir);

  const passed = !issues.some((i) => i.severity === "error");
  return {
    category: "routes",
    name: "路由检测",
    passed,
    issues,
    duration: Date.now() - start,
  };
}
