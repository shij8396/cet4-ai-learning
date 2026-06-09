import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const words = await prisma.word.findMany({
    select: { word: true },
    orderBy: { word: "asc" },
  });

  return NextResponse.json({
    words: words.map((w: { word: string }) => w.word),
    total: words.length,
  });
}
