import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

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

    if (!sessionId) {
      return NextResponse.json({ error: "缺少会话ID" }, { status: 400 });
    }

    const record = await prisma.dictationRecord.create({
      data: {
        sessionId,
        userId: authSession.user.id,
        wordId: wordId || null,
        word: word || correctAnswer,
        prompt: prompt || "",
        userAnswer: userAnswer || null,
        correctAnswer: correctAnswer || "",
        isCorrect: isCorrect ?? false,
        type: type || "cn_to_en",
        errorType: errorType || null,
        timeSpent: timeSpent || 0,
      },
    });

    if (isCorrect) {
      await prisma.dictationSession.update({
        where: { id: sessionId },
        data: {
          correctCount: { increment: 1 },
        },
      });
    } else {
      await prisma.dictationSession.update({
        where: { id: sessionId },
        data: {
          wrongCount: { increment: 1 },
        },
      });
    }

    if (wordId) {
      const existingProgress = await prisma.userWordProgress.findUnique({
        where: {
          userId_wordId: {
            userId: authSession.user.id,
            wordId,
          },
        },
      });

      if (existingProgress) {
        await prisma.userWordProgress.update({
          where: {
            userId_wordId: {
              userId: authSession.user.id,
              wordId,
            },
          },
          data: {
            reviewCount: { increment: 1 },
            wrongCount: isCorrect ? undefined : { increment: 1 },
            masteryLevel: isCorrect
              ? Math.min(5, existingProgress.masteryLevel + 0.5)
              : Math.max(0, existingProgress.masteryLevel - 0.5),
            lastReviewTime: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ record });
  } catch {
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
