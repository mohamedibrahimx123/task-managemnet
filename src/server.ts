import { app } from "./app.js";
import { testDatabaseConnection, closeDatabasePool } from "./config/database.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const startServer = async (): Promise<void> => {
  try {
    await testDatabaseConnection();

    const server = app.listen(env.PORT, () => {
      logger.info(
        `Server running in ${env.NODE_ENV} mode at http://localhost:${env.PORT}`,
      );
    });

    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info("HTTP server closed.");
        await closeDatabasePool();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
};

void startServer();
