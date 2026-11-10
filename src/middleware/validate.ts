import type {
  Request,
  Response,
  NextFunction,
} from "express";

import type { ZodSchema, ZodIssue } from "zod";
import { AppError } from "../utils/AppError.js";

const formatZodErrors = (issues: ZodIssue[]) => {
  return issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : "general",
    message: issue.message,
  }));
};

export const validateBody = (schema: ZodSchema) => {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
        new AppError(
          "Validation failed",
          400,
          formatZodErrors(result.error.issues),
        ),
      );
      return;
    }

    req.body = result.data;
    next();
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      next(
        new AppError(
          "Invalid URL parameters",
          400,
          formatZodErrors(result.error.issues),
        ),
      );
      return;
    }

    req.params = result.data as Record<string, string>;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      next(
        new AppError(
          "Invalid query parameters",
          400,
          formatZodErrors(result.error.issues),
        ),
      );
      return;
    }

    // Express 5 defines req.query as a getter on IncomingMessage prototype; define property directly on req instance.
    Object.defineProperty(req, "query", {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    next();
  };
};
