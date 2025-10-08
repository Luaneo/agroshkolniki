import { compare, hash } from "bcrypt";
import { basicAuth } from "hono/basic-auth";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export function hashPassword(password: string) {
  return hash(password, 10);
}

export function comparePassword(password: string, hashedPassword: string) {
  return compare(password, hashedPassword);
}

export const authMiddleware = basicAuth({
  async verifyUser(username, password, c) {
    try {
      const [foundUser] = await db
        .select()
        .from(users)
        .where(eq(users.login, username));
      if (!foundUser) {
        return false;
      }
      const isPasswordValid = await comparePassword(
        password,
        foundUser.hashedPassword
      );
      if (isPasswordValid) {
        c.set("login", username);
      }
      return isPasswordValid;
    } catch (err) {
      // On DB connectivity or query errors, fail auth gracefully (401) instead of 500
      return false;
    }
  },
});
