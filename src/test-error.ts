import { AppError } from "./utils/AppError.js";

const error = new AppError(
  "Internal server error",
  500,
);

console.log(error.message);
console.log(error.statusCode);
console.log(error.status);
console.log(error.isOperational);