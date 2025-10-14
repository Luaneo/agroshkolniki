import { relations } from "drizzle-orm";
import {
  integer,
  interval,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("roles", [
  "admin",
  "shiftLead",
  "dataScientist",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  login: varchar("login", { length: 256 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),

  name: varchar("name", { length: 256 }),
  role: rolesEnum().default("shiftLead").notNull(),

  creatorId: integer("creator_id"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  createdUsers: many(users),
  creator: one(users, {
    fields: [users.creatorId],
    references: [users.id],
  }),

  createdShifts: many(shifts),
  assignedShifts: many(shifts),

  submittedReports: many(reports),
}));

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 256 }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const regionsRelations = relations(regions, ({ many }) => ({
  shifts: many(shifts),
}));

export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),

  regionId: integer("region_id").notNull(),
  interval: interval("interval"),

  creatorId: integer("creator_id"),
  assigneeId: integer("assignee_id"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  region: one(regions, {
    fields: [shifts.regionId],
    references: [regions.id],
  }),

  creator: one(users, {
    fields: [shifts.creatorId],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [shifts.assigneeId],
    references: [users.id],
  }),

  reports: many(reports),
}));

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),

  imageS3URL: text("image_s3_url"),
  modelResponse: jsonb<any>("model_response"),

  submitterId: integer("submitter_id"),
  shiftId: integer("shift_id"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const reportsRelations = relations(reports, ({ one }) => ({
  submitter: one(users, {
    fields: [reports.submitterId],
    references: [users.id],
  }),

  shift: one(shifts, {
    fields: [reports.shiftId],
    references: [shifts.id],
  }),
}));
