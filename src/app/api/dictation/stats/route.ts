import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const totalSessions = await prisma.dictationSession.count({
      where: { userId: session.user.id },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaySessions = await prisma.dictationSession.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: todayStart },
      },
      select: {
        totalWords: true,
        correctCount: true,
        wrongCount: true,
        duration: true,
      },
    });

    const todayWords = todaySessions.reduce((s, sess) => s + sess.totalWords, 0);
    const todayCorrect = todaySessions.reduce((s, sess) => s + sess.correctCount, 0);
    const todayWrong = todaySessions.reduce((s, sess) => s + sess.wrongCount, 0);
    const todayAccuracy = todayWords > 0 ? todayCorrect / todayWords : 0;

    const todayRecords = await prisma.dictationRecord.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: todayStart },
        isCorrect: false,
      },
      select: {
        word: true,
        correctAnswer: true,
        errorType: true,
      },
      take: 20,
    });

    const errorBreakdown: Record<string, number> = {};
    for (const r of todayRecords) {
      const key = r.errorType || "unknown";
      errorBreakdown[key] = (errorBreakdown[key] || 0) + 1;
    }

    const wrongWords = todayRecords.map((r) => ({
      word: r.word,
      correctAnswer: r.correctAnswer,
    }));

    const recentSessions = await prisma.dictationSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 7,
      select: {
        totalWords: true,
        correctCount: true,
        createdAt: true,
      },
    });

    const weeklyStats = recentSessions.reduce(
      (acc, sess) => ({
        total: acc.total + sess.totalWords,
        correct: acc.correct + sess.correctCount,
      }),
      { total: 0, correct: 0 },
    );

    return NextResponse.json({
      totalSessions,
      today: {
        words: todayWords,
        correct: todayCorrect,
        wrong: todayWrong,
        accuracy: Math.round(todayAccuracy * 100),
      },
      errorBreakdown,
      wrongWords,
      weeklyStats: {
        words: weeklyStats.total,
        accuracy:
          weeklyStats.total > 0 ? Math.round((weeklyStats.correct / weeklyStats.total) * 100) : 0,
      },
    });
  } catch {
    return NextResponse.json({ error: "获取统计失败" }, { status: 500 });
  }
}
