import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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

export const usersRelations = relations(users, ({ many }) => ({
  dailyLogs: many(dailyLogs),
}));

export const dailyLogsRelations = relations(dailyLogs, ({ one }) => ({
  user: one(users, {
    fields: [dailyLogs.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertDailyLogSchema = createInsertSchema(dailyLogs).omit({ id: true, createdAt: true, aCoinChange: true, creditsChange: true, creditsSpent: true, status: true, adminNotes: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type DailyLog = typeof dailyLogs.$inferSelect;
export type InsertDailyLog = z.infer<typeof insertDailyLogSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type LogWithUser = DailyLog & { user: User };
