import { create } from "zustand";
import { persist } from "zustand/middleware";

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

interface StudyState {
  todayKey: string;
  todayWordsLearned: number;
  todayWordsReviewed: number;
  todayStudyMinutes: number;
  totalWordsLearned: number;
  totalWordsReviewed: number;

  incrementLearned: (count?: number) => void;
  incrementReviewed: (count?: number) => void;
  addStudyMinutes: (minutes: number) => void;
  checkDayReset: () => void;
  resetDaily: () => void;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      todayKey: getTodayKey(),
      todayWordsLearned: 0,
      todayWordsReviewed: 0,
      todayStudyMinutes: 0,
      totalWordsLearned: 0,
      totalWordsReviewed: 0,

      incrementLearned: (count = 1) => {
        const state = get();
        state.checkDayReset();
        set((s) => ({
          todayWordsLearned: s.todayWordsLearned + count,
          totalWordsLearned: s.totalWordsLearned + count,
        }));
      },

      incrementReviewed: (count = 1) => {
        const state = get();
        state.checkDayReset();
        set((s) => ({
          todayWordsReviewed: s.todayWordsReviewed + count,
          totalWordsReviewed: s.totalWordsReviewed + count,
        }));
      },

      addStudyMinutes: (minutes: number) => {
        const state = get();
        state.checkDayReset();
        set((s) => ({
          todayStudyMinutes: s.todayStudyMinutes + minutes,
        }));
      },

      checkDayReset: () => {
        const today = getTodayKey();
        if (get().todayKey !== today) {
          set({
            todayKey: today,
            todayWordsLearned: 0,
            todayWordsReviewed: 0,
            todayStudyMinutes: 0,
          });
        }
      },

      resetDaily: () =>
        set({
          todayWordsLearned: 0,
          todayWordsReviewed: 0,
          todayStudyMinutes: 0,
        }),
    }),
    {
      name: "study-storage",
      partialize: (state) => ({
        todayKey: state.todayKey,
        todayWordsLearned: state.todayWordsLearned,
        todayWordsReviewed: state.todayWordsReviewed,
        todayStudyMinutes: state.todayStudyMinutes,
        totalWordsLearned: state.totalWordsLearned,
        totalWordsReviewed: state.totalWordsReviewed,
      }),
    },
  ),
);
