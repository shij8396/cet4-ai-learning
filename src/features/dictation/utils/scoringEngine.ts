import type { AnswerResult, ErrorType } from "../services/dictationEngine";

export interface ScoringWeights {
  correctAnswer: number;
  responseTime: number;
  streak: number;
  retries: number;
}

export interface SessionScore {
  totalWords: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  avgTimePerWord: number;
  totalTime: number;
  maxStreak: number;
  currentStreak: number;
  retryCount: number;
  score: number;
  grade: ScoreGrade;
  errorBreakdown: Record<string, number>;
}

export type ScoreGrade = "S" | "A" | "B" | "C" | "D" | "F";

export interface WordScore {
  wordId: string;
  word: string;
  masteryChange: number;
  newMasteryLevel: number;
  needsReview: boolean;
  reviewPriority: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  correctAnswer: 10,
  responseTime: 3,
  streak: 5,
  retries: -2,
};

function calculateAccuracyScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return (correct / total) * DEFAULT_WEIGHTS.correctAnswer * total;
}

function calculateTimeScore(avgTime: number): number {
  if (avgTime <= 3) return DEFAULT_WEIGHTS.responseTime * 3;
  if (avgTime <= 5) return DEFAULT_WEIGHTS.responseTime * 2;
  if (avgTime <= 10) return DEFAULT_WEIGHTS.responseTime;
  return 0;
}

function calculateStreakScore(maxStreak: number): number {
  return Math.min(maxStreak, 10) * DEFAULT_WEIGHTS.streak;
}

function calculateRetryPenalty(retries: number): number {
  return retries * DEFAULT_WEIGHTS.retries;
}

function determineGrade(score: number, accuracy: number): ScoreGrade {
  if (accuracy >= 0.95 && score >= 90) return "S";
  if (accuracy >= 0.85 && score >= 75) return "A";
  if (accuracy >= 0.7 && score >= 60) return "B";
  if (accuracy >= 0.5 && score >= 40) return "C";
  if (accuracy >= 0.3 && score >= 20) return "D";
  return "F";
}

function normalizeErrorType(type: ErrorType): string {
  switch (type) {
    case "correct":
      return "正确";
    case "lemma_match":
      return "词根匹配";
    case "case_error":
      return "大小写错误";
    case "spelling":
      return "拼写错误";
    case "missing_letter":
      return "缺字母";
    case "extra_letter":
      return "多字母";
    case "wrong_letter":
      return "错字母";
    case "wrong_word":
      return "词错误";
    default:
      return "未知";
  }
}

export function calculateSessionScore(
  results: AnswerResult[],
  streak: number = 0,
  retries: number = 0,
): SessionScore {
  const correctResults = results.filter((r) => r.isCorrect);
  const wrongResults = results.filter((r) => !r.isCorrect);

  const totalTime = results.reduce((sum, r) => sum + r.timeSpent, 0);
  const avgTime = results.length > 0 ? totalTime / results.length : 0;

  const errorBreakdown: Record<string, number> = {};
  for (const r of wrongResults) {
    const key = normalizeErrorType(r.errorType);
    errorBreakdown[key] = (errorBreakdown[key] || 0) + 1;
  }

  const rawScore =
    calculateAccuracyScore(correctResults.length, results.length) +
    calculateTimeScore(avgTime) +
    calculateStreakScore(streak) +
    calculateRetryPenalty(retries);

  const score = Math.max(0, Math.min(100, rawScore));
  const accuracy = results.length > 0 ? correctResults.length / results.length : 0;

  return {
    totalWords: results.length,
    correctCount: correctResults.length,
    wrongCount: wrongResults.length,
    accuracy,
    avgTimePerWord: Math.round(avgTime * 10) / 10,
    totalTime,
    maxStreak: streak,
    currentStreak: streak,
    retryCount: retries,
    score,
    grade: determineGrade(score, accuracy),
    errorBreakdown,
  };
}

const REPEAT_INTERVALS = [1, 24, 72, 168, 336];

export function calculateWordScore(
  result: AnswerResult,
  currentMasteryLevel: number,
  currentWrongCount: number,
): WordScore {
  let masteryChange = 0;
  let newMasteryLevel: number;
  let reviewPriority = 0;

  if (result.isCorrect) {
    if (result.errorType === "lemma_match") {
      masteryChange = 0.5;
    } else {
      masteryChange = 1;
    }

    if (result.timeSpent <= 3) {
      masteryChange += 0.5;
    }

    newMasteryLevel = Math.min(5, currentMasteryLevel + masteryChange);
    const intervalIndex = Math.min(newMasteryLevel - 1, REPEAT_INTERVALS.length - 1);
    reviewPriority = REPEAT_INTERVALS[Math.max(0, intervalIndex)];
  } else {
    masteryChange = -0.5;

    if (result.errorType === "wrong_word") {
      masteryChange = -1;
    }

    newMasteryLevel = Math.max(0, currentMasteryLevel + masteryChange);
    reviewPriority = 0;

    const newWrongCount = currentWrongCount + 1;

    if (newWrongCount >= 5) {
      reviewPriority = -1;
    }
  }

  return {
    wordId: result.wordId,
    word: result.word,
    masteryChange,
    newMasteryLevel,
    needsReview: newMasteryLevel < 3 || !result.isCorrect,
    reviewPriority,
  };
}

export function calculateBatchWordScores(
  results: AnswerResult[],
  wordProgressMap: Map<string, { masteryLevel: number; wrongCount: number }>,
): WordScore[] {
  return results.map((r) => {
    const progress = wordProgressMap.get(r.wordId) || {
      masteryLevel: 1,
      wrongCount: 0,
    };
    return calculateWordScore(r, progress.masteryLevel, progress.wrongCount);
  });
}
