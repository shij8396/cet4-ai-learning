import { existsSync, readFileSync } from "fs";

import { config, execCommand } from "../utils/config";

import type { CheckResult, DoctorIssue } from "../utils/types";

export async function checkPrisma(deep: boolean): Promise<CheckResult> {
  const start = Date.now();
  const issues: DoctorIssue[] = [];

  if (!existsSync(config.paths.schemaPrisma)) {
    issues.push({
      category: "prisma",
      severity: "error",
      message: "prisma/schema.prisma 不存在",
      autoFixable: false,
    });
    return {
      category: "prisma",
      name: "Prisma 检测",
      passed: false,
      issues,
      duration: Date.now() - start,
    };
  }

  const schema = readFileSync(config.paths.schemaPrisma, "utf-8");

  if (!schema.includes('provider = "postgresql"') && !schema.includes('provider = "sqlite"')) {
    issues.push({
      category: "prisma",
      severity: "error",
      message: "数据源未配置为 postgresql 或 sqlite",
      file: config.paths.schemaPrisma,
      autoFixable: false,
    });
  }

  if (!schema.includes("model User")) {
    issues.push({
      category: "prisma",
      severity: "warning",
      message: "未定义 User 模型",
      file: config.paths.schemaPrisma,
      autoFixable: false,
    });
  }

  if (!existsSync(config.paths.generatedPrisma)) {
    issues.push({
      category: "prisma",
      severity: "error",
      message: "Prisma Client 未生成",
      fix: "运行: npx prisma generate",
      autoFixable: true,
    });
  }

  if (deep) {
    const { error: genError } = execCommand("npx prisma generate");
    if (genError && !genError.includes("Generated")) {
      issues.push({
        category: "prisma",
        severity: "error",
        message: "prisma generate 失败",
        file: config.paths.schemaPrisma,
        fix: genError.substring(0, 200),
        autoFixable: false,
      });
    }

    const { error: dbError } = execCommand("npx prisma db push --accept-data-loss");
    if (dbError && dbError.length > 0) {
      issues.push({
        category: "prisma",
        severity: "error",
        message: "数据库连接失败",
        fix: "检查 DATABASE_URL 和数据库服务是否运行",
        autoFixable: false,
      });
    }
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  return {
    category: "prisma",
    name: "Prisma 检测",
    passed: !hasErrors,
    issues,
    duration: Date.now() - start,
  };
}
