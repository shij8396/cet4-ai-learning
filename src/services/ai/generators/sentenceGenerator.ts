import { CET4_SYSTEM_PROMPT, buildSentencePrompt } from "../prompts/templates";
import { generateText } from "../providers";
import { validateAIContent, extractJSON } from "../validators/aiContentValidator";

import type { GeneratedSentence } from "../types";

function buildLocalSentences(word: string): GeneratedSentence[] {
  const lower = word.toLowerCase();
  const sentences: GeneratedSentence[] = [];

  sentences.push({
    english: `I think ${lower} is very important for students.`,
    chinese: `我认为${word}对学生来说很重要。`,
    targetWord: word,
    difficulty: 1,
    words: ["think", "important", "students"].concat(lower.split(/\s+/)),
  });

  sentences.push({
    english: `We should learn more about ${lower} every day.`,
    chinese: `我们应该每天多了解${word}。`,
    targetWord: word,
    difficulty: 1,
    words: ["should", "learn", "more", "about", "every", "day"].concat(lower.split(/\s+/)),
  });

  sentences.push({
    english: `${word.charAt(0).toUpperCase() + word.slice(1)} is a good way to improve our skills.`,
    chinese: `${word}是提高我们技能的好方法。`,
    targetWord: word,
    difficulty: 2,
    words: ["good", "way", "improve", "our", "skills"].concat(lower.split(/\s+/)),
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
      return buildLocalSentences(word);
    }

    return json.map((s) => ({
      english: s.english,
      chinese: s.chinese || "",
      targetWord: word,
      difficulty: params.level || 1,
      words: s.words || [],
    }));
  } catch {
    return buildLocalSentences(word);
  }
}
