export type AIProvider = "gemini" | "openrouter" | "openai";

export interface AIConfig {
  provider: AIProvider;
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  maxRetries: number;
  timeoutMs: number;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  stream?: boolean;
}

export interface AIResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: AIProvider;
  model: string;
}

export interface AIStreamChunk {
  text: string;
  done: boolean;
}

export interface AIError {
  code: string;
  message: string;
  provider: AIProvider;
  retryable: boolean;
}

export interface ValidationReport {
  passed: boolean;
  totalWords: number;
  spellingErrors: string[];
  outOfLevelWords: string[];
  coverage: number;
  suggestions: string[];
  retryCount: number;
}

export interface GeneratedSentence {
  english: string;
  chinese: string;
  targetWord: string;
  difficulty: number;
  words: string[];
}

export interface GeneratedReading {
  title: string;
  content: string;
  level: number;
  wordCount: number;
  vocabularyCoverage: number;
  newWords: string[];
  questions: GeneratedQuestion[];
}

export interface GeneratedQuestion {
  id: string;
  type: "choice" | "truefalse" | "fillblank";
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface StudyRecommendation {
  recommendedArticles: string[];
  recommendedWords: string[];
  focusAreas: string[];
  difficulty: number;
  reason: string;
}

export interface DailyPlan {
  date: string;
  wordsToLearn: number;
  wordsToReview: number;
  readingTask: { articleId?: string; title: string; estimatedTime: number };
  dictationTask: { wordCount: number; estimatedTime: number };
  writingTask: { topic: string; wordTarget: number; estimatedTime: number };
  totalEstimatedTime: number;
  tips: string[];
}

export interface WeaknessReport {
  topErrorWords: Array<{ word: string; count: number; type: string }>;
  commonMistakeTypes: Array<{ type: string; count: number }>;
  suggestedExercises: string[];
  improvementAreas: string[];
}

export interface WritingCoachSuggestion {
  type: "expression" | "replacement" | "structure" | "simplify";
  original: string;
  suggested: string;
  explanation: string;
}

export interface CacheEntry<T> {
  data: T;
  createdAt: number;
  ttl: number;
  key: string;
}

export interface DebugLog {
  id: string;
  timestamp: number;
  provider: AIProvider;
  model: string;
  prompt: string;
  response: string;
  tokens: { prompt: number; completion: number; total: number };
  latency: number;
  validated: boolean;
  errors: string[];
}
