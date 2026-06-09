import {
  buildRecommendationPrompt,
  buildStudyPlanPrompt,
  buildWeaknessAnalysisPrompt,
  CET4_SYSTEM_PROMPT,
} from "../prompts/templates";
import { generateText } from "../providers";
import { extractJSON } from "../validators/aiContentValidator";

import type { StudyRecommendation, DailyPlan, WeaknessReport } from "../types";

export async function getRecommendations(params: {
  userLevel: number;
  masteredWords: number;
  weakWords: string[];
  recentTopics: string[];
  readingSpeed: number;
  writingScore: number | null;
}): Promise<StudyRecommendation> {
  try {
    const prompt = buildRecommendationPrompt(params);

    const response = await generateText({
      messages: [
        { role: "system", content: CET4_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const json = extractJSON(response.text) as {
      focusAreas: string[];
      difficulty: number;
      reason: string;
    };

    return {
      recommendedArticles: [],
      recommendedWords: params.weakWords.slice(0, 5),
      focusAreas: json.focusAreas || ["vocabulary", "reading"],
      difficulty: json.difficulty || params.userLevel,
      reason: json.reason || "基于你的学习进度推荐",
    };
  } catch {
    return {
      recommendedArticles: [],
      recommendedWords: params.weakWords.slice(0, 5),
      focusAreas: ["vocabulary", "reading", "writing"],
      difficulty: Math.max(1, params.userLevel),
      reason: "基于你的弱项分析推荐",
    };
  }
}

export async function generateDailyPlan(params: {
  userLevel: number;
  masteredWords: number;
  totalCET4Words: number;
  weeklyGoal: number;
  availableMinutesPerDay: number;
  weakAreas: string[];
}): Promise<DailyPlan> {
  try {
    const prompt = buildStudyPlanPrompt(params);

    const response = await generateText({
      messages: [
        { role: "system", content: CET4_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const json = extractJSON(response.text) as {
      wordsToLearn: number;
      wordsToReview: number;
      readingTask: { title: string; estimatedTime: number };
      dictationTask: { wordCount: number; estimatedTime: number };
      writingTask: { topic: string; wordTarget: number; estimatedTime: number };
      totalEstimatedTime: number;
      tips: string[];
    };

    return {
      date: new Date().toISOString().split("T")[0],
      wordsToLearn: json.wordsToLearn || 5,
      wordsToReview: json.wordsToReview || 10,
      readingTask: {
        title: json.readingTask?.title || "每日阅读",
        estimatedTime: json.readingTask?.estimatedTime || 15,
      },
      dictationTask: {
        wordCount: json.dictationTask?.wordCount || 10,
        estimatedTime: json.dictationTask?.estimatedTime || 10,
      },
      writingTask: {
        topic: json.writingTask?.topic || "每日日记",
        wordTarget: json.writingTask?.wordTarget || 50,
        estimatedTime: json.writingTask?.estimatedTime || 15,
      },
      totalEstimatedTime: json.totalEstimatedTime || 40,
      tips: json.tips || ["每天坚持学习", "复习比学习新词更重要"],
    };
  } catch {
    return {
      date: new Date().toISOString().split("T")[0],
      wordsToLearn: 5,
      wordsToReview: 10,
      readingTask: { title: "每日阅读练习", estimatedTime: 15 },
      dictationTask: { wordCount: 10, estimatedTime: 10 },
      writingTask: { topic: "写一段日记", wordTarget: 50, estimatedTime: 15 },
      totalEstimatedTime: 40,
      tips: ["每天坚持学习", "复习比学新词更重要", "多读多写多练"],
    };
  }
}

export async function analyzeWeakness(params: {
  wrongWords: Array<{ word: string; count: number }>;
  mistakeTypes: Array<{ type: string; count: number }>;
  totalAttempts: number;
}): Promise<WeaknessReport> {
  try {
    const prompt = buildWeaknessAnalysisPrompt(params);

    const response = await generateText({
      messages: [
        { role: "system", content: CET4_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const json = extractJSON(response.text) as {
      commonMistakeTypes: Array<{ type: string; count: number }>;
      suggestedExercises: string[];
      improvementAreas: string[];
    };

    return {
      topErrorWords: params.wrongWords.map((w) => ({
        word: w.word,
        count: w.count,
        type: "spelling",
      })),
      commonMistakeTypes: json.commonMistakeTypes || params.mistakeTypes,
      suggestedExercises: json.suggestedExercises || ["重点复习错词", "多做拼写练习"],
      improvementAreas: json.improvementAreas || ["拼写准确性", "词汇记忆"],
    };
  } catch {
    return {
      topErrorWords: params.wrongWords.map((w) => ({
        word: w.word,
        count: w.count,
        type: "spelling",
      })),
      commonMistakeTypes: params.mistakeTypes,
      suggestedExercises: ["重点复习错词", "多做听写练习"],
      improvementAreas: ["拼写准确性"],
    };
  }
}
