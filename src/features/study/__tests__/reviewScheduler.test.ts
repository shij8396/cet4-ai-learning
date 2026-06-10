import { describe, expect, it } from "vitest";

import { calculateWordReviewSchedule } from "../services/reviewScheduler";

const NOW = new Date("2026-06-10T08:00:00.000Z");

describe("calculateWordReviewSchedule", () => {
  it("moves correct answers forward with an integer mastery level", () => {
    const schedule = calculateWordReviewSchedule(
      { masteryLevel: 2, reviewCount: 2, wrongCount: 0 },
      "correct",
      NOW,
    );

    expect(schedule.masteryLevel).toBe(3);
    expect(schedule.reviewCount).toBe(3);
    expect(schedule.wrongCount).toBe(0);
    expect(Number.isInteger(schedule.masteryLevel)).toBe(true);
    expect(schedule.nextReviewTime.getTime()).toBeGreaterThan(NOW.getTime());
  });

  it("schedules wrong answers for same-day repair and records the mistake", () => {
    const schedule = calculateWordReviewSchedule(
      { masteryLevel: 3, reviewCount: 4, wrongCount: 1 },
      "wrong",
      NOW,
    );

    expect(schedule.masteryLevel).toBe(2);
    expect(schedule.reviewCount).toBe(5);
    expect(schedule.wrongCount).toBe(2);
    expect(schedule.nextReviewTime.toISOString()).toBe("2026-06-10T12:00:00.000Z");
  });

  it("keeps skipped words near the front of the queue", () => {
    const schedule = calculateWordReviewSchedule(
      { masteryLevel: 4, reviewCount: 3, wrongCount: 0 },
      "skip",
      NOW,
    );

    expect(schedule.masteryLevel).toBe(4);
    expect(schedule.reviewCount).toBe(4);
    expect(schedule.wrongCount).toBe(0);
    expect(schedule.nextReviewTime.toISOString()).toBe("2026-06-10T20:00:00.000Z");
  });
});
