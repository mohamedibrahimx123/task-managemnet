import { pool } from "../../config/database.js";

import type {
  User,
  RegisterInput,
} from "./user.types.js";

export const findUserByEmail = async (
  email: string,
): Promise<User | null> => {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        email,
        password_hash AS "passwordHash",
        role,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] ?? null;
};

export const findUserById = async (
  id: string,
): Promise<User | null> => {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        email,
        password_hash AS "passwordHash",
        role,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
};

export const createUser = async (
  input: RegisterInput,
  passwordHash: string,
): Promise<User> => {
  const result = await pool.query(
    `
      INSERT INTO users (
        name,
        email,
        password_hash
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        name,
        email,
        password_hash AS "passwordHash",
        role,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      input.name,
      input.email,
      passwordHash,
    ],
  );

  return result.rows[0] as User;
};