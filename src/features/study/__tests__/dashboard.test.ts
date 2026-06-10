import { describe, expect, it } from "vitest";

import { buildTodayDashboard, buildWeaknessList } from "../services/studyDashboard";

describe("study dashboard builders", () => {
  it("builds four daily tasks from current progress", () => {
    const dashboard = buildTodayDashboard({
      wordsLearned: 12,
      wordsReviewed: 8,
      articlesRead: 1,
      dictations: 0,
      writingCount: 0,
      studyMinutes: 18,
      weakPointCount: 6,
    });

    expect(dashboard.tasks).toHaveLength(4);
    expect(dashboard.tasks.map((task) => task.type)).toEqual([
      "words",
      "reading",
      "dictation",
      "writing",
    ]);
    expect(dashboard.tasks.find((task) => task.type === "reading")?.status).toBe("done");
    expect(dashboard.tasks.find((task) => task.type === "words")?.progress).toBe(20);
    expect(dashboard.summary.weakPointCount).toBe(6);
    expect(dashboard.tasks.find((task) => task.type === "words")?.title).toBe("单词学习");
  });

  it("deduplicates weak points across words, reading, dictation, and writing", () => {
    const items = buildWeaknessList({
      wordProgress: [
        {
          id: "progress-1",
          wordId: "word-1",
          word: "failure",
          meaning: "失败",
          wrongCount: 2,
          masteryLevel: 1,
        },
      ],
      readingProgress: [
        {
          id: "reading-1",
          articleTitle: "Overcoming Fear",
          unknownWords: ["failure", "prevent"],
          clickedWords: ["fear"],
        },
      ],
      dictationRecords: [
        {
          id: "dictation-1",
          word: "prevent",
          correctAnswer: "prevent",
          userAnswer: "prevet",
          isCorrect: false,
        },
      ],
      writingRecords: [
        {
          id: "writing-1",
          title: "Practice Essay",
          outOfLevelWords: ["sophisticated", "prevent"],
          spellingErrors: ["enviroment"],
        },
      ],
    });

    expect(items.map((item) => item.title)).toEqual([
      "failure",
      "prevent",
      "fear",
      "sophisticated",
      "enviroment",
    ]);
    expect(items.find((item) => item.title === "failure")?.sources).toContain("单词错题");
    expect(items.find((item) => item.title === "prevent")?.sources).toEqual([
      "阅读生词",
      "默写错误",
      "作文超纲",
    ]);
  });
});
