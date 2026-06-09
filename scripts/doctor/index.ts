import { createInterface } from "readline";

import chalk from "chalk";

import { checkAISystem } from "./checks/ai";
import { checkAppRouter } from "./checks/app-router";
import { checkDependencies } from "./checks/dependencies";
import { checkEnv } from "./checks/env";
import { checkNextAuth } from "./checks/nextauth";
import { checkPerformance } from "./checks/performance";
import { checkPrisma } from "./checks/prisma";
import { checkPWA } from "./checks/pwa";
import { checkRoutes } from "./checks/routes";
import { checkTypeScript, checkESLint } from "./checks/typescript";
import { checkVocabularyValidator } from "./checks/vocab";
import { tryAutoFix } from "./fixes/auto-fix";
import { generateReport } from "./reporters/index";
import { log, symbols } from "./utils/logger";

import type { CheckResult, CliOptions, DoctorIssue, DoctorReport } from "./utils/types";

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  return {
    deep: args.includes("--deep"),
    fix: args.includes("--fix"),
    silent: args.includes("--silent"),
  };
}

async function askYesNo(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(chalk.cyan(`\n  ? ${question} (y/n): `), (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes");
    });
  });
}

function calculateScore(results: CheckResult[]): number {
  if (results.length === 0) return 100;

  const weights: Record<string, number> = {
    env: 15,
    nextauth: 15,
    prisma: 15,
    typescript: 12,
    "app-router": 10,
    eslint: 8,
    routes: 6,
    pwa: 5,
    vocab: 5,
    ai: 5,
    performance: 2,
    dependencies: 2,
  };

  let earned = 0;
  let totalWeight = 0;

  for (const result of results) {
    const weight = weights[result.category] || 5;
    totalWeight += weight;

    const errors = result.issues.filter((i) => i.severity === "error").length;
    const warnings = result.issues.filter((i) => i.severity === "warning").length;
    const infos = result.issues.filter((i) => i.severity === "info").length;

    let categoryScore = weight;
    categoryScore -= errors * (weight * 0.3);
    categoryScore -= warnings * (weight * 0.1);
    categoryScore -= infos * (weight * 0.02);
    categoryScore = Math.max(0, categoryScore);

    earned += categoryScore;
  }

  return Math.round((earned / totalWeight) * 100);
}

function displayResult(result: CheckResult): void {
  const statusIcon = result.passed ? symbols.pass : symbols.fail;
  const statusColor = result.passed ? chalk.green : chalk.red;
  const statusText = result.passed ? "PASS" : "FAIL";

  console.log(
    `  ${statusIcon} ${chalk.bold(result.name)} ${chalk.gray(`(${result.duration}ms)`)} ${statusColor(statusText)}`,
  );

  if (result.issues.length === 0) return;

  for (const issue of result.issues) {
    const icon =
      issue.severity === "error"
        ? symbols.fail
        : issue.severity === "warning"
          ? symbols.warn
          : symbols.info;

    const messageColor =
      issue.severity === "error"
        ? chalk.red
        : issue.severity === "warning"
          ? chalk.yellow
          : chalk.gray;

    let location = "";
    if (issue.file) {
      location = `  ${chalk.dim(issue.file)}`;
      if (issue.line) location += chalk.dim(`:${issue.line}`);
    }

    console.log(`     ${icon} ${messageColor(issue.message)}${location}`);

    if (issue.fix) {
      console.log(`       ${symbols.arrow} ${chalk.gray("修复建议:")} ${chalk.white(issue.fix)}`);
    }
  }
}

function collectFixableIssues(results: CheckResult[]): DoctorIssue[] {
  return results.flatMap((r) => r.issues).filter((i) => i.autoFixable);
}

async function runAutoFixes(issues: DoctorIssue[], autoApprove: boolean): Promise<number> {
  let fixedCount = 0;

  for (const issue of issues) {
    if (!autoApprove) {
      const shouldFix = await askYesNo(`是否自动修复: "${issue.message}"？`);
      if (!shouldFix) continue;
    }

    const fixed = tryAutoFix(issue);
    if (fixed) {
      fixedCount++;
      console.log(`  ${symbols.pass} ${chalk.green(`已修复: ${issue.message}`)}`);
    }
  }

  return fixedCount;
}

