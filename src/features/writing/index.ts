export { WritingEditor, HighlightedText } from "./components/WritingEditor";
export { WritingSuggestions } from "./components/WritingSuggestions";
export { WritingAssistant } from "./components/WritingAssistant";
export { WritingScoreCard } from "./components/WritingScoreCard";
export { WritingHistory } from "./components/WritingHistory";
export { WritingSimplifier } from "./components/WritingSimplifier";

export { useWritingAnalyzer } from "./hooks/useWritingAnalyzer";
export { useAutoSave } from "./hooks/useAutoSave";

export { useWritingStore } from "./store/writingStore";
export type { WritingState } from "./store/writingStore";

export {
  analyzeText,
  analyzeWord,
  calculateWritingScore,
  calculateCoverage,
  getWritingSuggestions,
} from "./validators/writingValidator";

export {
  isOutOfLevel,
  getOutOfLevelReplacements,
  detectOutOfLevelWords,
  isFunctionWord,
  isHighFrequencyCET4,
} from "./validators/outOfLevelDetector";

export { getAssistantSuggestions, simplifyText } from "./utils/writingAssistant";

export * from "./types";
