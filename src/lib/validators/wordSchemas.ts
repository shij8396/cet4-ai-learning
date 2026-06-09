import { z } from "zod";

const booleanQuerySchema = z
  .preprocess((value) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false || value === undefined) return false;
    return value;
  }, z.boolean())
  .default(false);

export const wordsQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  level: z.string().default("cet4"),
  tag: z.string().optional(),
  sortBy: z.enum(["frequency", "word", "createdAt"]).default("frequency"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  includeProgress: booleanQuerySchema,
  includeTotal: booleanQuerySchema,
});

export type WordsQuery = z.infer<typeof wordsQuerySchema>;

export const wordProgressSchema = z.object({
  masteryLevel: z.number().int().min(0).max(5),
});

export type WordProgressInput = z.infer<typeof wordProgressSchema>;

export const wordReviewSchema = z.object({
  result: z.enum(["correct", "wrong", "skip"]),
  reviewType: z.enum(["recognition", "dictation", "recall"]).default("recognition"),
});

export type WordReviewInput = z.infer<typeof wordReviewSchema>;

export const wordIdSchema = z.object({
  id: z.string().min(1, "单词ID不能为空"),
});

export const ebbinghausIntervals = [0, 1, 2, 4, 7, 15, 30];

export function getNextReviewDate(reviewCount: number): Date {
  const intervalIndex = Math.min(reviewCount, ebbinghausIntervals.length - 1);
  const days = ebbinghausIntervals[intervalIndex];
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + days);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}
