import { normalize } from "./lemma-normalizer";
import { checkLevel, initializeLevelChecker, resetLevelChecker } from "./level-checker";
import { spellCheck, initializeSpellChecker, resetSpellChecker } from "./spell-checker";
import { tokenize, getUniqueTokens } from "./tokenizer";
import {
  checkVocabulary,
  initializeVocabularyChecker,
  resetVocabularyChecker,
} from "./vocabulary-checker";

import type {
  ContentValidationResult,
  SpellSuggestion,
  WordEntry,
  WritingValidationResult,
} from "./types";

let isInitialized = false;

export function initializeValidator(words: string[], wordMeta?: WordEntry[]): void {
  const normalizedWords = words.map((w) => w.toLowerCase().trim());
  initializeSpellChecker(normalizedWords);
  initializeVocabularyChecker(normalizedWords);

  if (wordMeta && wordMeta.length > 0) {
    initializeLevelChecker(wordMeta);
  }

  isInitialized = true;
}

export function isValidatorReady(): boolean {
  return isInitialized;
}

export function validateContent(
  text: string,
  options?: {
    allowedLevels?: string[];
    userMasteredWords?: Set<string>;
    checkLemmas?: boolean;
  },
): ContentValidationResult {
  const tokens = tokenize(text);
  const uniqueTokens = getUniqueTokens(tokens);

  const suggestions: SpellSuggestion[] = [];
  const spellingErrorSet = new Set<string>();

  for (const token of uniqueTokens) {
    const result = spellCheck(token);
    if (!result.isCorrect) {
      spellingErrorSet.add(token);
      if (result.corrections.length > 0) {
        suggestions.push({
          word: token,
          suggestions: result.corrections,
        });
      }
    }
  }

  const vocabResult = checkVocabulary(uniqueTokens);

  const invalidWords = vocabResult.invalidWords;

  const outOfLevelWords = options?.allowedLevels
    ? uniqueTokens.filter((w) => {
        const levelResult = checkLevel(w, options.userMasteredWords);
        return levelResult.isOutOfLevel || !options.allowedLevels!.includes(levelResult.level);
      })
    : [];

  let validCount = vocabResult.validWords.length;

  if (options?.checkLemmas) {
    const lemmaValid = new Set<string>();
    for (const token of uniqueTokens) {
      const lemma = normalize(token);
      const result = spellCheck(lemma);
      if (result.isCorrect) {
        lemmaValid.add(token);
      }
    }
    validCount = Math.max(validCount, lemmaValid.size);
  }

  const coverageRate = uniqueTokens.length > 0 ? validCount / uniqueTokens.length : 1;

  return {
    valid: spellingErrorSet.size === 0 && invalidWords.length === 0,
    totalWords: tokens.length,
    uniqueWords: uniqueTokens.length,
    validWordCount: validCount,
    invalidWords,
    outOfLevelWords,
    spellingErrors: [...spellingErrorSet],
    suggestions,
    coverageRate,
    difficultyScore: calculateSimpleDifficulty(tokens, uniqueTokens, coverageRate),
    tokens,
  };
}

function calculateSimpleDifficulty(
  tokens: string[],
  uniqueTokens: string[],
  coverageRate: number,
): number {
  const avgWordLength = tokens.reduce((sum, t) => sum + t.length, 0) / Math.max(tokens.length, 1);
  const vocabComplexity = (1 - coverageRate) * 100;
  const lengthComplexity = Math.min(avgWordLength / 10, 1) * 50;

  return Math.round(Math.min(vocabComplexity + lengthComplexity, 100));
}

export function validateWriting(
  text: string,
  options?: {
    maxRepeatedWords?: number;
    allowedLevels?: string[];
  },
): WritingValidationResult {
  const tokens = tokenize(text);
  const uniqueTokens = getUniqueTokens(tokens);

  const spellingErrors: SpellSuggestion[] = [];
  for (const token of uniqueTokens) {
    const result = spellCheck(token);
    if (!result.isCorrect && result.corrections.length > 0) {
      spellingErrors.push({
        word: token,
        suggestions: result.corrections,
      });
    }
  }

  const vocabResult = checkVocabulary(uniqueTokens);
  const outOfLevelWords = options?.allowedLevels
    ? uniqueTokens.filter((w) => {
        const level = checkLevel(w);
        return level.isOutOfLevel || !options.allowedLevels!.includes(level.level);
      })
    : [];

  const maxRepeated = options?.maxRepeatedWords ?? 5;
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  const repeatedWords = [...freq.entries()]
    .filter(([, count]) => count >= maxRepeated)
    .map(([word, count]) => ({ word, count }));

  const suggestions: string[] = [];
  if (vocabResult.coverageRate < 0.7) {
    suggestions.push("词汇覆盖率较低，建议使用更多CET4词汇");
  }
  if (spellingErrors.length > 0) {
    suggestions.push(`发现 ${spellingErrors.length} 个拼写错误，请检查`);
  }
  if (outOfLevelWords.length > 0) {
    suggestions.push(`发现 ${outOfLevelWords.length} 个超纲词汇`);
  }
  if (repeatedWords.length > 0) {
    suggestions.push("部分单词使用过于频繁，建议使用同义词替换");
  }

  return {
    valid: spellingErrors.length === 0 && vocabResult.coverageRate >= 0.7,
    totalWords: tokens.length,
    spellingErrors,
    outOfLevelWords,
    repeatedWords,
    coverageRate: vocabResult.coverageRate,
    suggestions,
  };
}

export function validateWord(word: string): {
  isValid: boolean;
  word: string;
  isInCET4: boolean;
  spellingCorrect: boolean;
  suggestions: string[];
  lemma: string;
} {
  const spellResult = spellCheck(word);
  const norm = normalize(word);
  const spellNorm = spellCheck(norm);

  return {
    isValid: spellResult.isCorrect || spellNorm.isCorrect,
    word: word.toLowerCase().trim(),
    isInCET4: spellResult.isCorrect,
    spellingCorrect: spellResult.isCorrect,
    suggestions: spellResult.corrections,
    lemma: norm,
  };
}

export function batchValidate(words: string[]): ReturnType<typeof validateWord>[] {
  return words.map((w) => validateWord(w));
}

export function resetValidator(): void {
  resetSpellChecker();
  resetVocabularyChecker();
  resetLevelChecker();
  isInitialized = false;
}
