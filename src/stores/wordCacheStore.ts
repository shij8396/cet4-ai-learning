import { create } from "zustand";

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

export const useWordCacheStore = create<WordCacheState>((set, get) => ({
  words: [],
  loading: false,
  loadedAt: null,

  fetchWords: async (force = false) => {
    const { loadedAt, loading } = get();
    if (loading) return;

    if (!force && loadedAt && Date.now() - loadedAt < CACHE_TTL) {
      return;
    }

    set({ loading: true });
    try {
      const pageSize = 500;
      const firstRes = await fetch(
        `/api/words?limit=${pageSize}&includeTotal=true&sortBy=frequency&sortOrder=desc`,
      );
      const firstData = await firstRes.json();
      const firstWords = firstData.words || [];
      const totalPages = firstData.pagination?.totalPages || 1;

      if (totalPages <= 1) {
        set({ words: firstWords, loadedAt: Date.now() });
        return;
      }

      const restPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) => index + 2).map(async (page) => {
          const res = await fetch(
            `/api/words?page=${page}&limit=${pageSize}&sortBy=frequency&sortOrder=desc`,
          );
          const data = await res.json();
          return data.words || [];
        }),
      );

      set({ words: [...firstWords, ...restPages.flat()], loadedAt: Date.now() });
    } catch {
      console.error("Failed to fetch words");
    } finally {
      set({ loading: false });
    }
  },
}));
