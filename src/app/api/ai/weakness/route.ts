import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeWeakness } from "@/services/ai";
import { getFromCache, setCache, getCacheKey } from "@/services/ai/cache";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const cacheKey = getCacheKey("weakness", {
      userId: session.user.id,
    });
    const cached = getFromCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const wrongRecords = await prisma.wordReviewRecord.findMany({
      where: {
        userId: session.user.id,
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
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
