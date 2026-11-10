import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

interface TokenPayload {
  id: string;
  role: "user" | "admin";
}

export const generateAccessToken = (
  user: TokenPayload,
): string => {
  const expiresIn = env.JWT_EXPIRES_IN as SignOptions["expiresIn"];

  return jwt.sign(
    {
      role: user.role,
    },
    env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn,
    },
  );
};
