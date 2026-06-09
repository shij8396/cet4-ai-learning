import type { ContentValidationResult } from "@/lib/vocabulary-validator/types";

export interface ArticleValidationReport {
  articleId: string;
  passed: boolean;
  totalWords: number;
  cet4WordCount: number;
  coverageRate: number;
  unknownWords: string[];
  outOfLevelWords: string[];
  spellingErrors: string[];
  readabilityScore: number;
  level: string;
  issues: string[];
}

export function generateValidationReport(
  articleId: string,
  validationResult: ContentValidationResult,
): ArticleValidationReport {
  return {
    articleId,
    passed: validationResult.valid,
    totalWords: validationResult.totalWords,
    cet4WordCount: validationResult.validWordCount,
    coverageRate: validationResult.coverageRate,
    unknownWords: validationResult.invalidWords,
    outOfLevelWords: validationResult.outOfLevelWords,
    spellingErrors: validationResult.spellingErrors,
    readabilityScore: validationResult.difficultyScore,
    level: getReadabilityLabel(validationResult.difficultyScore),
    issues: generateIssues(validationResult),
  };
}

function getReadabilityLabel(score: number): string {
  if (score < 25) return "easy";
  if (score < 50) return "medium";
  if (score < 75) return "hard";
  return "very_hard";
}

function generateIssues(validation: ContentValidationResult): string[] {
  const issues: string[] = [];

  if (validation.spellingErrors.length > 0) {
    issues.push(
      `发现 ${validation.spellingErrors.length} 个拼写错误: ${validation.spellingErrors.slice(0, 5).join(", ")}`,
    );
  }

  if (validation.invalidWords.length > 0) {
    issues.push(
      `发现 ${validation.invalidWords.length} 个超纲词汇: ${validation.invalidWords.slice(0, 5).join(", ")}`,
    );
  }

  if (validation.coverageRate < 0.7) {
    issues.push(`词汇覆盖率仅 ${Math.round(validation.coverageRate * 100)}%，低于 70% 标准`);
  }

  if (validation.coverageRate < 0.5) {
    issues.push("词汇覆盖率严重不足，文章可能不适合当前等级");
  }

  return issues;
}

export function isArticleAppropriate(
  report: ArticleValidationReport,
  minCoverage: number = 0.8,
): boolean {
  return report.passed && report.coverageRate >= minCoverage;
}
