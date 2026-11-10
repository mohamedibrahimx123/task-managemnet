import { AppError } from "../../utils/AppError.js";
import { hashPassword } from "../../utils/password.js";
import {
  createUser as createUserRepository,
  findUserByEmail,
  findUserById,
} from "./user.repository.js";

import type {
  RegisterInput,
  PublicUser,
} from "./user.types.js";

export const registerUser = async (
  input: RegisterInput,
): Promise<PublicUser> => {
  const existingUser = await findUserByEmail(
    input.email,
  );

  if (existingUser) {
    throw new AppError(
      "Email already registered",
      409,
    );

  }

  const passwordHash = await hashPassword(input.password);

  const user = await createUserRepository(
    input,
    passwordHash,
  );

  const { passwordHash: _, ...publicUser } = user;

  return publicUser;
};

export const getCurrentUser = async (
  userId: string,
): Promise<PublicUser> => {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const {
    passwordHash: _,
    ...publicUser
  } = user;

  return publicUser;
};