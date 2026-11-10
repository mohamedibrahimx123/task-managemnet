import { pool } from "../config/database.js";
import { hashPassword } from "../utils/password.js";

export async function seedDatabase() {
  console.log("🌱 Starting Database Seeding...");

  try {
    const passwordHash = await hashPassword("Password123!");

    // 1. Seed or Update Admin User
    const adminEmail = "admin@example.com";
    const existingAdmin = await pool.query(
      "SELECT id, role FROM users WHERE email = $1",
      [adminEmail]
    );

    let adminId: string;
    if (existingAdmin.rows.length === 0) {
      const res = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ["System Administrator", adminEmail, passwordHash, "admin"]
      );
      adminId = res.rows[0].id;
      console.log(`✅ Created Admin user: ${adminEmail} (Password123!)`);
    } else {
      adminId = existingAdmin.rows[0].id;
      await pool.query(
        "UPDATE users SET role = 'admin', password_hash = $1 WHERE id = $2",
        [passwordHash, adminId]
      );
      console.log(`✅ Updated Admin user: ${adminEmail} (role: admin)`);
    }

    // 2. Seed or Update Regular User
    const userEmail = "user@example.com";
    const existingUser = await pool.query(
      "SELECT id, role FROM users WHERE email = $1",
      [userEmail]
    );

    let userId: string;
    if (existingUser.rows.length === 0) {
      const res = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ["Marco Lisso", userEmail, passwordHash, "user"]
      );
      userId = res.rows[0].id;
      console.log(`✅ Created Regular user: ${userEmail} (Password123!)`);
    } else {
      userId = existingUser.rows[0].id;
      await pool.query(
        "UPDATE users SET role = 'user', password_hash = $1 WHERE id = $2",
        [passwordHash, userId]
      );
      console.log(`✅ Updated Regular user: ${userEmail} (role: user)`);
    }

    // 3. Seed some tasks for user if user has 0 tasks
    const tasksCount = await pool.query(
      "SELECT COUNT(*) FROM tasks WHERE user_id = $1",
      [userId]
    );

    if (parseInt(tasksCount.rows[0].count, 10) === 0) {
      await pool.query(
        `INSERT INTO tasks (user_id, title, description, status, priority, due_date)
         VALUES 
         ($1, 'Weekly Strategy Sync', 'Review product growth and roadmap updates with team', 'pending', 'medium', NOW() + INTERVAL '2 days'),
         ($1, 'Design Review', 'Audit landing page components, color scheme, and typography', 'in_progress', 'high', NOW() + INTERVAL '4 days'),
         ($1, 'VinteX Team Sync', 'Team alignment on Q1 deliverables and backend endpoints', 'completed', 'low', NOW() - INTERVAL '1 day')`,
        [userId]
      );
      console.log("✅ Seeded initial tasks for regular user");
    }

    console.log("🎉 Database Seeding completed successfully!");
    console.log("-----------------------------------------");
    console.log("🔑 Admin Credentials:  admin@example.com / Password123!");
    console.log("👤 User Credentials:   user@example.com  / Password123!");
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run directly when executed via CLI
if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  seedDatabase()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async () => {
      await pool.end();
      process.exit(1);
    });
}
