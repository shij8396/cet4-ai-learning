export interface WordAnalysis {
  word: string;
  startIndex: number;
  endIndex: number;
  isSpellingError: boolean;
  isOutOfLevel: boolean;
  isMastered: boolean;
  isHighFrequency: boolean;
  spellingCorrections: string[];
  levelReplacements: string[];
  frequency: number;
}

export interface RealTimeAnalysis {
  words: WordAnalysis[];
  spellingErrors: WordAnalysis[];
  outOfLevelWords: WordAnalysis[];
  masteredWords: WordAnalysis[];
  highFrequencyWords: WordAnalysis[];
  repeatedWords: { word: string; count: number }[];
  vocabularyCoverage: number;
}

export interface WritingScore {
  overallScore: number;
  vocabularyScore: number;
  grammarScore: number;
  readabilityScore: number;
  spellingAccuracy: number;
  cet4UsageRate: number;
  sentenceFluency: number;
  grammarCorrectRate: number;
  repetitionRate: number;
  structureScore: number;
  grade: "S" | "A" | "B" | "C" | "D" | "F";
}

export interface AssistantRequest {
  chineseIdea: string;
  maxWords?: number;
}

export interface AssistantResponse {
  suggestions: string[];
  usedWords: string[];
}

export interface SimplifierRequest {
  originalText: string;
}

export interface SimplifierResponse {
  simplifiedText: string;
  changes: Array<{
    original: string;
    simplified: string;
    reason: string;
  }>;
}

export interface WritingSuggestionItem {
  id: string;
  type: "spelling" | "outOfLevel" | "grammar" | "expression" | "style";
  originalText: string;
  suggestedText: string;
  explanation: string;
  position: { start: number; end: number };
}

export interface WritingDraft {
  id: string;
  title: string;
  content: string;
  savedAt: number;
}

export interface CoverageReport {
  totalWords: number;
  masteredWords: number;
  newWords: number;
  outOfLevelWords: number;
  highFrequencyWords: number;
  coverageScore: number;
}

export interface HistoryRecord {
  id: string;
  title: string;
  content: string;
  score: number | null;
  createdAt: string;
  wordCount: number;
}
