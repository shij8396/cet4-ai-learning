type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  context?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) ??
  (process.env.NODE_ENV === "development" ? "debug" : "warn");

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function createEntry(level: LogLevel, message: string, data?: unknown, context?: string): LogEntry {
  return {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
    context,
  };
}

function formatEntry(entry: LogEntry): string {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${entry.context ? ` [${entry.context}]` : ""}`;
  if (entry.data !== undefined) {
    const dataStr =
      entry.data instanceof Error
        ? `${entry.data.name}: ${entry.data.message}`
        : typeof entry.data === "object"
          ? JSON.stringify(entry.data)
          : String(entry.data);
    return `${prefix} ${entry.message} | ${dataStr}`;
  }
  return `${prefix} ${entry.message}`;
}

const clientLogs: LogEntry[] = [];
const MAX_CLIENT_LOGS = 500;

export const logger = {
  debug(message: string, data?: unknown, context?: string) {
    if (!shouldLog("debug")) return;
    const entry = createEntry("debug", message, data, context);
    if (typeof window === "undefined") {
      console.debug(formatEntry(entry));
    } else {
      clientLogs.push(entry);
      if (clientLogs.length > MAX_CLIENT_LOGS) clientLogs.shift();
    }
  },

  info(message: string, data?: unknown, context?: string) {
    if (!shouldLog("info")) return;
    const entry = createEntry("info", message, data, context);
    if (typeof window === "undefined") {
      console.info(formatEntry(entry));
    } else {
      clientLogs.push(entry);
      if (clientLogs.length > MAX_CLIENT_LOGS) clientLogs.shift();
    }
  },

  warn(message: string, data?: unknown, context?: string) {
    if (!shouldLog("warn")) return;
    const entry = createEntry("warn", message, data, context);
    if (typeof window === "undefined") {
      console.warn(formatEntry(entry));
    } else {
      clientLogs.push(entry);
      if (clientLogs.length > MAX_CLIENT_LOGS) clientLogs.shift();
    }
  },

  error(message: string, error?: unknown, context?: string) {
    const entry = createEntry("error", message, error, context);
    if (typeof window === "undefined") {
      console.error(formatEntry(entry));
      if (error instanceof Error) {
        console.error(error.stack);
      }
    } else {
      clientLogs.push(entry);
      if (clientLogs.length > MAX_CLIENT_LOGS) clientLogs.shift();
    }
  },

  getClientLogs(): LogEntry[] {
    return [...clientLogs];
  },

  clearClientLogs() {
    clientLogs.length = 0;
  },

  getClientLogsByLevel(level: LogLevel): LogEntry[] {
    return clientLogs.filter((log) => log.level === level);
  },
};
