import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  country: text("country").notNull(),
  timezone: text("timezone").notNull(),
  avatar: text("avatar").notNull(),
  startACoins: integer("start_a_coins").notNull(),
  startCredits: integer("start_credits").notNull(),
  role: text("role").notNull().default("user"), // 'user', 'admin'
  isDisqualified: boolean("is_disqualified").notNull().default(false),
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
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected', 'disqualified'
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

// Base Schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, isDisqualified: true, role: true })
  .extend({
    username: z.string().min(1, "Username is required").min(3, "Username must be at least 3 characters"),
    password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
    country: z.string().min(1, "Country is required"),
    avatar: z.string().min(1, "Avatar is required"),
    startACoins: z.number().int().min(0, "A-Coins must be 0 or higher"),
    startCredits: z.number().int().min(0, "Credits must be 0 or higher"),
  });
export const insertDailyLogSchema = createInsertSchema(dailyLogs).omit({ id: true, createdAt: true, aCoinChange: true, creditsChange: true, creditsSpent: true, status: true, adminNotes: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type DailyLog = typeof dailyLogs.$inferSelect;
export type InsertDailyLog = z.infer<typeof insertDailyLogSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type LogWithUser = DailyLog & { user: User };
