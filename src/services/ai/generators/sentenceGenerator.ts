import { CET4_SYSTEM_PROMPT, buildSentencePrompt } from "../prompts/templates";
import { generateText } from "../providers";
import { validateAIContent, extractJSON } from "../validators/aiContentValidator";

import type { GeneratedSentence } from "../types";

function buildLocalSentences(
  word: string,
  reason = "AI 例句生成不可用，已使用本地模板",
): GeneratedSentence[] {
  const lower = word.toLowerCase();
  const sentences: GeneratedSentence[] = [];

  sentences.push({
    english: `I think ${lower} is very important for students.`,
    chinese: `我认为${word}对学生来说很重要。`,
    targetWord: word,
    difficulty: 1,
    words: ["think", "important", "students"].concat(lower.split(/\s+/)),
    source: "rule",
    degraded: true,
    degradationReason: reason,
  });

  sentences.push({
    english: `We should learn more about ${lower} every day.`,
    chinese: `我们应该每天多了解${word}。`,
    targetWord: word,
    difficulty: 1,
    words: ["should", "learn", "more", "about", "every", "day"].concat(lower.split(/\s+/)),
    source: "rule",
    degraded: true,
    degradationReason: reason,
  });

  sentences.push({
    english: `${word.charAt(0).toUpperCase() + word.slice(1)} is a good way to improve our skills.`,
    chinese: `${word}是提高我们技能的好方法。`,
    targetWord: word,
    difficulty: 2,
    words: ["good", "way", "improve", "our", "skills"].concat(lower.split(/\s+/)),
    source: "rule",
    degraded: true,
    degradationReason: reason,
  });

  return sentences;
}

export async function generateSentences(params: {
  word: string;
  level?: number;
  topic?: string;
}): Promise<GeneratedSentence[]> {
  const { word } = params;

  try {
    const prompt = buildSentencePrompt(params);

    const response = await generateText({
      messages: [
        { role: "system", content: CET4_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const json = extractJSON(response.text) as Array<{
      english: string;
      chinese: string;
      words: string[];
    }>;

    if (!Array.isArray(json) || json.length === 0) {
      throw new Error("Invalid AI response format");
    }

    const allText = json.map((s) => s.english).join(" ");

    const validation = await validateAIContent(allText, {
      maxOutOfLevelRatio: 0.1,
      maxRetries: 2,
    });

    if (!validation.passed && validation.retryCount >= 2) {
      return buildLocalSentences(word, "AI 例句未通过四级词汇校验，已使用本地模板");
    }

    return json.map((s) => ({
      english: s.english,
      chinese: s.chinese || "",
      targetWord: word,
      difficulty: params.level || 1,
      words: s.words || [],
      source: "ai",
      degraded: false,
    }));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "AI 例句生成不可用";
    return buildLocalSentences(word, reason);
  }
}
