import { parseJsonArray } from "@/lib/json-array";
import { prisma } from "@/lib/prisma";

import { initializeLevelChecker } from "./level-checker";
import { initializeSpellChecker } from "./spell-checker";
import { initializeVocabularyChecker } from "./vocabulary-checker";

import type { WordEntry } from "./types";

interface CacheEntry {
  words: string[];
  wordMeta: WordEntry[];
  loadedAt: Date;
}

let cache: CacheEntry | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000;

function isCacheValid(): boolean {
  if (!cache) return false;
  const age = Date.now() - cache.loadedAt.getTime();
  return age < CACHE_TTL_MS;
}

export async function loadWordCache(force?: boolean): Promise<{
  wordCount: number;
  fromCache: boolean;
}> {
  if (!force && isCacheValid() && cache) {
    return { wordCount: cache.words.length, fromCache: true };
  }

  if (isLoading && loadPromise) {
    await loadPromise;
    return {
      wordCount: cache?.words.length ?? 0,
      fromCache: false,
    };
  }

  isLoading = true;

  loadPromise = (async () => {
    try {
      const words = await prisma.word.findMany({
        where: { level: "cet4" },
        select: {
          word: true,
          level: true,
          frequency: true,
          tags: true,
        },
        orderBy: { frequency: "desc" },
      });

      const wordStrings = words.map((w) => w.word.toLowerCase().trim());
      const wordMeta: WordEntry[] = words.map((w) => ({
        word: w.word.toLowerCase().trim(),
        level: w.level,
        frequency: w.frequency,
        tags: parseJsonArray(w.tags),
      }));

      initializeSpellChecker(wordStrings);
      initializeVocabularyChecker(wordStrings);
      initializeLevelChecker(wordMeta);

      cache = {
        words: wordStrings,
        wordMeta,
        loadedAt: new Date(),
      };
    } catch (error) {
      console.error("Failed to load word cache:", error);
      throw error;
    } finally {
      isLoading = false;
      loadPromise = null;
    }
  })();

  await loadPromise;

  return {
    wordCount: cache?.words.length ?? 0,
    fromCache: false,
  };
}

export function getCachedWords(): string[] {
  return cache?.words ?? [];
}

export function getCachedWordMeta(): WordEntry[] {
  return cache?.wordMeta ?? [];
}

export function invalidateCache(): void {
  cache = null;
}

export function getCacheStatus(): {
  isLoaded: boolean;
  wordCount: number;
  age: number | null;
} {
  return {
    isLoaded: cache !== null,
    wordCount: cache?.words.length ?? 0,
    age: cache ? Date.now() - cache.loadedAt.getTime() : null,
  };
}

export async function preloadWordCache(): Promise<void> {
  try {
    await loadWordCache();
  } catch {
    console.warn("Failed to preload word cache, continuing without cache");
  }
}

export async function refreshWordCache(): Promise<void> {
  await loadWordCache(true);
}
