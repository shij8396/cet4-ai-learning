import type { ValidationResult, ContentValidationReport, SpellCheckResult } from "@/types";

const CET4_WORD_SET = new Set<string>();

let isInitialized = false;

export async function initializeWordSet(words?: string[]): Promise<void> {
  if (isInitialized) return;

  if (words?.length) {
    words.forEach((w) => CET4_WORD_SET.add(w.toLowerCase()));
    isInitialized = true;
    return;
  }

  try {
    const response = await fetch("/api/words/list");
    const data = await response.json();
    if (data.words) {
      data.words.forEach((w: { word: string }) => CET4_WORD_SET.add(w.word.toLowerCase()));
    }
  } catch {
    console.warn("Failed to load word list from API, validator running in limited mode");
  }

  isInitialized = true;
}

export function isCET4Word(word: string): boolean {
  return CET4_WORD_SET.has(word.toLowerCase().trim());
}

export function quickSpellCheck(word: string): SpellCheckResult {
  const trimmed = word.trim();
  const lower = trimmed.toLowerCase();

  if (CET4_WORD_SET.size === 0) {
    return { word: trimmed, isCorrect: true, corrections: [] };
  }

  if (CET4_WORD_SET.has(lower)) {
    return { word: trimmed, isCorrect: true, corrections: [] };
  }

  const corrections = findSimilarWords(lower, 3);

  return {
    word: trimmed,
    isCorrect: false,
    corrections,
  };
}

function findSimilarWords(word: string, limit: number = 3): string[] {
  if (CET4_WORD_SET.size === 0) return [];

  const candidates: { word: string; distance: number }[] = [];

  for (const dictWord of CET4_WORD_SET) {
    const distance = levenshteinDistance(word, dictWord);
    if (distance <= 2) {
      candidates.push({ word: dictWord, distance });
      if (candidates.length > 50) break;
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);

  return candidates.slice(0, limit).map((c) => c.word);
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
    for (let j = 1; j <= a.length; j++) {
      if (i === 0) {
        matrix[0][j] = j;
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + (b[i - 1] === a[j - 1] ? 0 : 1),
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function tokenizeContent(content: string): string[] {
  const cleaned = content
    .replace(/[^a-zA-Z\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned
    .split(" ")
    .map((w) => w.toLowerCase().trim())
    .filter((w) => w.length > 1);
}

export function validateContent(content: string): ContentValidationReport {
  const tokens = tokenizeContent(content);
  const uniqueTokens = [...new Set(tokens)];

  const misspelledWords: string[] = [];
  const unknownWords: string[] = [];

  for (const token of uniqueTokens) {
    const spellResult = quickSpellCheck(token);
    if (!spellResult.isCorrect) {
      misspelledWords.push(token);
      if (!isCET4Word(token)) {
        unknownWords.push(token);
      }
    }
  }

  const cet4Words = uniqueTokens.filter((w) => isCET4Word(w)).length;
  const coverage = uniqueTokens.length > 0 ? cet4Words / uniqueTokens.length : 0;

  return {
    passed: misspelledWords.length === 0,
    totalWords: uniqueTokens.length,
    cet4Words,
    unknownWords,
    misspelledWords,
    coverage,
  };
}

export function validateWord(word: string): ValidationResult {
  const trimmed = word.trim().toLowerCase();

  if (trimmed.length < 2) {
    return {
      isValid: false,
      word: trimmed,
      isInWordList: false,
      isCET4: false,
      error: "单词长度必须大于1个字符",
    };
  }

  const inCET4 = isCET4Word(trimmed);
  const spellResult = quickSpellCheck(trimmed);

  return {
    isValid: inCET4 && spellResult.isCorrect,
    word: trimmed,
    isInWordList: inCET4,
    isCET4: inCET4,
    suggestions: spellResult.corrections.length > 0 ? spellResult.corrections : undefined,
    error:
      !spellResult.isCorrect && spellResult.corrections.length > 0
        ? `拼写可能错误，建议: ${spellResult.corrections.join(", ")}`
        : undefined,
  };
}

export function extractWords(content: string): string[] {
  return tokenizeContent(content);
}

export function calculateCoverage(content: string): number {
  const report = validateContent(content);
  return report.coverage;
}

export function batchValidateWords(words: string[]): ValidationResult[] {
  return words.map((w) => validateWord(w));
}
