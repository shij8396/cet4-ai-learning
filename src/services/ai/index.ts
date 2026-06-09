export { generateText, generateTextStream } from "./providers";

export { validateAIContent, quickValidate, extractJSON } from "./validators/aiContentValidator";

export { generateSentences } from "./generators/sentenceGenerator";
export { generateReading } from "./generators/readingGenerator";
export { getWritingCoachSuggestions } from "./generators/writingCoach";

export { getRecommendations, generateDailyPlan, analyzeWeakness } from "./engines/learningEngine";

export {
  getCacheKey,
  getFromCache,
  setCache,
  invalidateCache,
  getCacheSize,
  getCacheStats,
} from "./cache";

export { addDebugLog, getDebugLogs, getProviderStats, clearDebugLogs } from "./debug";

export {
  getAIConfig,
  getApiKey,
  isProviderAvailable,
  getAvailableProviders,
  getFallbackProvider,
} from "./config";

export {
  CET4_SYSTEM_PROMPT,
  buildSentencePrompt,
  buildReadingPrompt,
  buildQuestionPrompt,
  buildWritingCoachPrompt,
  buildRecommendationPrompt,
  buildStudyPlanPrompt,
  buildWeaknessAnalysisPrompt,
} from "./prompts/templates";

export type {
  AIProvider,
  AIConfig,
  AIMessage,
  AIRequest,
  AIResponse,
  AIStreamChunk,
  AIError,
  ValidationReport,
  GeneratedSentence,
  GeneratedReading,
  GeneratedQuestion,
  StudyRecommendation,
  DailyPlan,
  WeaknessReport,
  WritingCoachSuggestion,
  CacheEntry,
  DebugLog,
} from "./types";
