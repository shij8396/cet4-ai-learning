import { existsSync } from "fs";

import { config, execCommand } from "../utils/config";

import type { CheckResult, DoctorIssue } from "../utils/types";

export async function checkDependencies(): Promise<CheckResult> {
  const start = Date.now();
  const issues: DoctorIssue[] = [];

  const pkg = config.packageJson;
  const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

  const duplicateDeps: string[] = [];
  const depNames = new Set<string>();

  if (pkg.dependencies) {
    for (const name of Object.keys(pkg.dependencies)) {
      if (pkg.devDependencies && name in pkg.devDependencies) {
        duplicateDeps.push(name);
      }
      depNames.add(name);
    }
  }

  for (const dep of duplicateDeps) {
    issues.push({
      category: "dependencies",
      severity: "warning",
      message: `重复依赖（同时存在于 dependencies 和 devDependencies）: ${dep}`,
      fix: `将 ${dep} 移到 dependencies 或 devDependencies 中`,
      autoFixable: false,
    });
  }

  const { output: outdatedOutput } = execCommand("npm outdated --json 2>&1", config.projectRoot);

  if (outdatedOutput.trim() && outdatedOutput.includes("{")) {
    try {
      const outdated = JSON.parse(
        outdatedOutput
          .trim()
          .replace(/^[^{]*/, "")
          .replace(/[^}]*$/, ""),
      );
      const entries = Object.entries(outdated) as [
        string,
        { current: string; wanted: string; latest: string },
      ][];
      for (const [name, info] of entries.slice(0, 10)) {
        issues.push({
          category: "dependencies",
          severity: "info",
          message: `${name}: ${info.current} → ${info.latest}`,
          fix: `运行: npm install ${name}@${info.latest}`,
          autoFixable: false,
        });
      }
    } catch {
      /* not JSON */
    }
  }

  const lockfilePath = `${config.projectRoot}/package-lock.json`;
  const yarnLockPath = `${config.projectRoot}/yarn.lock`;
  const pnpmLockPath = `${config.projectRoot}/pnpm-lock.yaml`;
  const hasLockFile =
    existsSync(lockfilePath) || existsSync(yarnLockPath) || existsSync(pnpmLockPath);
  if (!hasLockFile) {
    issues.push({
      category: "dependencies",
      severity: "error",
      message: "未找到 lockfile (package-lock.json / yarn.lock / pnpm-lock.yaml)",
      fix: "运行: npm install 或相应包管理器的安装命令",
      autoFixable: false,
    });
  }

  const depCount = Object.keys(allDeps).length;
  if (depCount > 50) {
    issues.push({
      category: "dependencies",
      severity: "info",
      message: `依赖数量较多: ${depCount} 个`,
      fix: "检查是否有未使用的依赖可以移除",
      autoFixable: false,
    });
  }

  for (const [name, version] of Object.entries(pkg.dependencies || {})) {
    if (typeof version === "string" && version.startsWith("file:")) {
      issues.push({
        category: "dependencies",
        severity: "warning",
        message: `${name} 使用本地路径依赖: ${version}`,
        fix: "发布到 npm registry 或使用 workspace 管理",
        autoFixable: false,
      });
    }
    if (
      typeof version === "string" &&
      (version.includes("git+") || version.includes("github.com"))
    ) {
      issues.push({
        category: "dependencies",
        severity: "warning",
        message: `${name} 使用 Git 依赖: ${version}`,
        fix: "改用 npm registry 版本或锁定 commit hash",
        autoFixable: false,
      });
    }
  }

  const passed = !issues.some((i) => i.severity === "error");
  return {
    category: "dependencies",
    name: "依赖分析",
    passed,
    issues,
    duration: Date.now() - start,
  };
}
