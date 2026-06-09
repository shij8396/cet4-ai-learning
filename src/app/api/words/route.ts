import { NextResponse } from "next/server";

import { getAuthUserId } from "@/lib/api-helpers";
import { parseJsonArray } from "@/lib/json-array";
import { prisma } from "@/lib/prisma";
import { wordsQuerySchema } from "@/lib/validators/wordSchemas";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const parsed = wordsQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { q, page, limit, level, tag, sortBy, sortOrder, includeProgress, includeTotal } =
      parsed.data;

    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { level };

    if (q) {
      where.OR = [{ word: { contains: q } }, { meaning: { contains: q } }];
    }

    if (tag) {
      where.tags = { contains: tag };
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const words = await prisma.word.findMany({
      where: where as never,
      skip,
      take: limit,
      orderBy: [orderBy as never],
    });

    const total = includeTotal ? await prisma.word.count({ where: where as never }) : null;

    const userId = includeProgress ? await getAuthUserId() : null;
    const progressMap = new Map<string, unknown>();

    if (userId && words.length > 0) {
      const progressList = await prisma.userWordProgress.findMany({
        where: {
          userId,
          wordId: { in: words.map((w) => w.id) },
        },
      });

      progressList.forEach((progress) => progressMap.set(progress.wordId, progress));
    }

    return NextResponse.json({
      words: words.map((word) => ({
        ...word,
        tags: parseJsonArray(word.tags),
        progress: progressMap.get(word.id) ?? null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === null ? null : Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
