import { z } from "zod";

import {
  ApiError,
  apiError,
  apiSuccess,
  enforceRateLimit,
  requireApiAuth,
} from "@/lib/api-helpers";
import { generateSentences } from "@/services/ai";
import { getCacheKey, getFromCache, setCache } from "@/services/ai/cache";

const schema = z.object({
  word: z.string().min(1).max(50),
  level: z.number().int().min(1).max(5).optional(),
  topic: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const limited = enforceRateLimit(request, {
      key: "ai-sentence",
      maxRequests: 40,
      windowMs: 60_000,
    });
    if (limited) return limited;

    await requireApiAuth();

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError("参数校验失败", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }

    const cacheKey = getCacheKey("sentence", parsed.data as Record<string, unknown>);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return apiSuccess(cached);
    }

    const result = await generateSentences(parsed.data);
    setCache(cacheKey, result, 30 * 60 * 1000);

    return apiSuccess(result);
  } catch (error) {
    return apiError(error, 500, "INTERNAL_ERROR", request);
  }
}
