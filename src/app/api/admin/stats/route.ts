import { NextResponse } from "next/server";

import { apiError, enforceRateLimit, requireAdmin } from "@/lib/api-helpers";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "admin-stats",
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (limited) return limited;

  try {
    const userId = await requireAdmin();
    const [users, words, articles, dictationSessions, writingRecords, auditLogs] =
      await Promise.all([
        prisma.user.count(),
        prisma.word.count(),
        prisma.readingArticle.count(),
        prisma.dictationSession.count(),
        prisma.writingRecord.count(),
        prisma.auditLog.count(),
      ]);

    await writeAuditLog({
      userId,
      action: "read",
      resource: "admin_stats",
      request,
    });

    return NextResponse.json({
      users,
      words,
      articles,
      dictationSessions,
      writingRecords,
      auditLogs,
    });
  } catch (error) {
    return apiError(error, 500, "INTERNAL_ERROR", request);
  }
}
