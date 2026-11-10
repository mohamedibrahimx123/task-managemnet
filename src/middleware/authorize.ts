/// <reference path="../utils/express.d.ts" />
import type { RequestHandler } from "express";

import { AppError } from "../utils/AppError.js";

type UserRole = "user" | "admin";

export const authorize = (...allowedRoles: UserRole[]): RequestHandler => {
  return (req, _res, next) => {
    // 1. Ensure user is authenticated
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    // 2. Check user role
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }

    // 3. Continue to the next middleware
    next();
  };
};
