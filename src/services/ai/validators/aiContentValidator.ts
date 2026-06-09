import { batchCheckLevel } from "@/lib/vocabulary-validator/level-checker";
import { batchSpellCheck } from "@/lib/vocabulary-validator/spell-checker";
import { tokenize } from "@/lib/vocabulary-validator/tokenizer";
import { loadWordCache, getCacheStatus } from "@/lib/vocabulary-validator/vocabulary-cache";
import { batchIsInCET4 } from "@/lib/vocabulary-validator/vocabulary-checker";

import type { ValidationReport } from "../types";

export async function validateAIContent(
  text: string,
  options?: {
    allowedLevels?: string[];
    maxOutOfLevelRatio?: number;
    maxSpellingErrorRatio?: number;
    maxRetries?: number;
    regenerateFn?: () => Promise<string>;
  },
): Promise<ValidationReport> {
  const {
    maxOutOfLevelRatio = 0.05,
    maxSpellingErrorRatio = 0.0,
    maxRetries = 3,
    regenerateFn,
  } = options || {};

  let currentText = text;
  let retryCount = 0;

  const cacheStatus = getCacheStatus();
  if (!cacheStatus.isLoaded) {
    await loadWordCache();
  }

  while (retryCount <= maxRetries) {
    const tokens = tokenize(currentText);
    const uniqueTokens = [...new Set(tokens)];

    const spellResults = batchSpellCheck(uniqueTokens);
    const spellingErrors = spellResults.filter((r) => !r.isCorrect).map((r) => r.word);

    const levelResults = batchCheckLevel(uniqueTokens);
    const outOfLevelWords = levelResults.filter((r) => r.isOutOfLevel).map((r) => r.word);

    const cet4Results = batchIsInCET4(uniqueTokens);
    const cet4Count = [...cet4Results.values()].filter(Boolean).length;
    const coverage = uniqueTokens.length > 0 ? cet4Count / uniqueTokens.length : 0;

    const spellingRatio = tokens.length > 0 ? spellingErrors.length / tokens.length : 0;
    const outOfLevelRatio = tokens.length > 0 ? outOfLevelWords.length / tokens.length : 0;

    const suggestions: string[] = [];

    if (spellingErrors.length > 0) {
      suggestions.push(
        `发现 ${spellingErrors.length} 个拼写错误: ${spellingErrors.slice(0, 5).join(", ")}`,
      );
    }
    if (outOfLevelWords.length > 0) {
      suggestions.push(
        `发现 ${outOfLevelWords.length} 个超纲词: ${outOfLevelWords.slice(0, 5).join(", ")}`,
      );
    }
    if (coverage < 0.8) {
      suggestions.push(`CET4词汇覆盖率偏低: ${(coverage * 100).toFixed(0)}%`);
    }

    const passed =
      spellingRatio <= maxSpellingErrorRatio &&
      outOfLevelRatio <= maxOutOfLevelRatio &&
      coverage >= 0.7;

    if (passed) {
      return {
        passed: true,
        totalWords: tokens.length,
        spellingErrors,
        outOfLevelWords,
        coverage,
        suggestions,
        retryCount,
      };
    }

    if (retryCount < maxRetries && regenerateFn) {
      currentText = await regenerateFn();
      retryCount++;
      continue;
    }

    return {
      passed: false,
      totalWords: tokens.length,
      spellingErrors,
      outOfLevelWords,
      coverage,
      suggestions,
      retryCount,
    };
  }

  const tokens = tokenize(currentText);
  return {
    passed: false,
    totalWords: tokens.length,
    spellingErrors: [],
    outOfLevelWords: [],
    coverage: 0,
    suggestions: ["达到最大重试次数，内容未能通过审核"],
    retryCount,
  };
}

function _buildRegenerationHint(
  spellingErrors: string[],
  outOfLevelWords: string[],
  coverage: number,
): string {
  const hints: string[] = [];

  if (spellingErrors.length > 0) {
    hints.push(`请修正以下拼写错误: ${spellingErrors.slice(0, 5).join(", ")}`);
  }
  if (outOfLevelWords.length > 0) {
    hints.push(`以下词汇超出CET4范围，请替换: ${outOfLevelWords.slice(0, 5).join(", ")}`);
  }
  if (coverage < 0.7) {
    hints.push("请使用更多CET4词汇，提高覆盖率");
  }

  return hints.join("; ");
}

export async function quickValidate(text: string): Promise<{
  passed: boolean;
  spellingErrors: string[];
  outOfLevelWords: string[];
  coverage: number;
}> {
  const tokens = tokenize(text);
  const uniqueTokens = [...new Set(tokens)];

  const spellResults = batchSpellCheck(uniqueTokens);
  const spellingErrors = spellResults.filter((r) => !r.isCorrect).map((r) => r.word);

  const levelResults = batchCheckLevel(uniqueTokens);
  const outOfLevelWords = levelResults.filter((r) => r.isOutOfLevel).map((r) => r.word);

  const cet4Results = batchIsInCET4(uniqueTokens);
  const cet4Count = [...cet4Results.values()].filter(Boolean).length;
  const coverage = uniqueTokens.length > 0 ? cet4Count / uniqueTokens.length : 0;

  return {
    passed: spellingErrors.length === 0 && outOfLevelWords.length === 0,
    spellingErrors,
    outOfLevelWords,
    coverage,
  };
}

export function extractJSON(text: string): unknown {
  const cleaned = text.trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // proceed to next approach
    }
  }

  const lines = cleaned.split("\n");
  let jsonStart = -1;
  let jsonEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    if (jsonStart === -1 && (lines[i].trim() === "```json" || lines[i].trim() === "```")) {
      jsonStart = i + 1;
    } else if (jsonStart !== -1 && lines[i].trim() === "```") {
      jsonEnd = i;
      break;
    }
  }

  if (jsonStart !== -1 && jsonEnd !== -1) {
    try {
      return JSON.parse(lines.slice(jsonStart, jsonEnd).join("\n"));
    } catch {
      // fail
    }
  }

  throw new Error("无法从AI响应中提取JSON");
}
