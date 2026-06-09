import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRecommendations } from "@/services/ai";
import { getFromCache, setCache, getCacheKey } from "@/services/ai/cache";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        level: true,
        masteredWords: true,
      },
    });

    const wrongWords = await prisma.wordReviewRecord.findMany({
      where: {
        userId: session.user.id,
        result: "wrong",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { word: { select: { word: true } } },
      distinct: ["wordId"],
    });

    const weakWordList = wrongWords.map((r) => r.word.word);

    const cacheKey = getCacheKey("recommend", {
      userId: session.user.id,
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
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
