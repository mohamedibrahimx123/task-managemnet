import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

// General API rate limiter (protects against general DoS)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Max 100 requests per windowMs per IP
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
  skip: () => env.NODE_ENV === "test", // Skip in automated tests
});

// Stricter rate limiter for Authentication (protects against Brute-force attacks)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Max 10 login/register attempts per windowMs per IP
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    status: "fail",
    message:
      "Too many authentication attempts from this IP, please try again after 15 minutes.",
  },
  skip: () => env.NODE_ENV === "test", // Skip in automated tests
});
