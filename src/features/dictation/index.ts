export {
  getDictationWords,
  generateDictationPrompt,
  generateSessionPrompts,
  classifyErrorType,
  validateAnswer,
} from "./services/dictationEngine";

export type {
  DictationMode,
  DictationWord,
  DictationPrompt,
  AnswerResult,
  ErrorType,
  SessionConfig,
} from "./services/dictationEngine";

export { checkRealtimeInput, isPartialMatch, getMatchingCharacters } from "./utils/spellChecker";
export type { RealtimeCheckResult } from "./utils/spellChecker";

export { compareLemmas, isAcceptableAnswer, getTargetForms } from "./utils/lemmaMatcher";
export type { LemmaMatchResult, LemmaAnalysis } from "./utils/lemmaMatcher";

export {
  calculateSessionScore,
  calculateWordScore,
  calculateBatchWordScores,
} from "./utils/scoringEngine";
export type { ScoringWeights, SessionScore, ScoreGrade, WordScore } from "./utils/scoringEngine";

export {
  determineDifficultyLevel,
  getDifficultyProfile,
  adjustDifficultyAfterSession,
  calculateNextReviewInterval,
  shouldRepeatWord,
} from "./utils/difficultyEngine";
export type { DifficultyProfile, UserPerformanceProfile } from "./utils/difficultyEngine";

export { useDictationStore } from "./store/dictationStore";
export type { DictationState } from "./store/dictationStore";
