import type { DebugLog } from "./types";

const MAX_LOGS = 200;
const logs: DebugLog[] = [];

export function addDebugLog(log: Omit<DebugLog, "id" | "timestamp">): void {
  logs.unshift({
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  });

  if (logs.length > MAX_LOGS) {
    logs.length = MAX_LOGS;
  }
}

export function getDebugLogs(limit = 50): DebugLog[] {
  return logs.slice(0, limit);
}

export function getProviderStats(): Record<
  string,
  { calls: number; totalTokens: number; avgLatency: number; errors: number }
> {
  const stats: Record<
    string,
    { calls: number; totalTokens: number; avgLatency: number; errors: number }
  > = {};

  for (const log of logs) {
    const key = `${log.provider}:${log.model}`;
    if (!stats[key]) {
      stats[key] = { calls: 0, totalTokens: 0, avgLatency: 0, errors: 0 };
    }
    stats[key].calls++;
    stats[key].totalTokens += log.tokens.total;
    stats[key].avgLatency += log.latency;
    if (!log.validated) stats[key].errors++;
  }

  for (const key of Object.keys(stats)) {
    stats[key].avgLatency = Math.round(stats[key].avgLatency / stats[key].calls);
  }

  return stats;
}

export function clearDebugLogs(): void {
  logs.length = 0;
}
