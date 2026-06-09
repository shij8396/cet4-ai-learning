import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const includeWrong = url.searchParams.get("includeWrong") === "true";

    const wrongWords = await prisma.dictationRecord.findMany({
      where: {
        userId: session.user.id,
        isCorrect: false,
      },
      select: {
        word: true,
      },
      take: 50,
    });

    const wrongWordSet = new Set(wrongWords.map((w) => w.word.toLowerCase()));

    const wordProgress = await prisma.userWordProgress.findMany({
      where: { userId: session.user.id },
      include: {
        word: {
          select: {
            id: true,
            word: true,
            phonetic: true,
            meaning: true,
            partOfSpeech: true,
            example: true,
            exampleCn: true,
          },
        },
      },
      orderBy: [{ masteryLevel: "asc" }, { wrongCount: "desc" }],
      take: limit * 2,
    });

    const words = wordProgress
      .filter((wp) => {
        if (includeWrong && wp.wrongCount === 0) return false;
        return true;
      })
      .slice(0, limit)
      .map((wp) => ({
        wordId: wp.word.id,
        word: wp.word.word,
        meaning: wp.word.meaning,
        phonetic: wp.word.phonetic,
        partOfSpeech: wp.word.partOfSpeech,
        example: wp.word.example,
        exampleCn: wp.word.exampleCn,
        masteryLevel: wp.masteryLevel,
        wrongCount: wp.wrongCount,
        isRecentWrong: wrongWordSet.has(wp.word.word.toLowerCase()),
      }));

    return NextResponse.json({ words });
  } catch {
    return NextResponse.json({ error: "获取单词失败" }, { status: 500 });
  }
}
