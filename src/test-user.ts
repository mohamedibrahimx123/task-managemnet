import "dotenv/config";

import { registerUser } from "./modules/users/user.service.js";
import { pool } from "./config/database.js";

const test = async (): Promise<void> => {
  try {
    const user = await registerUser({
      name: "Mohamed Ebrahim",
      email: "mohamed.test@example.com",
      password: "TemporaryPassword123",
    });

    console.log("User created successfully:");
    console.log(user);
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await pool.end();
  }
};

test();