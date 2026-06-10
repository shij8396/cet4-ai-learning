import { NextResponse } from "next/server";

import { apiError, enforceRateLimit, requireApiAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { getRecommendations } from "@/services/ai";
import { getCacheKey, getFromCache, setCache } from "@/services/ai/cache";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "ai-recommend",
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

    const wrongWords = await prisma.wordReviewRecord.findMany({
      where: {
        userId,
        result: "wrong",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { word: { select: { word: true } } },
      distinct: ["wordId"],
    });

    const weakWordList = wrongWords.map((r) => r.word.word);

    const cacheKey = getCacheKey("recommend", {
      userId,
      level: user?.level || 1,
    });
    const cached = getFromCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const result = await getRecommendations({
      userLevel: user?.level || 1,
      masteredWords: user?.masteredWords || 0,
      weakWords: weakWordList,
      recentTopics: [],
      readingSpeed: 0,
      writingScore: null,
    });

    setCache(cacheKey, result, 15 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, 500, "INTERNAL_ERROR", request);
  }
}
