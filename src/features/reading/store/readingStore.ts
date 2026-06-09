import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ReadingSettings {
  fontSize: number;
  lineHeight: number;
  showTranslation: boolean;
  highlightNewWords: boolean;
  highlightMastered: boolean;
  highlightWrong: boolean;
}

interface ReadingState {
  currentArticleId: string | null;
  scrollPosition: number;
  isReading: boolean;
  startTime: number | null;
  clickedWord: string | null;
  settings: ReadingSettings;
  unknownWords: string[];

  setArticleId: (id: string | null) => void;
  setScrollPosition: (position: number) => void;
  startReading: () => void;
  pauseReading: () => void;
  stopReading: () => number;
  setClickedWord: (word: string | null) => void;
  addUnknownWord: (word: string) => void;
  removeUnknownWord: (word: string) => void;
  updateSettings: (settings: Partial<ReadingSettings>) => void;
  resetSession: () => void;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      currentArticleId: null,
      scrollPosition: 0,
      isReading: false,
      startTime: null,
      clickedWord: null,
      unknownWords: [],
      settings: {
        fontSize: 18,
        lineHeight: 1.8,
        showTranslation: false,
        highlightNewWords: true,
        highlightMastered: true,
        highlightWrong: true,
      },

      setArticleId: (id) => set({ currentArticleId: id }),
      setScrollPosition: (position) => set({ scrollPosition: position }),

      startReading: () => set({ isReading: true, startTime: Date.now() }),

      pauseReading: () => set({ isReading: false }),

      stopReading: () => {
        const { startTime } = get();
        set({ isReading: false, startTime: null });
        return startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
      },

      setClickedWord: (word) => set({ clickedWord: word }),

      addUnknownWord: (word) =>
        set((s) => ({
          unknownWords: s.unknownWords.includes(word) ? s.unknownWords : [...s.unknownWords, word],
        })),

      removeUnknownWord: (word) =>
        set((s) => ({
          unknownWords: s.unknownWords.filter((w) => w !== word),
        })),

      updateSettings: (newSettings) =>
        set((s) => ({
          settings: { ...s.settings, ...newSettings },
        })),

      resetSession: () =>
        set({
          currentArticleId: null,
          scrollPosition: 0,
          isReading: false,
          startTime: null,
          clickedWord: null,
          unknownWords: [],
        }),
    }),
    {
      name: "reading-store",
      partialize: (state) => ({
        settings: state.settings,
      }),
    },
  ),
);
