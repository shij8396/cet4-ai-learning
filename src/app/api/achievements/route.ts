import { NextResponse } from "next/server";

import { ACHIEVEMENTS } from "@/features/achievements/achievementDefs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        masteredWords: true,
        streak: true,
        xp: true,
      },
    });

    const totalDictation = await prisma.dictationRecord.count({
      where: {
        userId: session.user.id,
        isCorrect: true,
      },
    });

    const totalReading = await prisma.userReadingProgress.count({
      where: {
        userId: session.user.id,
        isCompleted: true,
      },
    });

    const totalWriting = await prisma.writingRecord.count({
      where: { userId: session.user.id },
    });

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: session.user.id },
    });

    const userProgress: Record<string, number> = {
      streak: user?.streak || 0,
      words: user?.masteredWords || 0,
      reading: totalReading,
      writing: totalWriting,
      dictation: totalDictation,
      xp: user?.xp || 0,
    };

    const categoryProgressMap: Record<string, string> = {
      streak: "streak",
      vocabulary: "words",
      reading: "reading",
      writing: "writing",
      dictation: "dictation",
      general: "xp",
    };

    const achievementsWithProgress = ACHIEVEMENTS.map((def) => {
      const progressKey =
        categoryProgressMap[def.category as keyof typeof categoryProgressMap] || "xp";
      const currentProgress = userProgress[progressKey] || 0;
      const userAch = userAchievements.find((ua) => ua.achievementKey === def.key);

      const progress = Math.min(currentProgress, def.requirement);
      const isUnlocked = userAch?.isUnlocked || currentProgress >= def.requirement;

      return {
        ...def,
        progress,
        isUnlocked: !!isUnlocked,
        unlockedAt: userAch?.unlockedAt?.toISOString() || null,
      };
    });

    const unlocked = achievementsWithProgress.filter((a) => a.isUnlocked);
    const locked = achievementsWithProgress.filter((a) => !a.isUnlocked);
    const total = ACHIEVEMENTS.length;

    return NextResponse.json({
      achievements: [...unlocked, ...locked],
      unlockedCount: unlocked.length,
      totalCount: total,
      completionRate: total > 0 ? Math.round((unlocked.length / total) * 100) : 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { key, progress } = body as { key: string; progress: number };

    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementKey: {
          userId: session.user.id,
          achievementKey: key,
        },
      },
    });

    if (existing) {
      await prisma.userAchievement.update({
        where: { id: existing.id },
        data: { progress },
      });
    } else {
      await prisma.userAchievement.create({
        data: {
          userId: session.user.id,
          achievementKey: key,
          progress,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
