import { NextResponse } from "next/server";

import { parseJsonArray } from "@/lib/json-array";
import { prisma } from "@/lib/prisma";
import { type WordType } from "@/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const now = new Date();

  const dueWords = await prisma.userWordProgress.findMany({
    where: {
      userId,
      nextReviewTime: { lte: now },
    },
    include: { word: true },
    take: limit,
    orderBy: { nextReviewTime: "asc" },
  });

  const masteredCount = await prisma.userWordProgress.count({
    where: { userId, masteryLevel: { gte: 3 } },
  });

  const totalWords = await prisma.word.count({ where: { level: "cet4" } });

  return NextResponse.json({
    dueWords: dueWords.map((p: { word: unknown }) => ({
      ...p,
      word: {
        ...(p.word as WordType),
        tags: parseJsonArray((p.word as WordType).tags as unknown as string),
      },
    })),
    stats: {
      due: dueWords.length,
      mastered: masteredCount,
      total: totalWords,
    },
  });
}
