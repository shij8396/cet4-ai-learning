import type { ReadingArticleType } from "@/types";

export interface DifficultyConfig {
  targetLevel: number;
  newWordRatio: number;
  maxSentenceLength: number;
  maxWordLength: number;
  maxArticleLength: number;
  allowComplexSentences: boolean;
}

const LEVEL_CONFIGS: Record<number, DifficultyConfig> = {
  1: {
    targetLevel: 1,
    newWordRatio: 0.05,
    maxSentenceLength: 10,
    maxWordLength: 6,
    maxArticleLength: 200,
    allowComplexSentences: false,
  },
  2: {
    targetLevel: 2,
    newWordRatio: 0.1,
    maxSentenceLength: 15,
    maxWordLength: 8,
    maxArticleLength: 250,
    allowComplexSentences: false,
  },
  3: {
    targetLevel: 3,
    newWordRatio: 0.15,
    maxSentenceLength: 20,
    maxWordLength: 10,
    maxArticleLength: 300,
    allowComplexSentences: true,
  },
  4: {
    targetLevel: 4,
    newWordRatio: 0.2,
    maxSentenceLength: 25,
    maxWordLength: 12,
    maxArticleLength: 350,
    allowComplexSentences: true,
  },
  5: {
    targetLevel: 5,
    newWordRatio: 0.25,
    maxSentenceLength: 30,
    maxWordLength: 14,
    maxArticleLength: 400,
    allowComplexSentences: true,
  },
};

export function getLevelConfig(level: number): DifficultyConfig {
  return LEVEL_CONFIGS[level] || LEVEL_CONFIGS[1];
}

export function calculateNewWordRatio(articleWords: string[], knownWords: Set<string>): number {
  if (articleWords.length === 0) return 0;
  const newWords = articleWords.filter((w) => !knownWords.has(w)).length;
  return newWords / articleWords.length;
}

export function isArticleSuitableForLevel(
  article: ReadingArticleType,
  level: number,
  knownWords: Set<string>,
): boolean {
  const config = getLevelConfig(level);
  const words = article.content.split(/\s+/);
  const newRatio = calculateNewWordRatio(words, knownWords);

  if (article.wordCount > config.maxArticleLength) return false;
  if (newRatio > config.newWordRatio * 1.5) return false;
  if (1 - article.vocabularyCoverage > 0.3) return false;

  return true;
}

export function calculateUserReadingLevel(
  completedArticles: number,
  averageScore: number,
  vocabularySize: number,
): number {
  const base = 1;

  if (vocabularySize < 200) return 1;
  if (vocabularySize < 500) return Math.min(2, base + Math.floor(completedArticles / 3));
  if (vocabularySize < 1000) return Math.min(3, base + Math.floor(completedArticles / 5) + 1);
  if (vocabularySize < 2000) return Math.min(4, base + Math.floor(completedArticles / 7) + 2);

  return Math.min(5, base + Math.floor(completedArticles / 10) + 3);
}

export function getNextLevelProgress(
  currentLevel: number,
  completedArticles: number,
): { progress: number; threshold: number } {
  const thresholds = [0, 3, 8, 15, 25];
  const threshold = thresholds[Math.min(currentLevel, thresholds.length - 1)] + 3;
  return {
    progress: Math.min(completedArticles, threshold),
    threshold,
  };
}
