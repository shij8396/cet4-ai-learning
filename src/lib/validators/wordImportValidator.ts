import type { CET4WordImport } from "@/types";

const WORD_PATTERN = /^[a-zA-Z]+(-[a-zA-Z]+)*$/;
const MEANING_MIN_LENGTH = 2;

export interface WordValidationError {
  word: string;
  errors: string[];
}

export function validateWordImport(data: unknown): {
  valid: CET4WordImport | null;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: null, errors: ["数据格式无效"] };
  }

  const item = data as Record<string, unknown>;

  if (typeof item.word !== "string" || !item.word.trim()) {
    errors.push("缺少word字段");
  } else if (!WORD_PATTERN.test(item.word.trim())) {
    errors.push(`单词格式无效: ${item.word}`);
  }

  if (typeof item.meaning !== "string" || item.meaning.trim().length < MEANING_MIN_LENGTH) {
    errors.push("缺少meaning字段或过短");
  }

  if (item.phonetic !== undefined && typeof item.phonetic !== "string") {
    errors.push("phonetic必须为字符串");
  }

  if (item.partOfSpeech !== undefined && typeof item.partOfSpeech !== "string") {
    errors.push("partOfSpeech必须为字符串");
  }

  if (item.frequency !== undefined) {
    const freq = Number(item.frequency);
    if (isNaN(freq) || freq < 0 || freq > 10) {
      errors.push("frequency必须在0-10之间");
    }
  }

  if (item.tags !== undefined) {
    if (!Array.isArray(item.tags)) {
      errors.push("tags必须是数组");
    } else if (!item.tags.every((t: unknown) => typeof t === "string")) {
      errors.push("tags数组中所有元素必须是字符串");
    }
  }

  if (errors.length > 0) {
    return { valid: null, errors };
  }

  return {
    valid: {
      word: (item.word as string).trim().toLowerCase(),
      phonetic: item.phonetic as string | undefined,
      meaning: (item.meaning as string).trim(),
      partOfSpeech: item.partOfSpeech as string | undefined,
      frequency: item.frequency !== undefined ? Number(item.frequency) : 1,
      example: item.example as string | undefined,
      exampleCn: item.exampleCn as string | undefined,
      tags: item.tags as string[] | undefined,
    },
    errors: [],
  };
}

export function validateWordBatch(data: unknown[]): {
  valid: CET4WordImport[];
  invalid: WordValidationError[];
} {
  const valid: CET4WordImport[] = [];
  const invalid: WordValidationError[] = [];

  for (const item of data) {
    const result = validateWordImport(item);
    if (result.valid) {
      valid.push(result.valid);
    } else {
      invalid.push({
        word: ((item as Record<string, unknown>).word as string) || "unknown",
        errors: result.errors,
      });
    }
  }

  return { valid, invalid };
}

export function deduplicateWords(words: CET4WordImport[]): CET4WordImport[] {
  const seen = new Set<string>();
  return words.filter((w) => {
    const key = w.word.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
