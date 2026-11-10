import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool, closeDatabasePool } from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runMigrations = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    console.log("=== RUNNING DATABASE MIGRATIONS ===");

    // 1. Create migrations tracking table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Fetch already applied migrations
    const appliedRes = await client.query<{ name: string }>(
      "SELECT name FROM schema_migrations;",
    );
    const appliedSet = new Set(appliedRes.rows.map((r) => r.name));

    // Handle existing tables check if this is an existing database
    const tablesRes = await client.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'tasks');
    `);
    const existingTables = new Set(tablesRes.rows.map((r) => r.table_name));

    // 3. Locate migration directory (supports both src and dist/production)
    let migrationDir = __dirname;
    let files: string[] = [];
    try {
      files = await fs.readdir(migrationDir);
    } catch {
      files = [];
    }

    let sqlFiles = files.filter((file) => file.endsWith(".sql")).sort();

    if (sqlFiles.length === 0) {
      const fallbackDir = path.resolve(process.cwd(), "src/database");
      try {
        const fallbackFiles = await fs.readdir(fallbackDir);
        const found = fallbackFiles.filter((file) => file.endsWith(".sql")).sort();
        if (found.length > 0) {
          migrationDir = fallbackDir;
          sqlFiles = found;
        }
      } catch {
        // fallback not found
      }
    }

    let appliedCount = 0;

    for (const sqlFile of sqlFiles) {
      if (appliedSet.has(sqlFile)) {
        continue;
      }

      // If tables were already created previously before migration tracking was added:
      if (
        (sqlFile === "001_create_users.sql" && existingTables.has("users")) ||
        (sqlFile === "002_create_tasks.sql" && existingTables.has("tasks"))
      ) {
        await client.query(
          "INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING;",
          [sqlFile],
        );
        console.log(`- Migration already applied previously: ${sqlFile}`);
        continue;
      }

      const filePath = path.join(migrationDir, sqlFile);
      const sqlContent = await fs.readFile(filePath, "utf-8");

      console.log(`- Applying migration: ${sqlFile}...`);

      await client.query("BEGIN");
      try {
        await client.query(sqlContent);
        await client.query(
          "INSERT INTO schema_migrations (name) VALUES ($1);",
          [sqlFile],
        );
        await client.query("COMMIT");
        console.log(`✓ Successfully applied: ${sqlFile}`);
        appliedCount++;
      } catch (error) {
        await client.query("ROLLBACK");
        console.error(`❌ Migration failed at ${sqlFile}:`, error);
        throw error;
      }
    }

    if (appliedCount === 0) {
      console.log("✓ Database is up to date. No pending migrations.");
    } else {
      console.log(`🎉 Successfully applied ${appliedCount} migration(s).`);
    }
  } finally {
    client.release();
  }
};

// If executed directly from CLI: `tsx src/database/migrate.ts` or `node dist/database/migrate.js`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(async () => {
      await closeDatabasePool();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error("Migration error:", error);
      await closeDatabasePool();
      process.exit(1);
    });
}
