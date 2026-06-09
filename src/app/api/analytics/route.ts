import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const stats = await prisma.dailyStat.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        masteredWords: true,
        totalWords: true,
        streak: true,
        level: true,
        xp: true,
      },
    });

    const totalStats = await prisma.dailyStat.aggregate({
      where: { userId: session.user.id },
      _sum: {
        wordsLearned: true,
        wordsReviewed: true,
        articlesRead: true,
        dictations: true,
        writingCount: true,
        studyMinutes: true,
        xpGained: true,
      },
    });

    const recentWriting = await prisma.writingRecord.count({
      where: { userId: session.user.id },
    });

    const recentDictation = await prisma.dictationRecord.count({
      where: {
        userId: session.user.id,
        isCorrect: true,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStat = await prisma.dailyStat.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
    });

    return NextResponse.json({
      today: todayStat || {
        wordsLearned: 0,
        wordsReviewed: 0,
        articlesRead: 0,
        dictations: 0,
        writingCount: 0,
        studyMinutes: 0,
        xpGained: 0,
      },
      user: {
        masteredWords: user?.masteredWords || 0,
        totalWords: user?.totalWords || 0,
        streak: user?.streak || 0,
        level: user?.level || 1,
        xp: user?.xp || 0,
      },
      totals: {
        wordsLearned: totalStats._sum.wordsLearned || 0,
        wordsReviewed: totalStats._sum.wordsReviewed || 0,
        articlesRead: totalStats._sum.articlesRead || 0,
        dictations: totalStats._sum.dictations || 0,
        writingCount: totalStats._sum.writingCount || 0,
        studyMinutes: totalStats._sum.studyMinutes || 0,
        xpGained: totalStats._sum.xpGained || 0,
      },
      recentActivity: {
        writingCount: recentWriting,
        dictationCorrect: recentDictation,
      },
      history: stats.map((s) => ({
        date: s.date.toISOString().split("T")[0],
        wordsLearned: s.wordsLearned,
        wordsReviewed: s.wordsReviewed,
        articlesRead: s.articlesRead,
        dictations: s.dictations,
        writingCount: s.writingCount,
        studyMinutes: s.studyMinutes,
        xpGained: s.xpGained,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
