import "dotenv/config";

import { findUserByEmail } from "./modules/users/user.repository.js";
import { pool } from "./config/database.js";

const test = async (): Promise<void> => {
  try {
    const user = await findUserByEmail(
      "test@example.com",
    );

    console.log("Database Query Result:", user);
  } catch (error) {
    console.error("Query failed:", error);
  } finally {
    await pool.end();
  }
};

test();