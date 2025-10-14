import { compare, hash } from "bcrypt";
import { basicAuth } from "hono/basic-auth";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import type { Context } from "hono";

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
        foundUser.passwordHash
      );
      if (isPasswordValid) {
        c.set("user_id", foundUser.id);
      }
      return isPasswordValid;
    } catch (err) {
      // On DB connectivity or query errors, fail auth gracefully (401) instead of 500
      return false;
    }
  },
});

export function getUserIdFromContext(c: Context) {
  return c.get("userId") as number;
}
