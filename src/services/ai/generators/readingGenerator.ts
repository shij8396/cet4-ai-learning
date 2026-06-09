import { READING_ARTICLES } from "@/features/reading/data/articles";

import { CET4_SYSTEM_PROMPT, buildReadingPrompt, buildQuestionPrompt } from "../prompts/templates";
import { generateText } from "../providers";
import { validateAIContent, extractJSON } from "../validators/aiContentValidator";

import type { GeneratedReading, GeneratedQuestion } from "../types";
import type { ReadingArticleType } from "@/types";

function getLocalArticle(params: { level?: number; topic?: string }): GeneratedReading {
  const { level = 1, topic } = params;

  const matching = READING_ARTICLES.filter((a: ReadingArticleType) => {
    if (topic && !a.tags.some((t: string) => t.includes(topic))) return false;
    return Math.abs(a.level - level) <= 1;
  });

  const article =
    matching.length > 0
      ? matching[Math.floor(Math.random() * matching.length)]
      : READING_ARTICLES[Math.floor(Math.random() * READING_ARTICLES.length)];

  return {
    title: article.title,
    content: article.content,
    level: article.level,
    wordCount: article.wordCount,
    vocabularyCoverage: article.vocabularyCoverage,
    newWords: [],
    questions: [
      {
        id: "q1",
        type: "choice",
        question: `What is the main topic of this article?`,
        options: [article.tags[0] || "A", "B", "C", "D"],
        answer: "A",
        explanation: `文章主要讨论${article.tags.join("、")}`,
      },
    ],
  };
}

export async function generateReading(params: {
  level?: number;
  topic?: string;
  wordCount?: number;
  newWordRatio?: number;
  knownWords?: string[];
  includeQuestions?: boolean;
}): Promise<GeneratedReading> {
  const { includeQuestions = true } = params;

  try {
    const prompt = buildReadingPrompt(params);

    const response = await generateText({
      messages: [
        { role: "system", content: CET4_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const json = extractJSON(response.text) as {
      title: string;
      content: string;
      wordCount: number;
      newWords: string[];
      level: number;
    };

    if (!json.title || !json.content) {
      throw new Error("Invalid AI response format");
    }

    const validation = await validateAIContent(json.content, {
      maxOutOfLevelRatio: 0.05,
      maxRetries: 2,
    });

    const reading: GeneratedReading = {
      title: json.title,
      content: json.content,
      level: json.level || params.level || 1,
      wordCount: json.wordCount || json.content.split(/\s+/).length,
      vocabularyCoverage: validation.coverage,
      newWords: json.newWords || [],
      questions: [],
    };

    if (includeQuestions) {
      try {
        reading.questions = await generateQuestions(reading.title, reading.content);
      } catch {
        reading.questions = [];
      }
    }

    return reading;
  } catch {
    return getLocalArticle(params);
  }
}

async function generateQuestions(title: string, content: string): Promise<GeneratedQuestion[]> {
  const prompt = buildQuestionPrompt({ articleTitle: title, articleContent: content });

  const response = await generateText({
    messages: [
      { role: "system", content: CET4_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  const json = extractJSON(response.text) as Array<{
    id: string;
    type: string;
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }>;

  if (!Array.isArray(json)) return [];

  return json.map((q) => ({
    id: q.id || `q_${Math.random().toString(36).slice(2, 6)}`,
    type: (q.type === "choice" || q.type === "truefalse" || q.type === "fillblank"
      ? q.type
      : "choice") as GeneratedQuestion["type"],
    question: q.question,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation || "",
  }));
}
