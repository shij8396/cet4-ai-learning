import type { VocabularyCheckResult } from "./types";

let cet4WordSet: Set<string> | null = null;

export function initializeVocabularyChecker(words: string[]): void {
  if (words.length > 0) {
    cet4WordSet = new Set(words.map((w) => w.toLowerCase().trim()));
  }
}

export function getWordSet(): Set<string> | null {
  return cet4WordSet;
}

export function isInCET4(word: string): boolean {
  if (!cet4WordSet) return false;
  return cet4WordSet.has(word.toLowerCase().trim());
}

export function batchIsInCET4(words: string[]): Map<string, boolean> {
  const result = new Map<string, boolean>();
  for (const word of words) {
    result.set(word, isInCET4(word));
  }
  return result;
}

export function checkVocabulary(words: string[]): VocabularyCheckResult {
  const uniqueWords = [...new Set(words.map((w) => w.toLowerCase().trim()))];

  const validWords: string[] = [];
  const invalidWords: string[] = [];
  for (const word of uniqueWords) {
    if (isInCET4(word)) {
      validWords.push(word);
    } else {
      invalidWords.push(word);
    }
  }

  const coverageRate = uniqueWords.length > 0 ? validWords.length / uniqueWords.length : 0;

  return {
    validWords,
    invalidWords,
    unknownWords: invalidWords,
    coverageRate,
  };
}

export function getCoverageRate(words: string[]): number {
  const uniqueWords = [...new Set(words.map((w) => w.toLowerCase().trim()))];
  if (uniqueWords.length === 0) return 1;

  const validCount = uniqueWords.filter((w) => isInCET4(w)).length;
  return validCount / uniqueWords.length;
}

export function getWordCount(): number {
  return cet4WordSet?.size ?? 0;
}

export function resetVocabularyChecker(): void {
  cet4WordSet = null;
}
