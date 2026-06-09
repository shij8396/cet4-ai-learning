import { tokenize } from "./tokenizer";
import { getCoverageRate } from "./vocabulary-checker";

import type { ReadabilityMetrics } from "./types";

function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  const sentences = normalized.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0);

  if (sentences.length === 0) return [normalized];

  return sentences;
}

function countSyllables(word: string): number {
  const lower = word.toLowerCase();
  if (lower.length <= 3) return 1;

  const vowelGroups = lower.match(/[aeiouy]+/g);
  const count = vowelGroups ? vowelGroups.length : 1;

  if (lower.endsWith("e") && !lower.endsWith("le") && vowelGroups && vowelGroups.length > 1) {
    return count - 1;
  }

  return Math.max(1, count);
}

function countComplexSentences(sentences: string[]): number {
  const complexMarkers = [
    /\bwhich\b/i,
    /\bwho\b/i,
    /\bwhom\b/i,
    /\bwhose\b/i,
    /\bthat\b/i,
    /\bbecause\b/i,
    /\balthough\b/i,
    /\bthough\b/i,
    /\bwhile\b/i,
    /\bwhereas\b/i,
    /\bhowever\b/i,
    /\btherefore\b/i,
    /\bmoreover\b/i,
    /\bwhen\b/i,
    /\bwhere\b/i,
    /\bif\b/i,
    /\bunless\b/i,
    /\buntil\b/i,
    /\bsince\b/i,
    /\bafter\b/i,
    /\bbefore\b/i,
  ];

  return sentences.filter((s) => complexMarkers.some((pattern) => pattern.test(s))).length;
}

export function analyzeReadability(text: string): ReadabilityMetrics {
  const sentences = splitSentences(text);
  const tokens = tokenize(text);

  const sentenceCount = sentences.length;
  const wordCount = tokens.length;
  const charCount = tokens.reduce((sum, t) => sum + t.length, 0);

  const avgWordLength = wordCount > 0 ? charCount / wordCount : 0;
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  const totalSyllables = tokens.reduce((sum, t) => sum + countSyllables(t), 0);

  const fleschScore =
    206.835 -
    1.015 * (wordCount / Math.max(sentenceCount, 1)) -
    84.6 * (totalSyllables / Math.max(wordCount, 1));

  const complexCount = countComplexSentences(sentences);
  const complexSentenceRatio = sentenceCount > 0 ? complexCount / sentenceCount : 0;

  const unfamiliarWordRatio = 1 - getCoverageRate(tokens);

  const difficultyScore = Math.min(
    100,
    Math.max(
      0,
      Math.round((100 - fleschScore) * 0.4 + complexSentenceRatio * 30 + unfamiliarWordRatio * 30),
    ),
  );

  let level: ReadabilityMetrics["level"];
  if (difficultyScore < 25) level = "easy";
  else if (difficultyScore < 50) level = "medium";
  else if (difficultyScore < 75) level = "hard";
  else level = "very_hard";

  return {
    sentenceCount,
    wordCount,
    charCount,
    avgWordLength: Math.round(avgWordLength * 100) / 100,
    avgSentenceLength: Math.round(avgSentenceLength * 100) / 100,
    complexSentenceRatio: Math.round(complexSentenceRatio * 100) / 100,
    unfamiliarWordRatio: Math.round(unfamiliarWordRatio * 100) / 100,
    difficultyScore,
    level,
  };
}

export function getDifficultyLevel(score: number): ReadabilityMetrics["level"] {
  if (score < 25) return "easy";
  if (score < 50) return "medium";
  if (score < 75) return "hard";
  return "very_hard";
}

export function isAppropriateForLevel(
  text: string,
  targetLevel: ReadabilityMetrics["level"],
): boolean {
  const metrics = analyzeReadability(text);
  return metrics.level === targetLevel;
}

const LEVEL_DESCRIPTIONS: Record<ReadabilityMetrics["level"], string> = {
  easy: "适合初学者，词汇简单，句子短",
  medium: "适合中级学习者，包含一些复杂句和生词",
  hard: "适合高级学习者，句子复杂，生词较多",
  very_hard: "难度很高，建议简化后再给学习者阅读",
};

export function getLevelDescription(level: ReadabilityMetrics["level"]): string {
  return LEVEL_DESCRIPTIONS[level];
}
