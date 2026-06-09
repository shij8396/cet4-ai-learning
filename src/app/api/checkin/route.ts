import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.checkIn.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        alreadyCheckedIn: true,
        streak: existing.streak,
        xpBonus: 0,
      });
    }

    let streak = 1;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayCheckIn = await prisma.checkIn.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: yesterday,
        },
      },
    });

    if (yesterdayCheckIn) {
      streak = yesterdayCheckIn.streak + 1;
    }

    const xpBonus = streak >= 7 ? 50 : streak >= 3 ? 25 : 10;

    await prisma.checkIn.create({
      data: {
        userId: session.user.id,
        date: today,
        streak,
        xpBonus,
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        streak,
        xp: { increment: xpBonus },
        lastStudyDate: today,
      },
    });

    return NextResponse.json({
      checkedIn: true,
      streak,
      xpBonus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCheckIn = await prisma.checkIn.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
    });

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30);

    const recentCheckIns = await prisma.checkIn.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      checkedInToday: !!todayCheckIn,
      todayStreak: todayCheckIn?.streak || 0,
      recentCheckIns: recentCheckIns.map((c) => ({
        date: c.date.toISOString().split("T")[0],
        streak: c.streak,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
