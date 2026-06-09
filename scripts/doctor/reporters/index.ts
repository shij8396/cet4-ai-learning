import { writeFileSync } from "fs";

import { config } from "../utils/config";

import type { DoctorReport } from "../utils/types";

export function generateReport(report: DoctorReport): void {
  const lines: string[] = [];

  lines.push("# 🏥 Project Doctor — 诊断报告");
  lines.push("");
  lines.push(`> **生成时间**: ${report.timestamp}`);
  lines.push(`> **项目健康评分**: **${report.score}/100**`);
  lines.push("");
  lines.push("---");
  lines.push("");

  lines.push("## 📊 总览");
  lines.push("");
  lines.push(`| 指标 | 值 |`);
  lines.push(`|------|----|`);
  lines.push(`| 健康评分 | **${report.score}/100** |`);
  lines.push(`| 检查总数 | ${report.totalChecks} |`);
  lines.push(`| 通过 | ${report.passedChecks} |`);
  lines.push(`| 问题总数 | ${report.totalIssues} |`);
  lines.push(`| 错误 | ${report.errors} |`);
  lines.push(`| 警告 | ${report.warnings} |`);
  lines.push(`| 信息 | ${report.infos} |`);
  lines.push("");

  lines.push("---");
  lines.push("");

  const severityEmoji: Record<string, string> = { error: "🔴", warning: "🟡", info: "🔵" };

  for (const result of report.results) {
    const status = result.passed ? "✅" : "❌";
    lines.push(`## ${status} ${result.name} (${result.duration}ms)`);
    lines.push("");

    if (result.issues.length === 0) {
      lines.push("> 无问题发现");
      lines.push("");
      continue;
    }

    lines.push("| 严重度 | 问题 | 文件 | 修复建议 |");
    lines.push("|--------|------|------|----------|");
    for (const issue of result.issues) {
      const emoji = severityEmoji[issue.severity] || "⚪";
      const file = issue.file ? `\`${issue.file}${issue.line ? `:${issue.line}` : ""}\`` : "-";
      const fix = issue.fix || "-";
      lines.push(`| ${emoji} | ${issue.message} | ${file} | ${fix} |`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("*由 Project Doctor 自动生成 · npm run doctor*");

  const outputPath = config.paths.reportOutput;
  writeFileSync(outputPath, lines.join("\n"), "utf-8");
}
