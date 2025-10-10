import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("roles", ["admin", "shiftLead"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  login: varchar("login", { length: 256 }).notNull().unique(),
  hashedPassword: varchar("hashed_password", { length: 256 }).notNull(),
  role: rolesEnum().default("shiftLead").notNull(),
});

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  base64Image: text("base64_image").notNull(),
  filename: varchar("filename", { length: 256 }).notNull(),
  authorId: integer("author_id").notNull(),
});

import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many }) => ({
  images: many(images),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  author: one(users, {
    fields: [images.authorId],
    references: [users.id],
  }),
}));
