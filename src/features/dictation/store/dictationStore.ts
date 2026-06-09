import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { DictationMode, DictationPrompt, AnswerResult } from "../services/dictationEngine";
import type { SessionScore } from "../utils/scoringEngine";
import type { RealtimeCheckResult } from "../utils/spellChecker";

export interface DictationState {
  mode: DictationMode;
  prompts: DictationPrompt[];
  currentIndex: number;
  currentInput: string;
  isSubmitting: boolean;
  sessionActive: boolean;
  sessionStartTime: number | null;
  results: AnswerResult[];
  currentCheck: RealtimeCheckResult | null;

  showResult: boolean;
  lastResult: AnswerResult | null;
  streak: number;
  maxStreak: number;
  retries: number;

  wrongWords: DictationPrompt[];
  skippedWords: DictationPrompt[];

  setMode: (mode: DictationMode) => void;
  setPrompts: (prompts: DictationPrompt[]) => void;
  setCurrentInput: (input: string) => void;
  setCurrentCheck: (check: RealtimeCheckResult | null) => void;
  setIsSubmitting: (submitting: boolean) => void;

  startSession: () => void;
  submitAnswer: () => AnswerResult | null;
  skipWord: () => void;
  retryWord: () => void;
  nextWord: () => void;
  endSession: () => SessionScore;
  resetSession: () => void;
}

export const useDictationStore = create<DictationState>()(
  persist(
    (set, get) => ({
      mode: "cn_to_en",
      prompts: [],
      currentIndex: 0,
      currentInput: "",
      isSubmitting: false,
      sessionActive: false,
      sessionStartTime: null,
      results: [],
      currentCheck: null,

      showResult: false,
      lastResult: null,
      streak: 0,
      maxStreak: 0,
      retries: 0,

      wrongWords: [],
      skippedWords: [],

      setMode: (mode) => set({ mode }),

      setPrompts: (prompts) =>
        set({
          prompts,
          currentIndex: 0,
          currentInput: "",
          results: [],
          wrongWords: [],
          skippedWords: [],
          streak: 0,
          maxStreak: 0,
          retries: 0,
          showResult: false,
          lastResult: null,
        }),

      setCurrentInput: (input) => set({ currentInput: input }),

      setCurrentCheck: (check) => set({ currentCheck: check }),

      setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),

      startSession: () =>
        set({
          sessionActive: true,
          sessionStartTime: Date.now(),
          currentIndex: 0,
          currentInput: "",
          results: [],
          wrongWords: [],
          skippedWords: [],
          streak: 0,
          maxStreak: 0,
          retries: 0,
          showResult: false,
          lastResult: null,
        }),

      submitAnswer: () => {
        const {
          currentInput,
          prompts,
          currentIndex,
          streak,
          maxStreak,
          results,
          wrongWords,
          sessionStartTime,
        } = get();

        if (currentIndex >= prompts.length) return null;
        if (currentInput.trim().length === 0) return null;

        const prompt = prompts[currentIndex];
        const timeSpent = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;

        const isExactMatch =
          currentInput.trim().toLowerCase() === prompt.correctAnswer.toLowerCase();

        const result: AnswerResult = {
          wordId: prompt.wordId,
          prompt: prompt.prompt,
          userAnswer: currentInput.trim(),
          correctAnswer: prompt.correctAnswer,
          isCorrect: isExactMatch,
          errorType: isExactMatch ? "correct" : "spelling",
          suggestions: isExactMatch ? [] : [prompt.correctAnswer],
          timeSpent,
          word: prompt.word,
          meaning: prompt.hint,
        };

        const newStreak = isExactMatch ? streak + 1 : 0;
        const newMaxStreak = Math.max(maxStreak, newStreak);
        const newWrongWords = isExactMatch ? wrongWords : [...wrongWords, prompt];

        set({
          results: [...results, result],
          showResult: true,
          lastResult: result,
          streak: newStreak,
          maxStreak: newMaxStreak,
          wrongWords: newWrongWords,
          currentInput: "",
          isSubmitting: false,
        });

        return result;
      },

      skipWord: () => {
        const { prompts, currentIndex, skippedWords } = get();
        if (currentIndex < prompts.length) {
          set({
            skippedWords: [...skippedWords, prompts[currentIndex]],
            currentIndex: currentIndex + 1,
            currentInput: "",
            showResult: false,
            lastResult: null,
          });
        }
      },

      retryWord: () => {
        const { retries } = get();
        set({
          retries: retries + 1,
          currentInput: "",
          showResult: false,
          lastResult: null,
        });
      },

      nextWord: () => {
        const { currentIndex, prompts } = get();
        if (currentIndex < prompts.length - 1) {
          set({
            currentIndex: currentIndex + 1,
            currentInput: "",
            showResult: false,
            lastResult: null,
            currentCheck: null,
          });
        }
      },

      endSession: () => {
        const { results, streak, retries } = get();
        const correctCount = results.filter((r) => r.isCorrect).length;
        const totalTime = results.reduce((s, r) => s + r.timeSpent, 0);

        const accuracy = results.length > 0 ? correctCount / results.length : 0;
        const rawScore = accuracy * 100;
        const score = Math.max(0, Math.min(100, rawScore));

        let grade: "S" | "A" | "B" | "C" | "D" | "F" = "F";
        if (accuracy >= 0.95 && score >= 90) grade = "S";
        else if (accuracy >= 0.85 && score >= 75) grade = "A";
        else if (accuracy >= 0.7 && score >= 60) grade = "B";
        else if (accuracy >= 0.5 && score >= 40) grade = "C";
        else if (accuracy >= 0.3 && score >= 20) grade = "D";

        const sessionScore: SessionScore = {
          totalWords: results.length,
          correctCount,
          wrongCount: results.length - correctCount,
          accuracy,
          avgTimePerWord:
            results.length > 0 ? Math.round((totalTime / results.length) * 10) / 10 : 0,
          totalTime,
          maxStreak: streak,
          currentStreak: streak,
          retryCount: retries,
          score,
          grade,
          errorBreakdown: {},
        };

        set({ sessionActive: false, sessionStartTime: null });
        return sessionScore;
      },

      resetSession: () =>
        set({
          mode: "cn_to_en",
          prompts: [],
          currentIndex: 0,
          currentInput: "",
          isSubmitting: false,
          sessionActive: false,
          sessionStartTime: null,
          results: [],
          currentCheck: null,
          showResult: false,
          lastResult: null,
          streak: 0,
          maxStreak: 0,
          retries: 0,
          wrongWords: [],
          skippedWords: [],
        }),
    }),
    {
      name: "dictation-store",
      partialize: (state) => ({
        mode: state.mode,
      }),
    },
  ),
);
