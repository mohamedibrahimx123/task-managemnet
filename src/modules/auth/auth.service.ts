import { AppError } from "../../utils/AppError.js";

import { comparePassword } from "../../utils/password.js";
import { generateAccessToken } from "../../utils/jwt.js";

import {
  registerUser as createUser,
} from "../users/user.service.js";

import {
  findUserByEmail,
} from "../users/user.repository.js";

import type {
  RegisterRequest,
  LoginRequest,
} from "./auth.validation.js";

export const registerUser = async (
  input: RegisterRequest,
) => {
  return createUser(input);
};

export const loginUser = async (
  input: LoginRequest,
) => {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordCorrect = await comparePassword(
    input.password,
    user.passwordHash,
  );

  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role,
  });

  const {
    passwordHash: _,
    ...publicUser
  } = user;

  return {
    user: publicUser,
    accessToken,
  };
};