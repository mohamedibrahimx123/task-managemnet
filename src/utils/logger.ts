import { env } from "../config/env.js";

type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogMetadata {
  [key: string]: unknown;
  error?: Error | unknown;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel: LogLevel =
  env.NODE_ENV === "production" ? "info" : "debug";

const formatError = (error: unknown): Record<string, unknown> | undefined => {
  if (!error) return undefined;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return { message: String(error) };
};

const log = (level: LogLevel, message: string, meta?: LogMetadata): void => {
  if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[currentLogLevel]) {
    return;
  }

  const timestamp = new Date().toISOString();

  if (env.NODE_ENV === "production") {
    // Structured JSON Logging for Production & Container Orchestrators
    const entry: Record<string, unknown> = {
      timestamp,
      level,
      message,
      ...meta,
    };

    if (meta?.error) {
      entry.error = formatError(meta.error);
    }

    const jsonOutput = JSON.stringify(entry);

    if (level === "error") {
      console.error(jsonOutput);
    } else if (level === "warn") {
      console.warn(jsonOutput);
    } else {
      console.log(jsonOutput);
    }
  } else {
    // Clean formatted output for Local Development
    const levelIcons: Record<LogLevel, string> = {
      debug: "🔍 [DEBUG]",
      info: "ℹ️  [INFO]",
      warn: "⚠️  [WARN]",
      error: "❌ [ERROR]",
    };

    const prefix = `${timestamp} ${levelIcons[level]}: ${message}`;

    if (meta && Object.keys(meta).length > 0) {
      if (level === "error") {
        console.error(prefix, meta);
      } else if (level === "warn") {
        console.warn(prefix, meta);
      } else {
        console.log(prefix, meta);
      }
    } else {
      if (level === "error") {
        console.error(prefix);
      } else if (level === "warn") {
        console.warn(prefix);
      } else {
        console.log(prefix);
      }
    }
  }
};

export const logger = {
  debug: (message: string, meta?: LogMetadata): void =>
    log("debug", message, meta),
  info: (message: string, meta?: LogMetadata): void =>
    log("info", message, meta),
  warn: (message: string, meta?: LogMetadata): void =>
    log("warn", message, meta),
  error: (message: string, meta?: LogMetadata): void =>
    log("error", message, meta),
};
