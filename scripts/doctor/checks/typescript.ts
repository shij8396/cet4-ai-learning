import { execCommand } from "../utils/config";

import type { CheckResult, DoctorIssue } from "../utils/types";

export async function checkTypeScript(): Promise<CheckResult> {
  const start = Date.now();
  const issues: DoctorIssue[] = [];

  const { error } = execCommand("npx tsc --noEmit");

  if (error) {
    const errorLines = error.split("\n").filter((l) => l.includes("error TS"));

    for (const line of errorLines.slice(0, 15)) {
      const match = line.match(/^(.+?)\((\d+),\d+\):\s+(error\s+TS\d+):\s+(.+)$/);
      if (match) {
        const [, file, lineNum, code, message] = match;
        const filePath = file.replace(/^\.\//, "").replace(/\\/g, "/");
        issues.push({
          category: "typescript",
          severity: "error",
          message: `${code}: ${message}`,
          file: filePath.startsWith("src/") ? filePath : `src/${filePath}`,
          line: parseInt(lineNum),
          autoFixable: false,
        });
      }
    }

    if (issues.length === 0 && error.trim()) {
      issues.push({
        category: "typescript",
        severity: "error",
        message: `TypeScript 编译错误: ${error.substring(error.indexOf("error") !== -1 ? error.indexOf("error") : 0, 300)}`,
        autoFixable: false,
      });
    }
  }

  const passed = issues.length === 0;
  return {
    category: "typescript",
    name: "TypeScript 检测",
    passed,
    issues,
    duration: Date.now() - start,
  };
}

export async function checkESLint(fix: boolean): Promise<CheckResult> {
  const start = Date.now();
  const issues: DoctorIssue[] = [];

  const cmd = fix ? "npx eslint . --fix" : "npx eslint .";
  const { output, error } = execCommand(cmd);

  const combined = output + error;
  const lines = combined.split("\n");

  let warningCount = 0;
  let errorCount = 0;
  for (const line of lines) {
    if (line.includes("warning") && /\d+:\d+/.test(line)) {
      warningCount++;
      const match = line.match(/^(.+?)\s+(\d+:\d+)\s+(warning|error)\s+(.+)$/i);
      if (match && warningCount <= 10) {
        issues.push({
          category: "eslint",
          severity: "warning",
          message: match[4],
          file: match[1],
          line: parseInt(match[2].split(":")[0]),
          autoFixable: match[4].includes("prettier") || match[4].includes("format"),
        });
      }
    }
  }

  const summaryLine = lines.find((l) => /\d+ problems/.test(l));
  if (summaryLine) {
    const errMatch = summaryLine.match(/(\d+) errors?/);
    const warnMatch = summaryLine.match(/(\d+) warnings?/);
    if (errMatch) errorCount = parseInt(errMatch[1]);
    if (warnMatch) warningCount = parseInt(warnMatch[1]);
  }

  if (errorCount > 0) {
    issues.push({
      category: "eslint",
      severity: "error",
      message: `${errorCount} 个 ESLint 错误${fix ? "（已尝试自动修复）" : ""}`,
      fix: "运行: npm run lint:fix 进行自动修复",
      autoFixable: true,
    });
  }

  if (warningCount > 0 && errorCount === 0) {
    issues.push({
      category: "eslint",
      severity: "warning",
      message: `${warningCount} 个 ESLint 警告`,
      autoFixable: true,
    });
  }

  const passed = errorCount === 0;
  return {
    category: "eslint",
    name: "ESLint 检测",
    passed,
    issues,
    duration: Date.now() - start,
  };
}
