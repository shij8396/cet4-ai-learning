import { z } from "zod";

import {
  ApiError,
  apiError,
  apiSuccess,
  enforceRateLimit,
  requireApiAuth,
} from "@/lib/api-helpers";
import { getWritingCoachSuggestions } from "@/services/ai";

const schema = z.object({
  originalText: z.string().min(1).max(2000),
  mode: z.enum(["expression", "replacement", "structure", "simplify"]),
});

export async function POST(request: Request) {
  try {
    const limited = enforceRateLimit(request, {
      key: "ai-coach",
      maxRequests: 30,
      windowMs: 60_000,
    });
    if (limited) return limited;

    await requireApiAuth();

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError("参数校验失败", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }

    return apiSuccess(await getWritingCoachSuggestions(parsed.data));
  } catch (error) {
    return apiError(error, 500, "INTERNAL_ERROR", request);
  }
}
