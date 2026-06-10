import { NextResponse } from "next/server";

import { apiError, enforceRateLimit, requireApiAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { generateDailyPlan } from "@/services/ai";
import { getCacheKey, getFromCache, setCache } from "@/services/ai/cache";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "ai-plan",
    maxRequests: Number(process.env.AI_RATE_LIMIT_PER_HOUR) || 20,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) return limited;

  try {
    const userId = await requireApiAuth();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        level: true,
        masteredWords: true,
      },
    });

    const cacheKey = getCacheKey("plan", {
      userId,
      date: new Date().toISOString().split("T")[0],
    });
    const cached = getFromCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const totalWords = await prisma.word.count();

    const result = await generateDailyPlan({
      userLevel: user?.level || 1,
      masteredWords: user?.masteredWords || 0,
      totalCET4Words: totalWords,
      weeklyGoal: 50,
      availableMinutesPerDay: 30,
      weakAreas: ["vocabulary"],
    });

    setCache(cacheKey, result, 60 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, 500, "INTERNAL_ERROR", request);
  }
}
