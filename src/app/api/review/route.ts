import { NextResponse } from "next/server";

import { getAuthUserIdOrError, handleApiError } from "@/lib/api-helpers";
import { parseJsonArray } from "@/lib/json-array";
import { prisma } from "@/lib/prisma";
import { type WordType } from "@/types";

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserIdOrError();
    const url = new URL(request.url);
    const rawLimit = Number.parseInt(url.searchParams.get("limit") || "20", 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;
    const now = new Date();

    const [dueWords, masteredCount, totalWords] = await Promise.all([
      prisma.userWordProgress.findMany({
        where: {
          userId,
          nextReviewTime: { lte: now },
        },
        include: { word: true },
        take: limit,
        orderBy: [{ nextReviewTime: "asc" }, { wrongCount: "desc" }],
      }),
      prisma.userWordProgress.count({
        where: { userId, masteryLevel: { gte: 3 } },
      }),
      prisma.word.count({ where: { level: "cet4" } }),
    ]);

    return NextResponse.json({
      dueWords: dueWords.map((progress: { word: unknown }) => ({
        ...progress,
        word: {
          ...(progress.word as WordType),
          tags: parseJsonArray((progress.word as WordType).tags as unknown as string),
        },
      })),
      stats: {
        due: dueWords.length,
        mastered: masteredCount,
        total: totalWords,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
