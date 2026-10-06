import { create } from "zustand";

import { cet4Words } from "@/data/cet4Words";
import { api } from "@/lib/api-client";

export interface WordWithProgress {
  id: string;
  word: string;
  phonetic: string | null;
  meaning: string;
  level: string;
  frequency: number;
  example: string | null;
  exampleCn: string | null;
  tags: string[];
  partOfSpeech: string | null;
  progress: {
    isFavorite: boolean;
    masteryLevel: number;
    reviewCount: number;
  } | null;
}

interface WordCacheState {
  words: WordWithProgress[];
  loading: boolean;
  loadedAt: number | null;
  fetchWords: (force?: boolean) => Promise<void>;
}

const CACHE_TTL = 5 * 60 * 1000;

function getFallbackWords(): WordWithProgress[] {
  return cet4Words.map((word, index) => ({
    id: word.word || `fallback-${index}`,
    word: word.word,
    phonetic: word.phonetic ?? null,
    meaning: word.meaning,
    level: "cet4",
    frequency: word.frequency ?? 0,
    example: word.example ?? null,
    exampleCn: null,
    tags: word.tags ?? [],
    partOfSpeech: word.partOfSpeech ?? null,
    progress: null,
  }));
}

export const useWordCacheStore = create<WordCacheState>((set, get) => ({
  words: getFallbackWords(),
  loading: false,
  loadedAt: Date.now(),

  fetchWords: async (force = false) => {
    const { loadedAt, loading, words } = get();
    if (loading) return;

    if (!force && words.length > 0) return;

    if (!force && loadedAt && Date.now() - loadedAt < CACHE_TTL) {
      return;
    }

    set({ loading: true });
    try {
      const pageSize = 500;
      const firstData = await api.get<{
        words: WordWithProgress[];
        pagination?: { totalPages?: number | null };
      }>(`/api/v1/words?limit=${pageSize}&includeTotal=true&sortBy=frequency&sortOrder=desc`);
      const firstWords = firstData.words || [];
      const totalPages = firstData.pagination?.totalPages || 1;

      if (totalPages <= 1) {
        set({ words: firstWords, loadedAt: Date.now() });
        return;
      }

      const restPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) => index + 2).map((page) =>
          api.get<{ words: WordWithProgress[] }>(
            `/api/v1/words?page=${page}&limit=${pageSize}&sortBy=frequency&sortOrder=desc`,
          ),
        ),
      );
      const restWords = restPages.flatMap((data) => data.words || []);

      set({ words: [...firstWords, ...restWords], loadedAt: Date.now() });
    } catch {
      console.warn("Failed to fetch words");
      set({ words: getFallbackWords(), loadedAt: Date.now() });
    } finally {
      set({ loading: false });
    }
  },
}));
