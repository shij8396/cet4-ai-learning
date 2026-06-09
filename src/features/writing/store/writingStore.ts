import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  RealTimeAnalysis,
  WritingScore,
  WritingSuggestionItem,
  WritingDraft,
  CoverageReport,
  HistoryRecord,
} from "../types";

export interface WritingState {
  title: string;
  content: string;
  isDirty: boolean;
  isAnalyzing: boolean;
  isSaving: boolean;
  lastAnalysis: RealTimeAnalysis | null;
  score: WritingScore | null;
  suggestions: WritingSuggestionItem[];
  draft: WritingDraft | null;
  drafts: WritingDraft[];
  history: HistoryRecord[];
  coverageReport: CoverageReport | null;
  showAssistant: boolean;
  showSimplifier: boolean;
  showScore: boolean;
  showHistory: boolean;
  masteredWords: Set<string>;

  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setAnalysis: (analysis: RealTimeAnalysis | null) => void;
  setScore: (score: WritingScore | null) => void;
  setSuggestions: (suggestions: WritingSuggestionItem[]) => void;
  setDraft: (draft: WritingDraft | null) => void;
  setCoverageReport: (report: CoverageReport | null) => void;
  setShowAssistant: (show: boolean) => void;
  setShowSimplifier: (show: boolean) => void;
  setShowScore: (show: boolean) => void;
  setShowHistory: (show: boolean) => void;
  setMasteredWords: (words: Set<string>) => void;
  addDraft: (draft: WritingDraft) => void;
  removeDraft: (id: string) => void;
  setHistory: (records: HistoryRecord[]) => void;
  reset: () => void;
}

const initialState = {
  title: "",
  content: "",
  isDirty: false,
  isAnalyzing: false,
  isSaving: false,
  lastAnalysis: null,
  score: null,
  suggestions: [],
  draft: null,
  drafts: [],
  history: [],
  coverageReport: null,
  showAssistant: false,
  showSimplifier: false,
  showScore: false,
  showHistory: false,
  masteredWords: new Set<string>(),
};

export const useWritingStore = create<WritingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTitle: (title) => set({ title, isDirty: true }),

      setContent: (content) => set({ content, isDirty: true }),

      setIsDirty: (isDirty) => set({ isDirty }),

      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

      setIsSaving: (isSaving) => set({ isSaving }),

      setAnalysis: (lastAnalysis) => set({ lastAnalysis }),

      setScore: (score) => set({ score }),

      setSuggestions: (suggestions) => set({ suggestions }),

      setDraft: (draft) => set({ draft }),

      setCoverageReport: (coverageReport) => set({ coverageReport }),

      setShowAssistant: (showAssistant) => set({ showAssistant }),

      setShowSimplifier: (showSimplifier) => set({ showSimplifier }),

      setShowScore: (showScore) => set({ showScore }),

      setShowHistory: (showHistory) => set({ showHistory }),

      setMasteredWords: (masteredWords) => set({ masteredWords }),

      addDraft: (draft) => {
        const { drafts } = get();
        const existing = drafts.findIndex((d) => d.id === draft.id);
        if (existing >= 0) {
          const updated = [...drafts];
          updated[existing] = draft;
          set({ drafts: updated, draft });
        } else {
          set({ drafts: [...drafts, draft], draft });
        }
      },

      removeDraft: (id) => {
        const { drafts, draft } = get();
        set({
          drafts: drafts.filter((d) => d.id !== id),
          draft: draft?.id === id ? null : draft,
        });
      },

      setHistory: (history) => set({ history }),

      reset: () => set(initialState),
    }),
    {
      name: "writing-store",
      partialize: (state) => ({
        drafts: state.drafts,
        draft: state.draft,
      }),
    },
  ),
);
