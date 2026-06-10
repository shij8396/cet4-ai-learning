import { describe, expect, it } from "vitest";

import { buildTodayDashboard, buildWeaknessList } from "../services/studyDashboard";

describe("study dashboard builders", () => {
  it("builds prioritized daily tasks from current progress", () => {
    const dashboard = buildTodayDashboard({
      wordsLearned: 12,
      wordsReviewed: 8,
      articlesRead: 1,
      dictations: 0,
      writingCount: 0,
      studyMinutes: 18,
      weakPointCount: 6,
      dueWordCount: 24,
      unreadArticleCount: 0,
    });

    expect(dashboard.tasks).toHaveLength(4);
    expect(dashboard.tasks.map((task) => task.priority)).toEqual([6, 5, 4, 2]);
    expect(dashboard.tasks.map((task) => task.type)).toEqual([
      "dictation",
      "words",
      "writing",
      "reading",
    ]);
    expect(dashboard.tasks.find((task) => task.type === "reading")?.status).toBe("done");
    expect(dashboard.tasks.find((task) => task.type === "words")?.progress).toBe(20);
    expect(dashboard.tasks.find((task) => task.type === "words")?.source).toBe("review");
    expect(dashboard.tasks.every((task) => Boolean(task.dueAt))).toBe(true);
    expect(dashboard.summary.weakPointCount).toBe(6);
    expect(dashboard.tasks.find((task) => task.type === "words")?.title).toBe("单词复习");
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
      "sophisticated",
      "enviroment",
      "fear",
    ]);
    expect(items.find((item) => item.title === "failure")?.sources).toEqual([
      "单词错题",
      "阅读生词",
    ]);
    expect(items.find((item) => item.title === "failure")?.severity).toBe("high");
    expect(items.find((item) => item.title === "prevent")?.sources).toEqual([
      "阅读生词",
      "默写错误",
      "作文超纲",
    ]);
  });

  it("filters resolved weak points", () => {
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
      readingProgress: [],
      dictationRecords: [],
      writingRecords: [],
      resolvedKeys: ["word:word-1"],
    });

    expect(items).toEqual([]);
  });
});
