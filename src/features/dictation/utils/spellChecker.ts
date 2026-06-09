import { spellCheck, isWordInDictionary } from "@/lib/vocabulary-validator/spell-checker";

export interface RealtimeCheckResult {
  word: string;
  isCorrect: boolean;
  isComplete: boolean;
  matchedWord: string | null;
  suggestions: string[];
  errorPositions: number[];
}

function findMatchedPrefix(partial: string, fullWord: string): boolean {
  return fullWord.toLowerCase().startsWith(partial.toLowerCase());
}

export function checkRealtimeInput(
  input: string,
  targetWord: string,
  checkSpelling: boolean = true,
): RealtimeCheckResult {
  const trimmed = input.toLowerCase().trim();

  if (trimmed.length === 0) {
    return {
      word: "",
      isCorrect: false,
      isComplete: false,
      matchedWord: null,
      suggestions: [],
      errorPositions: [],
    };
  }

  const isPrefixMatch = findMatchedPrefix(trimmed, targetWord);
  const isExactMatch = trimmed === targetWord.toLowerCase();

  if (isExactMatch) {
    return {
      word: trimmed,
      isCorrect: true,
      isComplete: true,
      matchedWord: targetWord,
      suggestions: [],
      errorPositions: [],
    };
  }

  if (isPrefixMatch) {
    return {
      word: trimmed,
      isCorrect: true,
      isComplete: false,
      matchedWord: targetWord,
      suggestions: [],
      errorPositions: [],
    };
  }

  const errorPositions: number[] = [];
  for (let i = 0; i < trimmed.length; i++) {
    if (i >= targetWord.length || trimmed[i] !== targetWord[i].toLowerCase()) {
      errorPositions.push(i);
    }
  }

  let suggestions: string[] = [];
  if (checkSpelling && trimmed.length >= 3) {
    const checkResult = spellCheck(trimmed, 3);
    if (!checkResult.isCorrect) {
      suggestions = checkResult.corrections;

      if (isWordInDictionary(targetWord)) {
        suggestions = suggestions.filter((s) => s !== targetWord.toLowerCase());
        suggestions.unshift(targetWord.toLowerCase());
      }
    }
  }

  return {
    word: trimmed,
    isCorrect: false,
    isComplete: trimmed.length >= targetWord.length,
    matchedWord: null,
    suggestions: suggestions.slice(0, 5),
    errorPositions,
  };
}

export function isPartialMatch(input: string, targetWord: string): boolean {
  return findMatchedPrefix(input, targetWord);
}

export function getMatchingCharacters(input: string, targetWord: string): number {
  const inputLower = input.toLowerCase();
  const targetLower = targetWord.toLowerCase();
  let matches = 0;

  for (let i = 0; i < Math.min(inputLower.length, targetLower.length); i++) {
    if (inputLower[i] === targetLower[i]) {
      matches++;
    } else {
      break;
    }
  }

  return matches;
}
