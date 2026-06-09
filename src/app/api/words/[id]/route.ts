import { NextResponse } from "next/server";

import { getAuthUserId } from "@/lib/api-helpers";
import { parseJsonArray } from "@/lib/json-array";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const word = await prisma.word.findUnique({
      where: { id },
    });

    if (!word) {
      return NextResponse.json({ error: "单词不存在" }, { status: 404 });
    }

    const userId = await getAuthUserId();

    let progress = null;
    if (userId) {
      progress = await prisma.userWordProgress.findUnique({
        where: {
          userId_wordId: { userId, wordId: id },
        },
      });
    }

    return NextResponse.json({
      ...word,
      tags: parseJsonArray(word.tags),
      progress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
