import type { SessionScore, WordScore } from "./scoringEngine";

export interface DifficultyProfile {
  targetLevel: number;
  newWordRatio: number;
  wordCount: number;
  timeLimit: number;
  retryAllowed: boolean;
  hintEnabled: boolean;
  exactFormRequired: boolean;
}

export interface UserPerformanceProfile {
  overallAccuracy: number;
  recentAccuracy: number;
  avgResponseTime: number;
  streakDays: number;
  masteredWordCount: number;
  learningWordCount: number;
  recentErrorTypes: string[];
}

const LEVEL_PROFILES: Record<number, DifficultyProfile> = {
  1: {
    targetLevel: 1,
    newWordRatio: 0.5,
    wordCount: 5,
    timeLimit: 60,
    retryAllowed: true,
    hintEnabled: true,
    exactFormRequired: false,
  },
  2: {
    targetLevel: 2,
    newWordRatio: 0.3,
    wordCount: 8,
    timeLimit: 45,
    retryAllowed: true,
    hintEnabled: true,
    exactFormRequired: false,
  },
  3: {
    targetLevel: 3,
    newWordRatio: 0.2,
    wordCount: 10,
    timeLimit: 30,
    retryAllowed: true,
    hintEnabled: false,
    exactFormRequired: false,
  },
  4: {
    targetLevel: 4,
    newWordRatio: 0.15,
    wordCount: 12,
    timeLimit: 20,
    retryAllowed: false,
    hintEnabled: false,
    exactFormRequired: true,
  },
  5: {
    targetLevel: 5,
    newWordRatio: 0.1,
    wordCount: 15,
    timeLimit: 15,
    retryAllowed: false,
    hintEnabled: false,
    exactFormRequired: true,
  },
};

export function determineDifficultyLevel(performance: UserPerformanceProfile): number {
  if (performance.recentAccuracy >= 0.9 && performance.masteredWordCount >= 500) {
    return 5;
  }
  if (performance.recentAccuracy >= 0.8 && performance.masteredWordCount >= 300) {
    return 4;
  }
  if (performance.recentAccuracy >= 0.7 && performance.masteredWordCount >= 150) {
    return 3;
  }
  if (performance.recentAccuracy >= 0.5) {
    return 2;
  }
  return 1;
}

export function getDifficultyProfile(
  level: number,
  customAdjustments: Partial<DifficultyProfile> = {},
): DifficultyProfile {
  const baseProfile = LEVEL_PROFILES[Math.min(5, Math.max(1, level))];
  return { ...baseProfile, ...customAdjustments };
}

export function adjustDifficultyAfterSession(
  sessionScore: SessionScore,
  currentLevel: number,
): { newLevel: number; reason: string } {
  const { accuracy, avgTimePerWord } = sessionScore;

  if (accuracy >= 0.95 && avgTimePerWord <= 3 && currentLevel < 5) {
    return {
      newLevel: currentLevel + 1,
      reason: "优秀表现，难度提升",
    };
  }

  if (accuracy >= 0.85 && currentLevel < 5) {
    return {
      newLevel: Math.min(5, currentLevel + 1),
      reason: "良好表现，适当提升",
    };
  }

  if (accuracy <= 0.3 && currentLevel > 1) {
    return {
      newLevel: currentLevel - 1,
      reason: "正确率低，难度降低",
    };
  }

  if (accuracy <= 0.5 && currentLevel > 1) {
    return {
      newLevel: Math.max(1, currentLevel - 1),
      reason: "需要巩固，难度降低",
    };
  }

  return {
    newLevel: currentLevel,
    reason: "保持当前难度",
  };
}

export function calculateNextReviewInterval(wordScores: WordScore[]): Map<string, number> {
  const intervals = new Map<string, number>();

  for (const ws of wordScores) {
    const baseInterval = ws.newMasteryLevel >= 4 ? 72 : ws.newMasteryLevel >= 3 ? 24 : 1;

    intervals.set(ws.wordId, ws.reviewPriority > 0 ? ws.reviewPriority : baseInterval);
  }

  return intervals;
}

export function shouldRepeatWord(
  wordScore: WordScore,
  maxRepeats: number = 3,
  currentRepeats: number = 0,
): boolean {
  if (currentRepeats >= maxRepeats) return false;
  if (wordScore.newMasteryLevel <= 1) return true;
  if (!wordScore.needsReview && currentRepeats >= 1) return false;
  return true;
}
