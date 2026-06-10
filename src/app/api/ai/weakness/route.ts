import { NextResponse } from "next/server";

import { apiError, enforceRateLimit, requireApiAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { analyzeWeakness } from "@/services/ai";
import { getCacheKey, getFromCache, setCache } from "@/services/ai/cache";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "ai-weakness",
    maxRequests: Number(process.env.AI_RATE_LIMIT_PER_HOUR) || 20,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) return limited;

  try {
    const userId = await requireApiAuth();

    const cacheKey = getCacheKey("weakness", {
      userId,
    });
    const cached = getFromCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const wrongRecords = await prisma.wordReviewRecord.findMany({
      where: {
        userId,
        result: "wrong",
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        word: { select: { word: true } },
        result: true,
        reviewType: true,
      },
    });

    const wordCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();

    for (const record of wrongRecords) {
      const w = record.word.word;
      wordCounts.set(w, (wordCounts.get(w) || 0) + 1);

      const t = record.reviewType || "unknown";
      typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
    }

    const wrongWords = [...wordCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

    const mistakeTypes = [...typeCounts.entries()].map(([type, count]) => ({
      type,
      count,
    }));

    const result = await analyzeWeakness({
      wrongWords,
      mistakeTypes,
      totalAttempts: wrongRecords.length,
    });

    setCache(cacheKey, result, 30 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, 500, "INTERNAL_ERROR", request);
  }
}
