import { existsSync, readdirSync } from "fs";

import { config, execCommand } from "../utils/config";

import type { CheckResult, DoctorIssue } from "../utils/types";

export async function checkVocabularyValidator(): Promise<CheckResult> {
  const start = Date.now();
  const issues: DoctorIssue[] = [];

  const validatorDir = config.paths.vocabValidator;
  if (!existsSync(validatorDir)) {
    issues.push({
      category: "vocab",
      severity: "error",
      message: "Vocabulary Validator 目录不存在",
      file: validatorDir,
      fix: "创建 src/lib/vocabulary-validator/ 目录",
      autoFixable: false,
    });
    return {
      category: "vocab",
      name: "词汇验证器检测",
      passed: false,
      issues,
      duration: Date.now() - start,
    };
  }

  const expectedFiles = [
    "validator.ts",
    "spell-checker.ts",
    "lemma-normalizer.ts",
    "level-checker.ts",
    "tokenizer.ts",
    "readability-analyzer.ts",
    "vocabulary-cache.ts",
  ];

  const existing = readdirSync(validatorDir);
  for (const file of expectedFiles) {
    if (!existing.some((e) => e.includes(file.replace(".ts", "")))) {
      issues.push({
        category: "vocab",
        severity: "warning",
        message: `缺失模块: ${file}`,
        file: `${validatorDir}/${file}`,
        fix: `创建 ${file} 模块`,
        autoFixable: false,
      });
    }
  }

  const testDir = `${validatorDir}/__tests__`;
  if (!existsSync(testDir)) {
    issues.push({
      category: "vocab",
      severity: "warning",
      message: "Vocabulary Validator 缺少单元测试",
      fix: "创建 __tests__/ 目录并添加测试",
      autoFixable: false,
    });
  } else {
    const { output, error } = execCommand("npx vitest run --reporter=verbose 2>&1");
    const combined = output + error;
    if (combined.includes("FAIL") || combined.includes("failed")) {
      issues.push({
        category: "vocab",
        severity: "warning",
        message: "Vocabulary Validator 测试未全部通过",
        fix: "运行: npm test 查看具体失败原因",
        autoFixable: false,
      });
    }
  }

  const passed = !issues.some((i) => i.severity === "error");
  return {
    category: "vocab",
    name: "词汇验证器检测",
    passed,
    issues,
    duration: Date.now() - start,
  };
}
