import { NextResponse } from "next/server";

import { apiError, enforceRateLimit, requireAdmin } from "@/lib/api-helpers";
import { writeAuditLog } from "@/lib/audit";
import {
  getDebugLogs,
  getProviderStats,
  getCacheStats,
  clearDebugLogs,
  invalidateCache,
  getAvailableProviders,
} from "@/services/ai";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "ai-debug",
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (limited) return limited;

  try {
    const userId = await requireAdmin();
    const logs = getDebugLogs(50);
    const stats = getProviderStats();
    const cache = getCacheStats();
    const providers = getAvailableProviders();

    await writeAuditLog({
      userId,
      action: "read",
      resource: "ai_debug",
      request,
    });

    return NextResponse.json({
      logs,
      stats,
      cache,
      providers,
      availableProviders: providers,
    });
  } catch (error) {
    return apiError(error, 500, "INTERNAL_ERROR", request);
  }
}

export async function DELETE(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "ai-debug-clear",
    maxRequests: 10,
    windowMs: 60 * 1000,
  });
  if (limited) return limited;

  try {
    const userId = await requireAdmin();
    clearDebugLogs();
    invalidateCache();

    await writeAuditLog({
      userId,
      action: "clear",
      resource: "ai_debug",
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, 500, "INTERNAL_ERROR", request);
  }
}
