import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { type, totalWords } = body;

    const dictationSession = await prisma.dictationSession.create({
      data: {
        userId: session.user.id,
        type: type || "cn_to_en",
        totalWords: totalWords || 0,
      },
    });

    return NextResponse.json({ session: dictationSession });
  } catch {
    return NextResponse.json({ error: "创建会话失败" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const sessions = await prisma.dictationSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        _count: {
          select: { records: true },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ error: "获取记录失败" }, { status: 500 });
  }
}
