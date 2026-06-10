import {
  buildRecommendationPrompt,
  buildStudyPlanPrompt,
  buildWeaknessAnalysisPrompt,
  CET4_SYSTEM_PROMPT,
} from "../prompts/templates";
import { generateText } from "../providers";
import { extractJSON } from "../validators/aiContentValidator";

import type { DailyPlan, StudyRecommendation, WeaknessReport } from "../types";

function reasonFromError(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "AI service unavailable");
  }
  return "AI service unavailable";
}

function ruleRecommendation(params: {
  userLevel: number;
  weakWords: string[];
  reason?: string;
}): StudyRecommendation {
  return {
    recommendedArticles: [],
    recommendedWords: params.weakWords.slice(0, 5),
    focusAreas: ["vocabulary", "reading", "writing"],
    difficulty: Math.max(1, params.userLevel),
    reason: "基于薄弱词和学习进度生成的规则推荐",
    source: "rule",
    degraded: true,
    degradationReason: params.reason,
  };
}

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
      reason: json.reason || "基于学习进度生成的 AI 推荐",
      source: "ai",
      degraded: false,
    };
  } catch (error) {
    return ruleRecommendation({
      userLevel: params.userLevel,
      weakWords: params.weakWords,
      reason: reasonFromError(error),
    });
  }
}

function ruleDailyPlan(params: {
  weakAreas: string[];
  availableMinutesPerDay: number;
  reason?: string;
}): DailyPlan {
  const minutes = Math.max(20, params.availableMinutesPerDay);
  return {
    date: new Date().toISOString().split("T")[0],
    wordsToLearn: 10,
    wordsToReview: 20,
    readingTask: { title: "每日阅读训练", estimatedTime: Math.min(15, minutes) },
    dictationTask: { wordCount: 10, estimatedTime: 10 },
    writingTask: { topic: "写一段四级主题短文", wordTarget: 120, estimatedTime: 20 },
    totalEstimatedTime: Math.max(40, minutes),
    tips: ["先复习到期词，再学习新词", "阅读后整理生词", "作文优先使用四级核心词"],
    source: "rule",
    degraded: true,
    degradationReason: params.reason,
  };
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
      wordsToLearn: json.wordsToLearn || 10,
      wordsToReview: json.wordsToReview || 20,
      readingTask: {
        title: json.readingTask?.title || "每日阅读训练",
        estimatedTime: json.readingTask?.estimatedTime || 15,
      },
      dictationTask: {
        wordCount: json.dictationTask?.wordCount || 10,
        estimatedTime: json.dictationTask?.estimatedTime || 10,
      },
      writingTask: {
        topic: json.writingTask?.topic || "四级主题短文",
        wordTarget: json.writingTask?.wordTarget || 120,
        estimatedTime: json.writingTask?.estimatedTime || 20,
      },
      totalEstimatedTime: json.totalEstimatedTime || 45,
      tips: json.tips || ["每天保持学习节奏", "优先复习错词"],
      source: "ai",
      degraded: false,
    };
  } catch (error) {
    return ruleDailyPlan({
      weakAreas: params.weakAreas,
      availableMinutesPerDay: params.availableMinutesPerDay,
      reason: reasonFromError(error),
    });
  }
}

function ruleWeaknessReport(
  params: {
    wrongWords: Array<{ word: string; count: number }>;
    mistakeTypes: Array<{ type: string; count: number }>;
  },
  reason?: string,
): WeaknessReport {
  return {
    topErrorWords: params.wrongWords.map((w) => ({
      word: w.word,
      count: w.count,
      type: "spelling",
    })),
    commonMistakeTypes: params.mistakeTypes,
    suggestedExercises: ["重点复习错词", "完成一组听音拼写", "把高频错词加入今日默写"],
    improvementAreas: ["拼写准确度", "词义辨析", "复习节奏"],
    source: "rule",
    degraded: true,
    degradationReason: reason,
  };
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
      improvementAreas: json.improvementAreas || ["拼写准确度", "词汇记忆"],
      source: "ai",
      degraded: false,
    };
  } catch (error) {
    return ruleWeaknessReport(params, reasonFromError(error));
  }
}
