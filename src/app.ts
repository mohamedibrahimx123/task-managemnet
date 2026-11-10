/// <reference path="./utils/express.d.ts" />
import express from "express";
import helmet from "helmet";
import cors from "cors";

import tasksRouter from "./modules/tasks/task.route.js";
import authRoutes from "./modules/auth/auth.route.js";
import userRoutes from "./modules/users/user.routes.js";
import adminRoutes from "./modules/admin/admin.route.js";

import { swaggerSpec } from "./docs/swagger.js";
import { pool } from "./config/database.js";
import { env } from "./config/env.js";

import { requestLogger } from "./middleware/requestLogger.js";
import { globalLimiter, authLimiter } from "./middleware/rateLimiter.js";
import { globalErrorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";

export const app = express();

// 1. Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows CDN resources for Swagger UI
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// 2. CORS (Cross-Origin Resource Sharing)
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(","),
    credentials: true,
  }),
);

// 3. Request Body Size Limit (prevents large payload DoS attacks)
app.use(express.json({ limit: "10kb" }));

// 4. HTTP Request Logger Middleware (with Correlation / Request ID)
app.use(requestLogger);

// 5. Global Rate Limiter for all API routes
app.use("/api", globalLimiter);

// Health Check Endpoint (For Docker / Cloud Monitoring)
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: "disconnected",
    });
  }
});

// Swagger Documentation (JSON Spec)
app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json(swaggerSpec);
});

// Swagger UI (CDN-based for 100% Serverless / Vercel compatibility)
app.get(["/api-docs", "/api-docs/"], (_req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Management API - Swagger UI</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css" />
  <link rel="icon" type="image/png" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/favicon-32x32.png" />
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(swaggerSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// 6. API Routes (Auth routes have strict rate limiting)
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/tasks", tasksRouter);
app.use("/api/v1", adminRoutes);

// Not Found Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
