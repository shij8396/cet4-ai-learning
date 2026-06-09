import { simplifyText } from "@/features/writing/utils/writingAssistant";

import { CET4_SYSTEM_PROMPT, buildWritingCoachPrompt } from "../prompts/templates";
import { generateText } from "../providers";
import { extractJSON } from "../validators/aiContentValidator";

import type { WritingCoachSuggestion } from "../types";

export async function getWritingCoachSuggestions(params: {
  originalText: string;
  mode: "expression" | "replacement" | "structure" | "simplify";
}): Promise<WritingCoachSuggestion[]> {
  const { originalText, mode } = params;

  try {
    const prompt = buildWritingCoachPrompt(params);

    const response = await generateText({
      messages: [
        { role: "system", content: CET4_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const json = extractJSON(response.text) as Array<{
      type: string;
      original: string;
      suggested: string;
      explanation: string;
    }>;

    if (!Array.isArray(json) || json.length === 0) {
      throw new Error("Invalid AI response");
    }

    return json.map((s) => ({
      type: s.type as WritingCoachSuggestion["type"],
      original: s.original || "",
      suggested: s.suggested || "",
      explanation: s.explanation || "",
    }));
  } catch {
    if (mode === "simplify") {
      const result = simplifyText({ originalText });
      return result.changes.map((c) => ({
        type: "simplify" as const,
        original: c.original,
        suggested: c.simplified,
        explanation: c.reason,
      }));
    }

    return [
      {
        type: "expression",
        original: originalText.slice(0, 100),
        suggested: "请尝试使用更简单的表达方式",
        explanation: "建议使用简短的句子和CET4词汇",
      },
    ];
  }
}
