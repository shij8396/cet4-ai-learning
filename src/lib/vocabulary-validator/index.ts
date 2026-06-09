export {
  tokenize,
  tokenizeDetailed,
  tokenizeWithPositions,
  getUniqueTokens,
  getTokenFrequency,
} from "./tokenizer";
export {
  spellCheck,
  batchSpellCheck,
  initializeSpellChecker,
  levenshteinDistance,
  getDictionarySize,
} from "./spell-checker";
export {
  checkVocabulary,
  isInCET4,
  batchIsInCET4,
  getCoverageRate,
  initializeVocabularyChecker,
  getWordCount,
} from "./vocabulary-checker";
export {
  checkLevel,
  batchCheckLevel,
  getOutOfLevelWords,
  getWordFrequency,
  initializeLevelChecker,
} from "./level-checker";
export {
  normalize,
  batchNormalize,
  getLemma,
  getLookupForms,
  analyzeWord,
  getWordRoot,
} from "./lemma-normalizer";
export {
  validateContent,
  validateWriting,
  validateWord,
  batchValidate,
  initializeValidator,
  isValidatorReady,
} from "./validator";
export {
  analyzeReadability,
  getDifficultyLevel,
  isAppropriateForLevel,
  getLevelDescription,
} from "./readability-analyzer";
export {
  loadWordCache,
  preloadWordCache,
  refreshWordCache,
  getCachedWords,
  getCacheStatus,
} from "./vocabulary-cache";
export * from "./types";
