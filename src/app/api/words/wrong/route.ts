import { NextResponse } from "next/server";

import { getAuthUserIdOrError, handleApiError } from "@/lib/api-helpers";
import { parseJsonArray } from "@/lib/json-array";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserIdOrError();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const [progressList, total] = await Promise.all([
      prisma.userWordProgress.findMany({
        where: { userId, wrongCount: { gt: 0 } },
        include: { word: true },
        skip,
        take: limit,
        orderBy: { wrongCount: "desc" },
      }),
      prisma.userWordProgress.count({
        where: { userId, wrongCount: { gt: 0 } },
      }),
    ]);

    const words = progressList.map((p) => ({
      ...p.word,
      tags: parseJsonArray(p.word.tags),
      progress: {
        id: p.id,
        masteryLevel: p.masteryLevel,
        reviewCount: p.reviewCount,
        wrongCount: p.wrongCount,
        isFavorite: p.isFavorite,
        lastReviewTime: p.lastReviewTime,
        nextReviewTime: p.nextReviewTime,
      },
    }));

    return NextResponse.json({
      words,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