function buildReport(results: CheckResult[]): DoctorReport {
  const allIssues = results.flatMap((r) => r.issues);
  const passed = results.filter((r) => r.passed).length;

  return {
    timestamp: new Date().toISOString(),
    totalChecks: results.length,
    passedChecks: passed,
    totalIssues: allIssues.length,
    errors: allIssues.filter((i) => i.severity === "error").length,
    warnings: allIssues.filter((i) => i.severity === "warning").length,
    infos: allIssues.filter((i) => i.severity === "info").length,
    score: calculateScore(results),
    results,
  };
}

async function main(): Promise<void> {
  const options = parseArgs();
  const results: CheckResult[] = [];

  console.log("");
  console.log(chalk.bold.blue("  ╔══════════════════════════════════════════════════╗"));
  console.log(
    chalk.bold.blue("  ║") +
      chalk.bold.white("        🏥 Project Doctor — 项目自动诊断系统       ") +
      chalk.bold.blue("║"),
  );
  console.log(chalk.bold.blue("  ╚══════════════════════════════════════════════════╝"));
  console.log("");

  if (options.deep) {
    console.log(`  ${chalk.yellow("⚡")} ${chalk.bold.yellow("深度模式已启用")}`);
  }
  if (options.fix) {
    console.log(`  ${chalk.green("🔧")} ${chalk.bold.green("一键修复模式已启用")}`);
  }
  console.log("");

  log.header("基础环境检测");

  const envResult = await checkEnv();
  results.push(envResult);
  displayResult(envResult);

  log.header("NextAuth 认证检测");
  const nextauthResult = await checkNextAuth();
  results.push(nextauthResult);
  displayResult(nextauthResult);

  log.header("Prisma 数据库检测");
  const prismaResult = await checkPrisma(options.deep);
  results.push(prismaResult);
  displayResult(prismaResult);

  log.header("App Router 结构检测");
  const appRouterResult = await checkAppRouter();
  results.push(appRouterResult);
  displayResult(appRouterResult);

  log.header("TypeScript 编译检测");
  const tsResult = await checkTypeScript();
  results.push(tsResult);
  displayResult(tsResult);

  log.header("ESLint 代码规范检测");
  const eslintResult = await checkESLint(options.fix);
  results.push(eslintResult);
  displayResult(eslintResult);

  log.header("PWA 配置检测");
  const pwaResult = await checkPWA();
  results.push(pwaResult);
  displayResult(pwaResult);

  log.header("路由系统检测");
  const routesResult = await checkRoutes();
  results.push(routesResult);
  displayResult(routesResult);

  log.header("词汇验证器检测");
  const vocabResult = await checkVocabularyValidator();
  results.push(vocabResult);
  displayResult(vocabResult);

  log.header("AI 系统检测");
  const aiResult = await checkAISystem();
  results.push(aiResult);
  displayResult(aiResult);

  if (options.deep) {
    log.header("性能分析");
    const perfResult = await checkPerformance();
    results.push(perfResult);
    displayResult(perfResult);

    log.header("依赖分析");
    const depsResult = await checkDependencies();
    results.push(depsResult);
    displayResult(depsResult);
  }

  const report = buildReport(results);

  console.log("");
  log.divider();
  log.score(report.score);
  log.summary(report.passedChecks, report.totalChecks);
  console.log(
    `  ${chalk.red("✗")} ${report.errors} 错误  ${chalk.yellow("⚠")} ${report.warnings} 警告  ${chalk.blue("ℹ")} ${report.infos} 信息`,
  );

  const fixableIssues = collectFixableIssues(results);
  if (fixableIssues.length > 0) {
    if (options.fix) {
      console.log(`\n  ${chalk.green("🔧")} ${chalk.bold("自动修复中...")}`);
      const fixedCount = await runAutoFixes(fixableIssues, true);
      console.log(
        `  ${symbols.pass} ${chalk.green(`已自动修复 ${fixedCount}/${fixableIssues.length} 个问题`)}`,
      );
    } else {
      console.log(
        `\n  ${chalk.yellow("💡")} ${chalk.gray(`发现 ${fixableIssues.length} 个可自动修复的问题，运行 `)}${chalk.white("npm run doctor -- --fix")}${chalk.gray(" 一键修复")}`,
      );
    }
  }

  generateReport(report);
  console.log(
    `\n  ${symbols.pass} ${chalk.green("诊断报告已生成: ")}${chalk.underline("doctor-report.md")}`,
  );

  console.log("");

  if (report.errors > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(chalk.red("\n  ✗ Project Doctor 运行失败:"));
  console.error(chalk.red(`    ${err instanceof Error ? err.message : String(err)}`));
  process.exit(2);
});
