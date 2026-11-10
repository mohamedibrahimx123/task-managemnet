import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  // Operational errors (created via AppError)
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`Server Error: ${err.message}`, { error: err });
    } else {
      logger.warn(`Operational Warning: ${err.message}`, {
        statusCode: err.statusCode,
        errors: err.errors,
      });
    }

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(err.errors && {
        errors: err.errors,
      }),
    });
    return;
  }

  // PostgreSQL-specific errors
  if (err && typeof err === "object" && "code" in err) {
    const pgError = err as { code: string; detail?: string };

    // 22P02: invalid input syntax for type (e.g. invalid UUID format)
    if (pgError.code === "22P02") {
      logger.warn("PostgreSQL: Invalid input syntax", { code: pgError.code });
      res.status(400).json({
        status: "fail",
        message: "Invalid input syntax or format",
      });
      return;
    }

    // 23505: unique constraint violation
    if (pgError.code === "23505") {
      logger.warn("PostgreSQL: Unique constraint violation", {
        code: pgError.code,
      });
      res.status(409).json({
        status: "fail",
        message: "A resource with this identifier already exists",
      });
      return;
    }

    // 23503: foreign key constraint violation
    if (pgError.code === "23503") {
      logger.warn("PostgreSQL: Foreign key violation", { code: pgError.code });
      res.status(400).json({
        status: "fail",
        message: "Referenced related resource does not exist",
      });
      return;
    }
  }

  // Unexpected / unhandled programming errors
  logger.error("Unhandled Application Exception", { error: err });

  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
