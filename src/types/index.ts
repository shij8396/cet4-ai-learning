export interface WordType {
  id: string;
  word: string;
  phonetic?: string;
  meaning: string;
  partOfSpeech?: string;
  level: string;
  frequency: number;
  example?: string;
  exampleCn?: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserWordProgressType {
  id: string;
  userId: string;
  wordId: string;
  masteryLevel: number;
  reviewCount: number;
  wrongCount: number;
  lastReviewTime?: string;
  nextReviewTime?: string;
  isFavorite: boolean;
  word?: WordType;
}

export interface WordReviewRecordType {
  id: string;
  userId: string;
  wordId: string;
  result: "correct" | "wrong" | "skip";
  reviewType: "recognition" | "dictation" | "recall";
  createdAt: string;
}

export interface ReadingArticleType {
  id: string;
  title: string;
  content: string;
  translatedContent?: string | null;
  simplifiedContent?: string | null;
  level: number;
  difficultyScore: number;
  vocabularyCoverage: number;
  wordCount: number;
  estimatedReadingTime: number;
  sourceUrl?: string | null;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserReadingProgressType {
  id: string;
  userId: string;
  articleId: string;
  progress: number;
  readTime: number;
  clickedWords: string[];
  unknownWords: string[];
  isCompleted: boolean;
  lastReadAt: string;
  article?: ReadingArticleType;
}

export interface WritingRecordType {
  id: string;
  userId: string;
  title?: string;
  content: string;
  correctedContent?: string;
  score?: number;
  grammarErrors?: unknown;
  spellingErrors?: unknown;
  outOfLevelWords: string[];
  vocabularyCoverage?: number;
  writingTime?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WritingSuggestionType {
  id: string;
  writingRecordId: string;
  type: string;
  originalText: string;
  suggestedText: string;
  explanation?: string;
  createdAt?: string;
}

export interface DictationRecordType {
  id: string;
  userId: string;
  wordId?: string;
  prompt: string;
  answer?: string;
  correctAnswer: string;
  isCorrect: boolean;
  type: "cn_to_en" | "audio_to_word" | "fill_blank";
}

export interface DailyStatType {
  id: string;
  userId: string;
  date: string;
  wordsLearned: number;
  wordsReviewed: number;
  articlesRead: number;
  dictations: number;
  writingCount: number;
  studyMinutes: number;
  xpGained: number;
}

export interface ValidationResult {
  isValid: boolean;
  word: string;
  isInWordList: boolean;
  isCET4: boolean;
  suggestions?: string[];
  error?: string;
}

export interface SpellCheckResult {
  word: string;
  isCorrect: boolean;
  corrections: string[];
}

export interface ContentValidationReport {
  passed: boolean;
  totalWords: number;
  cet4Words: number;
  unknownWords: string[];
  misspelledWords: string[];
  coverage: number;
}

export interface CET4WordImport {
  word: string;
  phonetic?: string;
  meaning: string;
  partOfSpeech?: string;
  frequency?: number;
  example?: string;
  exampleCn?: string;
  tags?: string[];
}

export interface WordListResponse {
  words: WordType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WordWithProgress extends WordType {
  progress?: UserWordProgressType;
}

export interface EbbinghausSchedule {
  intervals: number[];
  getNextReviewDate: (reviewCount: number) => Date;
}
