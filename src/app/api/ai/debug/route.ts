import { NextResponse } from "next/server";

import {
  getDebugLogs,
  getProviderStats,
  getCacheStats,
  clearDebugLogs,
  invalidateCache,
  getAvailableProviders,
} from "@/services/ai";

export async function GET() {
  try {
    const logs = getDebugLogs(50);
    const stats = getProviderStats();
    const cache = getCacheStats();
    const providers = getAvailableProviders();

    return NextResponse.json({
      logs,
      stats,
      cache,
      providers,
      availableProviders: providers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearDebugLogs();
    invalidateCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
