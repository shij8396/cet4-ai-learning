export type ReviewResult = "correct" | "wrong" | "skip";

export interface WordReviewState {
  masteryLevel?: number | null;
  reviewCount?: number | null;
  wrongCount?: number | null;
}

export interface WordReviewSchedule {
  masteryLevel: number;
  reviewCount: number;
  wrongCount: number;
  nextReviewTime: Date;
  lastReviewTime: Date;
}

const REVIEW_INTERVAL_DAYS = [1, 2, 4, 7, 15, 30, 60];

function addHours(date: Date, hours: number) {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(8, 0, 0, 0);
  return next;
}

function clampMastery(level: number) {
  return Math.max(0, Math.min(5, level));
}

export function calculateWordReviewSchedule(
  state: WordReviewState,
  result: ReviewResult,
  now = new Date(),
): WordReviewSchedule {
  const currentMastery = clampMastery(Math.trunc(state.masteryLevel ?? 0));
  const reviewCount = Math.max(0, Math.trunc(state.reviewCount ?? 0)) + 1;
  const wrongCount = Math.max(0, Math.trunc(state.wrongCount ?? 0)) + (result === "wrong" ? 1 : 0);

  if (result === "wrong") {
    return {
      masteryLevel: clampMastery(currentMastery - 1),
      reviewCount,
      wrongCount,
      lastReviewTime: now,
      nextReviewTime: addHours(now, 4),
    };
  }

  if (result === "skip") {
    return {
      masteryLevel: currentMastery,
      reviewCount,
      wrongCount,
      lastReviewTime: now,
      nextReviewTime: addHours(now, 12),
    };
  }

  const masteryLevel = clampMastery(currentMastery + 1);
  const stabilityIndex = Math.min(
    REVIEW_INTERVAL_DAYS.length - 1,
    Math.max(0, masteryLevel - 1 + Math.floor(reviewCount / 3)),
  );
  const errorPenalty = Math.min(3, wrongCount);
  const intervalDays = Math.max(1, REVIEW_INTERVAL_DAYS[stabilityIndex] - errorPenalty);

  return {
    masteryLevel,
    reviewCount,
    wrongCount,
    lastReviewTime: now,
    nextReviewTime: addDays(now, intervalDays),
  };
}
