import { NextResponse } from "next/server";

import { getAuthUserIdOrError, handleApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { wordProgressSchema, getNextReviewDate } from "@/lib/validators/wordSchemas";

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

    const existing = await prisma.userWordProgress.findUnique({
      where: { userId_wordId: { userId, wordId } },
    });

    const now = new Date();
    const nextReviewTime = getNextReviewDate(existing ? existing.reviewCount : 0);

    if (existing) {
      const updated = await prisma.userWordProgress.update({
        where: { id: existing.id },
        data: {
          masteryLevel,
          lastReviewTime: now,
          nextReviewTime,
        },
      });
      return NextResponse.json({ progress: updated });
    }

    const created = await prisma.userWordProgress.create({
      data: {
        userId,
        wordId,
        masteryLevel,
        reviewCount: 0,
        wrongCount: 0,
        lastReviewTime: now,
        nextReviewTime,
      },
    });

    return NextResponse.json({ progress: created });
  } catch (error) {
    return handleApiError(error);
  }
}
