import { NextResponse } from "next/server";

import { getAuthUserIdOrError, handleApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { wordProgressSchema } from "@/lib/validators/wordSchemas";

function nextManualReviewTime(masteryLevel: number, now = new Date()) {
  const intervalsByMastery = [1, 1, 2, 7, 15, 30];
  const days = intervalsByMastery[Math.max(0, Math.min(5, masteryLevel))];
  const next = new Date(now);
  next.setDate(next.getDate() + days);
  next.setHours(8, 0, 0, 0);
  return next;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthUserIdOrError();
    const { id: wordId } = await params;

    const word = await prisma.word.findUnique({ where: { id: wordId } });
    if (!word) {
      return NextResponse.json({ error: "单词不存在" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = wordProgressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { masteryLevel } = parsed.data;
    const now = new Date();
    const nextReviewTime = nextManualReviewTime(masteryLevel, now);

    const progress = await prisma.userWordProgress.upsert({
      where: { userId_wordId: { userId, wordId } },
      update: {
        masteryLevel,
        lastReviewTime: now,
        nextReviewTime,
      },
      create: {
        userId,
        wordId,
        masteryLevel,
        reviewCount: 0,
        wrongCount: 0,
        lastReviewTime: now,
        nextReviewTime,
      },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    return handleApiError(error);
  }
}
