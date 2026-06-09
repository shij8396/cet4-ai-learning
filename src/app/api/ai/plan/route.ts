import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDailyPlan } from "@/services/ai";
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

    const cacheKey = getCacheKey("plan", {
      userId: session.user.id,
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
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
