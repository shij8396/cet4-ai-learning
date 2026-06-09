import { normalize, getLemma } from "@/lib/vocabulary-validator/lemma-normalizer";

export type DictationMode = "cn_to_en" | "listen_to_en" | "fill_in_blank" | "review";

export interface DictationWord {
  wordId: string;
  word: string;
  meaning: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  example: string | null;
  exampleCn: string | null;
  masteryLevel: number;
  wrongCount: number;
}

export interface DictationPrompt {
  prompt: string;
  correctAnswer: string;
  wordId: string;
  word: string;
  phonetic: string | null;
  hint: string;
  type: DictationMode;
  example: string | null;
  exampleCn: string | null;
  exampleWithBlank: string | null;
}

export interface AnswerResult {
  wordId: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  errorType: ErrorType;
  suggestions: string[];
  timeSpent: number;
  word: string;
  meaning: string;
}

export type ErrorType =
  | "correct"
  | "spelling"
  | "missing_letter"
  | "extra_letter"
  | "wrong_letter"
  | "wrong_word"
  | "case_error"
  | "lemma_match";

export interface SessionConfig {
  wordCount: number;
  mode: DictationMode;
  targetLevel: number;
  newWordRatio: number;
  includeWrongWords: boolean;
}

const DEFAULT_CONFIG: SessionConfig = {
  wordCount: 10,
  mode: "cn_to_en",
  targetLevel: 1,
  newWordRatio: 0.2,
  includeWrongWords: true,
};

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateFillInBlankExample(example: string, targetWord: string): string | null {
  if (!example) return null;

  const lowerWord = targetWord.toLowerCase();

  const wordRegex = new RegExp(`\\b${lowerWord}\\b`, "i");
  if (wordRegex.test(example)) {
    return example.replace(wordRegex, "____");
  }

  const lemmaVariants = [getLemma(lowerWord), normalize(lowerWord)];
  for (const variant of lemmaVariants) {
    if (variant === lowerWord) continue;
    const variantRegex = new RegExp(`\\b${variant}\\b`, "i");
    if (variantRegex.test(example)) {
      return example.replace(variantRegex, "____");
    }
  }

  return null;
}

export function getDictationWords(
  allWords: DictationWord[],
  config: Partial<SessionConfig> = {},
): DictationWord[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const mastered: DictationWord[] = [];
  const learning: DictationWord[] = [];
  const weak: DictationWord[] = [];
  const newWords: DictationWord[] = [];

  for (const w of allWords) {
    if (w.masteryLevel <= 1) {
      newWords.push(w);
    } else if (w.wrongCount >= 3) {
      weak.push(w);
    } else if (w.masteryLevel >= 4) {
      mastered.push(w);
    } else {
      learning.push(w);
    }
  }

  const selected: DictationWord[] = [];
  const targetCount = finalConfig.wordCount;

  const weakCount = Math.min(weak.length, Math.ceil(targetCount * 0.3));
  const newCount = Math.min(newWords.length, Math.ceil(targetCount * finalConfig.newWordRatio));
  const masteredCount = Math.min(mastered.length, Math.ceil(targetCount * 0.1));
  const learningCount = Math.min(
    learning.length,
    targetCount - weakCount - newCount - masteredCount,
  );

  selected.push(...shuffleArray(weak).slice(0, weakCount));
  selected.push(...shuffleArray(newWords).slice(0, newCount));
  selected.push(...shuffleArray(mastered).slice(0, masteredCount));
  selected.push(...shuffleArray(learning).slice(0, learningCount));

  return shuffleArray(selected);
}

export function generateDictationPrompt(word: DictationWord, mode: DictationMode): DictationPrompt {
  const base: Omit<DictationPrompt, "prompt" | "type"> = {
    correctAnswer: word.word,
    wordId: word.wordId,
    word: word.word,
    phonetic: word.phonetic,
    hint: word.meaning,
    example: word.example,
    exampleCn: word.exampleCn,
    exampleWithBlank: word.example ? generateFillInBlankExample(word.example, word.word) : null,
  };

  switch (mode) {
    case "cn_to_en":
      return {
        ...base,
        prompt: word.meaning,
        type: "cn_to_en",
      };

    case "listen_to_en":
      return {
        ...base,
        prompt: word.phonetic || word.word,
        type: "listen_to_en",
      };

    case "fill_in_blank":
      return {
        ...base,
        prompt: base.exampleWithBlank || word.meaning,
        type: "fill_in_blank",
      };

    case "review":
      return {
        ...base,
        prompt: word.meaning,
        type: "review",
      };
  }
}

export function generateSessionPrompts(
  words: DictationWord[],
  mode: DictationMode,
): DictationPrompt[] {
  return words.map((w) => generateDictationPrompt(w, mode));
}

export function classifyErrorType(userAnswer: string, correctAnswer: string): ErrorType {
  const lowerUser = userAnswer.toLowerCase().trim();
  const lowerCorrect = correctAnswer.toLowerCase().trim();

  if (lowerUser === lowerCorrect) {
    if (userAnswer !== correctAnswer) {
      return "case_error";
    }
    return "correct";
  }

  if (getLemma(lowerUser) === getLemma(lowerCorrect)) {
    return "lemma_match";
  }

  if (lowerUser.length === 0) return "wrong_word";

  const userChars = lowerUser.split("");
  const correctChars = lowerCorrect.split("");

  let missing = 0;
  let extra = 0;
  let wrong = 0;

  const correctCharSet = new Set(correctChars);
  for (const ch of userChars) {
    if (!correctCharSet.has(ch)) extra++;
  }

  const userCharSet = new Set(userChars);
  for (const ch of correctChars) {
    if (!userCharSet.has(ch)) missing++;
  }

  if (extra === 0 && missing > 0) return "missing_letter";
  if (missing === 0 && extra > 0) return "extra_letter";

  wrong = Math.max(extra, missing);
  if (wrong === 0) wrong = 1;

  if (wrong === 1) return "spelling";
  if (lowerUser.length < lowerCorrect.length - 1) return "missing_letter";
  if (lowerUser.length > lowerCorrect.length + 1) return "extra_letter";

  return "spelling";
}

export function validateAnswer(
  userAnswer: string,
  prompt: DictationPrompt,
  timeSpent: number,
): AnswerResult {
  const isExactMatch = userAnswer.trim().toLowerCase() === prompt.correctAnswer.toLowerCase();
  const lemmaMatch =
    !isExactMatch &&
    getLemma(userAnswer.trim().toLowerCase()) === getLemma(prompt.correctAnswer.toLowerCase());

  const isCorrect = isExactMatch || lemmaMatch;

  const errorType = isCorrect
    ? lemmaMatch
      ? "lemma_match"
      : "correct"
    : classifyErrorType(userAnswer, prompt.correctAnswer);

  const suggestions = isCorrect ? [] : [prompt.correctAnswer, prompt.hint].filter(Boolean);

  return {
    wordId: prompt.wordId,
    prompt: prompt.prompt,
    userAnswer: userAnswer.trim(),
    correctAnswer: prompt.correctAnswer,
    isCorrect,
    errorType: errorType as ErrorType,
    suggestions,
    timeSpent,
    word: prompt.word,
    meaning: prompt.hint,
  };
}
