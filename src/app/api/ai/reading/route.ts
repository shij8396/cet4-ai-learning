import { z } from "zod";

import {
  ApiError,
  apiError,
  apiSuccess,
  enforceRateLimit,
  requireApiAuth,
} from "@/lib/api-helpers";
import { generateReading } from "@/services/ai";
import { getCacheKey, getFromCache, setCache } from "@/services/ai/cache";

const schema = z.object({
  level: z.number().int().min(1).max(5).optional(),
  topic: z.string().max(100).optional(),
  wordCount: z.number().int().min(50).max(500).optional(),
  newWordRatio: z.number().min(0).max(0.5).optional(),
  knownWords: z.array(z.string()).optional(),
  includeQuestions: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const limited = enforceRateLimit(request, {
      key: "ai-reading",
      maxRequests: 20,
      windowMs: 60_000,
    });
    if (limited) return limited;

    await requireApiAuth();

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError("参数校验失败", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }

    const cacheKey = getCacheKey("reading", parsed.data as Record<string, unknown>);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return apiSuccess(cached);
    }

    const result = await generateReading(parsed.data);
    setCache(cacheKey, result, 60 * 60 * 1000);

    return apiSuccess(result);
  } catch (error) {
    return apiError(error, 500, "INTERNAL_ERROR", request);
  }
}
