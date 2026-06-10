import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAvailableProviders } from "@/services/ai";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string | number | string[] }> = {};
  let status = 200;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true };
  } catch (error) {
    status = 503;
    checks.database = {
      ok: false,
      detail: error instanceof Error ? error.message : "database unavailable",
    };
  }

  try {
    const wordCount = await prisma.word.count({ where: { level: "cet4" } });
    checks.vocabulary = { ok: wordCount > 0, detail: wordCount };
    if (wordCount === 0) status = 503;
  } catch (error) {
    status = 503;
    checks.vocabulary = {
      ok: false,
      detail: error instanceof Error ? error.message : "vocabulary unavailable",
    };
  }

  const providers = getAvailableProviders();
  checks.ai = { ok: true, detail: providers };

  return NextResponse.json(
    {
      status: status === 200 ? "ready" : "not_ready",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}
