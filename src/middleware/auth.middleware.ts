/// <reference path="../utils/express.d.ts" />
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const secret = env.JWT_SECRET;

    // 1. Get Authorization Header
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new AppError(
        "Authentication required",
        401,
      );
    }

    // 2. Extract Bearer Token
    const [scheme, token] = authorization.split(" ");

    if (
      scheme !== "Bearer" ||
      !token ||
      authorization.split(" ").length !== 2
    ) {
      throw new AppError(
        "Invalid authorization format",
        401,
      );
    }

    // 3. Verify JWT
    const decoded = jwt.verify(
      token,
      secret,
      { algorithms: ["HS256"] },
    );

    // 4. Validate Payload
    if (
      typeof decoded === "string" ||
      !decoded.sub ||
      typeof decoded.sub !== "string" ||
      (decoded.role !== "user" &&
        decoded.role !== "admin")
    ) {
      throw new AppError(
        "Invalid token payload",
        401,
      );
    }

    // 5. Attach Authenticated User
    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    // 6. Continue Request
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      next(
        new AppError("Invalid or expired token", 401),
      );
      return;
    }

    next(error);
  }
};
