import {
  hashPassword,
  comparePassword,
} from "./utils/password.js";

const testPassword = async (): Promise<void> => {
  const password = "TestPassword123!";

  const hash = await hashPassword(password);

  console.log("Hash generated:", hash.startsWith("$2"));

  const correctPassword = await comparePassword(
    password,
    hash,
  );

  const wrongPassword = await comparePassword(
    "WrongPassword123!",
    hash,
  );

  console.log("Correct password:", correctPassword);
  console.log("Wrong password:", wrongPassword);
};

testPassword();