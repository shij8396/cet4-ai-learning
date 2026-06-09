import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [users, words, articles, dictationSessions, writingRecords] = await Promise.all([
      prisma.user.count(),
      prisma.word.count(),
      prisma.readingArticle.count(),
      prisma.dictationSession.count(),
      prisma.writingRecord.count(),
    ]);

    return NextResponse.json({
      users,
      words,
      articles,
      dictationSessions,
      writingRecords,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
