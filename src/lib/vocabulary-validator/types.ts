export interface TokenResult {
  original: string;
  normalized: string;
  isContraction: boolean;
  expandedTokens: string[];
}

export interface SpellCheckResult {
  word: string;
  isCorrect: boolean;
  corrections: string[];
  distance: number;
}

export interface VocabularyCheckResult {
  validWords: string[];
  invalidWords: string[];
  unknownWords: string[];
  coverageRate: number;
}

export interface LevelCheckResult {
  word: string;
  level: string;
  isOutOfLevel: boolean;
  isMastered: boolean;
  frequency: number;
}

export interface LemmaResult {
  original: string;
  lemma: string;
  isBaseForm: boolean;
  possibleForms: string[];
}

export interface ContentValidationResult {
  valid: boolean;
  totalWords: number;
  uniqueWords: number;
  validWordCount: number;
  invalidWords: string[];
  outOfLevelWords: string[];
  spellingErrors: string[];
  suggestions: SpellSuggestion[];
  coverageRate: number;
  difficultyScore: number;
  tokens: string[];
}

export interface SpellSuggestion {
  word: string;
  suggestions: string[];
}

export interface ReadabilityMetrics {
  sentenceCount: number;
  wordCount: number;
  charCount: number;
  avgWordLength: number;
  avgSentenceLength: number;
  complexSentenceRatio: number;
  unfamiliarWordRatio: number;
  difficultyScore: number;
  level: "easy" | "medium" | "hard" | "very_hard";
}

export interface WritingValidationResult {
  valid: boolean;
  totalWords: number;
  spellingErrors: SpellSuggestion[];
  outOfLevelWords: string[];
  repeatedWords: { word: string; count: number }[];
  coverageRate: number;
  suggestions: string[];
}

export interface WordEntry {
  word: string;
  level: string;
  frequency: number;
  tags: string[];
}

export interface ContractionRule {
  pattern: RegExp;
  expansions: string[];
}
