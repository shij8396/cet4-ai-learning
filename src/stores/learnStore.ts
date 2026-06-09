import { create } from "zustand";

interface WordForLearn {
  id: string;
  word: string;
  phonetic: string | null;
  meaning: string;
  partOfSpeech: string | null;
  example: string | null;
  exampleCn: string | null;
  tags: string[];
}

interface SessionStats {
  correct: number;
  wrong: number;
  skipped: number;
}

interface LearnState {
  queue: WordForLearn[];
  currentIndex: number;
  isActive: boolean;
  isComplete: boolean;
  stats: SessionStats;
  wrongWordIds: string[];

  setQueue: (words: WordForLearn[]) => void;
  nextWord: () => void;
  markCorrect: (wordId: string) => void;
  markWrong: (wordId: string) => void;
  markSkipped: () => void;
  startSession: () => void;
  endSession: () => void;
  resetSession: () => void;

  currentWord: () => WordForLearn | null;
  progress: () => number;
  remaining: () => number;
}

export const useLearnStore = create<LearnState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  isActive: false,
  isComplete: false,
  stats: { correct: 0, wrong: 0, skipped: 0 },
  wrongWordIds: [],

  setQueue: (words) =>
    set({
      queue: words,
      currentIndex: 0,
      isActive: false,
      isComplete: false,
      stats: { correct: 0, wrong: 0, skipped: 0 },
      wrongWordIds: [],
    }),

  nextWord: () => {
    const { currentIndex, queue } = get();
    if (currentIndex + 1 >= queue.length) {
      set({ isComplete: true, isActive: false });
    } else {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  markCorrect: () => {
    set((s) => ({
      stats: { ...s.stats, correct: s.stats.correct + 1 },
    }));
    get().nextWord();
  },

  markWrong: (wordId) => {
    set((s) => ({
      stats: { ...s.stats, wrong: s.stats.wrong + 1 },
      wrongWordIds: [...s.wrongWordIds, wordId],
    }));
    get().nextWord();
  },

  markSkipped: () => {
    set((s) => ({
      stats: { ...s.stats, skipped: s.stats.skipped + 1 },
    }));
    get().nextWord();
  },

  startSession: () => set({ isActive: true }),
  endSession: () => set({ isActive: false, isComplete: true }),

  resetSession: () =>
    set({
      currentIndex: 0,
      isActive: false,
      isComplete: false,
      stats: { correct: 0, wrong: 0, skipped: 0 },
      wrongWordIds: [],
    }),

  currentWord: () => {
    const { queue, currentIndex } = get();
    return queue[currentIndex] || null;
  },

  progress: () => {
    const { queue, currentIndex, isComplete } = get();
    if (queue.length === 0) return 0;
    if (isComplete) return 100;
    return (currentIndex / queue.length) * 100;
  },

  remaining: () => {
    const { queue, currentIndex } = get();
    return Math.max(0, queue.length - currentIndex);
  },
}));

export const selectCurrentWord = (s: LearnState) => s.queue[s.currentIndex] ?? null;

export const selectProgress = (s: LearnState) => {
  if (s.queue.length === 0) return 0;
  if (s.isComplete) return 100;
  return (s.currentIndex / s.queue.length) * 100;
};
