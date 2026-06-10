import { NextResponse } from "next/server";

import { calculateWordReviewSchedule } from "@/features/study/services/reviewScheduler";
import { getAuthUserIdOrError, handleApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserIdOrError();
    const body = await request.json();
    const {
      sessionId,
      wordId,
      word,
      prompt,
      userAnswer,
      correctAnswer,
      isCorrect,
      type,
      errorType,
      timeSpent,
    } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "缺少会话 ID" }, { status: 400 });
    }

    const session = await prisma.dictationSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });

    if (!session) {
      return NextResponse.json({ error: "默写会话不存在或无权访问" }, { status: 404 });
    }

    const normalizedIsCorrect = Boolean(isCorrect);
    const existingProgress =
      typeof wordId === "string" && wordId
        ? await prisma.userWordProgress.findUnique({
            where: {
              userId_wordId: {
                userId,
                wordId,
              },
            },
          })
        : null;

    const [record] = await prisma.$transaction(async (tx) => {
      const createdRecord = await tx.dictationRecord.create({
        data: {
          sessionId,
          userId,
          wordId: typeof wordId === "string" && wordId ? wordId : null,
          word: word || correctAnswer || "",
          prompt: prompt || "",
          userAnswer: userAnswer || null,
          correctAnswer: correctAnswer || "",
          isCorrect: normalizedIsCorrect,
          type: type || "cn_to_en",
          errorType: errorType || null,
          timeSpent: Number.isFinite(Number(timeSpent)) ? Number(timeSpent) : 0,
        },
      });

      await tx.dictationSession.update({
        where: { id: sessionId },
        data: normalizedIsCorrect
          ? { correctCount: { increment: 1 } }
          : { wrongCount: { increment: 1 } },
      });

      if (typeof wordId === "string" && wordId) {
        const linkedWord = await tx.word.findUnique({
          where: { id: wordId },
          select: { id: true },
        });

        if (linkedWord) {
          const progressData = calculateWordReviewSchedule(
            existingProgress ?? {},
            normalizedIsCorrect ? "correct" : "wrong",
          );

          if (existingProgress) {
            await tx.userWordProgress.update({
              where: {
                userId_wordId: {
                  userId,
                  wordId,
                },
              },
              data: progressData,
            });
          } else {
            await tx.userWordProgress.create({
              data: {
                userId,
                wordId,
                ...progressData,
              },
            });
          }
        }
      }

      return [createdRecord];
    });

    return NextResponse.json({ record });
  } catch (error) {
    return handleApiError(error);
  }
}
