import { z } from "zod";

import { getAssistantSuggestions } from "@/features/writing/utils/writingAssistant";
import {
  ApiError,
  apiError,
  apiSuccess,
  enforceRateLimit,
  requireApiAuth,
} from "@/lib/api-helpers";

const requestSchema = z.object({
  chineseIdea: z.string().min(1, "请输入中文想法").max(200, "输入过长"),
  maxWords: z.number().int().min(10).max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const limited = enforceRateLimit(request, {
      key: "writing-assistant",
      maxRequests: 60,
      windowMs: 60_000,
    });
    if (limited) return limited;

    await requireApiAuth();

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError("参数校验失败", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }

    return apiSuccess({
      ...getAssistantSuggestions(parsed.data),
      source: "rule",
      degraded: false,
    });
  } catch (error) {
    return apiError(error, 500, "INTERNAL_ERROR", request);
  }
}
