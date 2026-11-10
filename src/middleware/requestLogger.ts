import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../utils/logger.js";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = performance.now();

  // 1. Trace ID / Correlation ID (read incoming or generate new UUID)
  const incomingId = req.headers["x-request-id"];
  const requestId =
    typeof incomingId === "string" && incomingId.trim().length > 0
      ? incomingId
      : crypto.randomUUID();

  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-Id", requestId);

  // 2. Log when response finishes sending
  res.on("finish", () => {
    const durationMs = Math.round(performance.now() - startTime);
    const { method, originalUrl } = req;
    const statusCode = res.statusCode;

    // Suppress repeated /health logs in production to avoid cluttering monitoring
    if (originalUrl === "/health" && statusCode === 200) {
      return;
    }

    const logPayload = {
      requestId,
      method,
      url: originalUrl,
      statusCode,
      durationMs,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get("user-agent") || "unknown",
    };

    const message = `${method} ${originalUrl} ${statusCode} - ${durationMs}ms`;

    if (statusCode >= 500) {
      logger.error(message, logPayload);
    } else if (statusCode >= 400) {
      logger.warn(message, logPayload);
    } else {
      logger.info(message, logPayload);
    }
  });

  next();
};
