import type { LevelCheckResult, WordEntry } from "./types";

let wordMetaMap: Map<string, WordEntry> = new Map();

export function initializeLevelChecker(words: WordEntry[]): void {
  wordMetaMap = new Map();
  for (const word of words) {
    wordMetaMap.set(word.word.toLowerCase(), word);
  }
}

export function getWordMeta(word: string): WordEntry | undefined {
  return wordMetaMap.get(word.toLowerCase().trim());
}

export function checkLevel(word: string, userMasteredWords?: Set<string>): LevelCheckResult {
  const meta = getWordMeta(word);

  if (!meta) {
    return {
      word: word.toLowerCase(),
      level: "unknown",
      isOutOfLevel: true,
      isMastered: false,
      frequency: 0,
    };
  }

  const isOutOfLevel = meta.level !== "cet4";
  const isMastered = userMasteredWords ? userMasteredWords.has(word.toLowerCase().trim()) : false;

  return {
    word: meta.word,
    level: meta.level,
    isOutOfLevel,
    isMastered,
    frequency: meta.frequency,
  };
}

export function batchCheckLevel(
  words: string[],
  userMasteredWords?: Set<string>,
): LevelCheckResult[] {
  return words.map((w) => checkLevel(w, userMasteredWords));
}

export function getOutOfLevelWords(words: string[], allowedLevels: string[] = ["cet4"]): string[] {
  return words.filter((w) => {
    const meta = getWordMeta(w);
    if (!meta) return true;
    return !allowedLevels.includes(meta.level);
  });
}

export function getWordFrequency(word: string): number {
  return getWordMeta(word)?.frequency ?? 0;
}

export function resetLevelChecker(): void {
  wordMetaMap = new Map();
}
