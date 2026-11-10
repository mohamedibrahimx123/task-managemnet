import "dotenv/config";

import { generateAccessToken } from "./utils/jwt.js";

const token = generateAccessToken({
  id: "00000000-0000-4000-8000-000000000001",
  role: "user",
});

console.log("Expired Test Token:", token);