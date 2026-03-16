import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// NOTE: User tables are managed by Better Auth in the public schema
// Do NOT modify the users/accounts/sessions tables directly
// Better Auth schema is in public.users, public.accounts, public.sessions

export const dailyLogs = pgTable("daily_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  aCoins: integer("a_coins").notNull(),
  credits: integer("credits").notNull(),
  aCoinChange: integer("a_coin_change").notNull().default(0),
  creditsChange: integer("credits_change").notNull().default(0),
  creditsSpent: integer("credits_spent").notNull().default(0),
  screenshotUrl: text("screenshot_url").notNull(),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersMetadata = pgTable("users_metadata", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  username: text("username").unique(),
  country: text("country").notNull().default(""),
  timezone: text("timezone").notNull().default(""),
  avatar: text("avatar").notNull().default("avatar1"),
  startACoins: integer("start_a_coins").notNull().default(0),
  startCredits: integer("start_credits").notNull().default(0),
  role: text("role").notNull().default("user"),
  isDisqualified: boolean("is_disqualified").notNull().default(false),
  seenWelcome: boolean("seen_welcome").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyLogsRelations = relations(dailyLogs, ({ one }) => ({
  user: one(usersMetadata, {
    fields: [dailyLogs.userId],
    references: [usersMetadata.userId],
  }),
}));

// Base Schemas
export const insertDailyLogSchema = createInsertSchema(dailyLogs).omit({ id: true, createdAt: true, aCoinChange: true, creditsChange: true, creditsSpent: true, status: true, adminNotes: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertUserMetadataSchema = createInsertSchema(usersMetadata).omit({ id: true, createdAt: true });

// Better Auth User type (from public.users table)
export type BetterAuthUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// CraCoins User Metadata
export type UserMetadata = typeof usersMetadata.$inferSelect;
export type InsertUserMetadata = z.infer<typeof insertUserMetadataSchema>;

// Combined user type for application
export type AppUser = BetterAuthUser & Partial<UserMetadata>;

export type DailyLog = typeof dailyLogs.$inferSelect;
export type InsertDailyLog = z.infer<typeof insertDailyLogSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type LogWithUser = DailyLog & { user: UserMetadata };
