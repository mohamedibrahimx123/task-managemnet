import pg from "pg";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const { Pool } = pg;

const isProduction = env.NODE_ENV === "production";
const isLocalhost =
  env.DATABASE_URL.includes("localhost") ||
  env.DATABASE_URL.includes("127.0.0.1");

// Determine whether SSL should be enabled
export const shouldEnableSSL =
  env.DB_SSL !== undefined ? env.DB_SSL : isProduction && !isLocalhost;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: shouldEnableSSL ? { rejectUnauthorized: false } : false,
  max: isProduction ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Production error handling for idle clients
pool.on("error", (err) => {
  logger.error("Unexpected error on idle PostgreSQL client", { error: err });
});

export const testDatabaseConnection = async (): Promise<void> => {
  try {
    const result = await pool.query("SELECT NOW()");

    logger.info("PostgreSQL connected successfully!", {
      databaseTime: result.rows[0].now,
      sslMode: shouldEnableSSL ? "enabled (encrypted)" : "disabled",
    });
  } catch (error) {
    logger.error("PostgreSQL connection failed", { error });
    throw error;
  }
};

export const closeDatabasePool = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info("PostgreSQL pool closed successfully.");
  } catch (error) {
    logger.error("Error closing PostgreSQL pool", { error });
  }
};
