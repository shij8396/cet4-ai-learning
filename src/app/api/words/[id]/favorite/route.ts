import { NextResponse } from "next/server";

import { getAuthUserIdOrError, handleApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthUserIdOrError();
    const { id: wordId } = await params;

    const word = await prisma.word.findUnique({ where: { id: wordId } });
    if (!word) {
      return NextResponse.json({ error: "单词不存在" }, { status: 404 });
    }

    const existing = await prisma.userWordProgress.findUnique({
      where: { userId_wordId: { userId, wordId } },
    });

    if (existing) {
      const updated = await prisma.userWordProgress.update({
        where: { id: existing.id },
        data: { isFavorite: !existing.isFavorite },
      });
      return NextResponse.json({
        isFavorite: updated.isFavorite,
        progress: updated,
      });
    }

    const created = await prisma.userWordProgress.create({
      data: {
        userId,
        wordId,
        isFavorite: true,
        masteryLevel: 0,
        reviewCount: 0,
        wrongCount: 0,
      },
    });

    return NextResponse.json({
      isFavorite: true,
      progress: created,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
