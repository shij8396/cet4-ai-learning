import { NextResponse } from "next/server";

import { calculateWordReviewSchedule } from "@/features/study/services/reviewScheduler";
import { getAuthUserIdOrError, handleApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { wordReviewSchema } from "@/lib/validators/wordSchemas";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthUserIdOrError();
    const { id: wordId } = await params;

    const word = await prisma.word.findUnique({ where: { id: wordId } });
    if (!word) {
      return NextResponse.json({ error: "单词不存在" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = wordReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { result, reviewType } = parsed.data;

    const existing = await prisma.userWordProgress.findUnique({
      where: { userId_wordId: { userId, wordId } },
    });

    const progressData = calculateWordReviewSchedule(existing ?? {}, result);

    const reviewRecord = await prisma.wordReviewRecord.create({
      data: {
        userId,
        wordId,
        result,
        reviewType,
      },
    });

    const progress = existing
      ? await prisma.userWordProgress.update({
          where: { id: existing.id },
          data: progressData,
        })
      : await prisma.userWordProgress.create({
          data: {
            userId,
            wordId,
            ...progressData,
          },
        });

    return NextResponse.json({
      review: reviewRecord,
      progress,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
