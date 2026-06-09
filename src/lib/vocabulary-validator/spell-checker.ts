import type { SpellCheckResult } from "./types";

let wordSet: Set<string> | null = null;
let wordArray: string[] = [];

export function initializeSpellChecker(words: string[]): void {
  if (words.length > 0) {
    wordSet = new Set(words.map((w) => w.toLowerCase()));
    wordArray = [...wordSet];
  }
}

export function isWordInDictionary(word: string): boolean {
  if (!wordSet) return true;
  return wordSet.has(word.toLowerCase());
}

export function levenshteinDistance(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  if (Math.abs(aLen - bLen) > 3) return 4;

  let prevRow = new Array<number>(bLen + 1);
  let currRow = new Array<number>(bLen + 1);

  for (let j = 0; j <= bLen; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= aLen; i++) {
    currRow[0] = i;

    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(prevRow[j] + 1, currRow[j - 1] + 1, prevRow[j - 1] + cost);
    }

    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[bLen];
}

function findSimilarWords(
  word: string,
  wordList: string[],
  maxDistance: number = 2,
  limit: number = 5,
): Array<{ word: string; distance: number }> {
  const candidates: Array<{ word: string; distance: number }> = [];
  const targetLen = word.length;

  for (const dictWord of wordList) {
    if (Math.abs(dictWord.length - targetLen) > maxDistance) continue;

    const distance = levenshteinDistance(word, dictWord);
    if (distance <= maxDistance) {
      candidates.push({ word: dictWord, distance });
      if (distance === 0) break;
    }

    if (candidates.length > 100) break;
  }

  return candidates.sort((a, b) => a.distance - b.distance).slice(0, limit);
}

export function spellCheck(word: string, maxSuggestions: number = 3): SpellCheckResult {
  const normalized = word.toLowerCase().trim();

  if (!wordSet || wordSet.size === 0) {
    return {
      word: normalized,
      isCorrect: true,
      corrections: [],
      distance: 0,
    };
  }

  if (wordSet.has(normalized)) {
    return {
      word: normalized,
      isCorrect: true,
      corrections: [],
      distance: 0,
    };
  }

  const similar = findSimilarWords(normalized, wordArray, 2, maxSuggestions);

  return {
    word: normalized,
    isCorrect: false,
    corrections: similar.map((s) => s.word),
    distance: similar[0]?.distance ?? 99,
  };
}

export function batchSpellCheck(words: string[], maxSuggestions: number = 3): SpellCheckResult[] {
  return words.map((w) => spellCheck(w, maxSuggestions));
}

export function getDictionarySize(): number {
  return wordArray.length;
}

export function resetSpellChecker(): void {
  wordSet = null;
  wordArray = [];
}
