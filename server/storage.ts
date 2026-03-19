import { db } from "./db";
import { 
  users, dailyLogs, activities, messages,
  type User, type InsertUser, 
  type DailyLog, type InsertDailyLog, 
  type Activity, type InsertActivity,
  type Message, type InsertMessage,
  type LogWithUser
} from "@shared/schema";
import { eq, desc, sum, and, gte, lte, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export function setupSessionStore() {
  return new PostgresSessionStore({ pool, createTableIfMissing: true });
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  createDailyLog(log: InsertDailyLog): Promise<DailyLog>;
  getUserLogs(userId: number): Promise<DailyLog[]>;
  getPendingLogs(): Promise<LogWithUser[]>;
  updateLogStatus(id: number, status: string, notes?: string): Promise<DailyLog>;
  
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivities(): Promise<Activity[]>;
  
  deleteUser(id: number): Promise<void>;
  getAllLogs(filters?: { userId?: number; status?: string }): Promise<(DailyLog & { user: User })[]>;
  
  getLeaderboardData(type: 'aCoins' | 'credits'): Promise<{user: User, totalApprovedChange: number}[]>;
  getGlobalStats(): Promise<{totalPlayers: number, activeToday: number, totalACoinsGained: number, totalCreditsGained: number}>;

  // Messages
  createMessage(data: { userId: number; content: string; fromAdmin: boolean }): Promise<Message>;
  getMessagesForUser(userId: number): Promise<Message[]>;
  getAllConversations(): Promise<{ userId: number; user: User; lastMessage: Message; unreadFromUser: number }[]>;
  markMessagesRead(userId: number, fromAdmin: boolean): Promise<void>;
  getUnreadCountFromAdmin(userId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async markWelcomeAsSeen(id: number): Promise<User> {
    const [user] = await db.update(users).set({ seenWelcome: true }).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createDailyLog(insertLog: InsertDailyLog): Promise<DailyLog> {
    const [log] = await db.insert(dailyLogs).values(insertLog).returning();
    return log;
  }

  async getUserLogs(userId: number): Promise<DailyLog[]> {
    return await db.select().from(dailyLogs).where(eq(dailyLogs.userId, userId)).orderBy(desc(dailyLogs.date));
  }

  async getPendingLogs(): Promise<LogWithUser[]> {
    const pendingLogs = await db.query.dailyLogs.findMany({
      where: eq(dailyLogs.status, 'pending'),
      with: {
        user: true
      },
      orderBy: desc(dailyLogs.date)
    });
    return pendingLogs as LogWithUser[];
  }

  async updateLogStatus(id: number, status: string, notes?: string): Promise<DailyLog> {
    const [log] = await db.update(dailyLogs).set({ status, adminNotes: notes || null }).where(eq(dailyLogs.id, id)).returning();
    return log;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [act] = await db.insert(activities).values(activity).returning();
    return act;
  }

  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(50);
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.userId, id));
    await db.delete(dailyLogs).where(eq(dailyLogs.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllLogs(filters?: { userId?: number; status?: string }): Promise<(DailyLog & { user: User })[]> {
    const conditions = [];
    if (filters?.userId) conditions.push(eq(dailyLogs.userId, filters.userId));
    if (filters?.status) conditions.push(eq(dailyLogs.status, filters.status));

    const rows = await db.query.dailyLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { user: true },
      orderBy: desc(dailyLogs.createdAt),
      limit: 200,
    });
    return rows as (DailyLog & { user: User })[];
  }
  
  async getLeaderboardData(type: 'aCoins' | 'credits'): Promise<{user: User, totalApprovedChange: number}[]> {
    const allUsers = await this.getAllUsers();
    const result = [];
    for (const u of allUsers) {
      if (u.isDisqualified) continue;
      
      const userLogs = await db.select().from(dailyLogs).where(and(
        eq(dailyLogs.userId, u.id),
        eq(dailyLogs.status, 'approved')
      ));
      
      let totalChange = 0;
      if (type === 'aCoins') {
        totalChange = userLogs.reduce((acc, log) => acc + log.aCoinChange, 0);
      } else {
        totalChange = userLogs.reduce((acc, log) => acc + log.creditsChange, 0);
      }
      
      result.push({
        user: u,
        totalApprovedChange: totalChange
      });
    }
    
    return result.sort((a, b) => b.totalApprovedChange - a.totalApprovedChange);
  }

  async getGlobalStats(): Promise<{totalPlayers: number, activeToday: number, totalACoinsGained: number, totalCreditsGained: number}> {
    const allUsers = await this.getAllUsers();
    const activeUsers = allUsers.filter(u => !u.isDisqualified);
    
    const today = new Date().toISOString().split('T')[0];
    const todaysLogs = await db.select().from(dailyLogs).where(eq(dailyLogs.date, today));
    const activeToday = new Set(todaysLogs.map(l => l.userId)).size;
    
    const approvedLogs = await db.select().from(dailyLogs).where(eq(dailyLogs.status, 'approved'));
    const totalACoinsGained = approvedLogs.reduce((acc, log) => acc + log.aCoinChange, 0);
    const totalCreditsGained = approvedLogs.reduce((acc, log) => acc + log.creditsChange, 0);
    
    return {
      totalPlayers: activeUsers.length,
      activeToday,
      totalACoinsGained,
      totalCreditsGained
    };
  }

  // ── Messages ──────────────────────────────────────────────────────────────

  async createMessage(data: { userId: number; content: string; fromAdmin: boolean }): Promise<Message> {
    const [msg] = await db.insert(messages).values(data).returning();
    return msg;
  }

  async getMessagesForUser(userId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(messages.createdAt);
  }

  async getAllConversations(): Promise<{ userId: number; user: User; lastMessage: Message; unreadFromUser: number }[]> {
    const allMsgs = await db.select().from(messages).orderBy(desc(messages.createdAt));
    const allUsers = await this.getAllUsers();
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    const seenUserIds = new Set<number>();
    const conversations: { userId: number; user: User; lastMessage: Message; unreadFromUser: number }[] = [];

    for (const msg of allMsgs) {
      if (!seenUserIds.has(msg.userId)) {
        seenUserIds.add(msg.userId);
        const user = userMap.get(msg.userId);
        if (!user) continue;
        const unreadFromUser = allMsgs.filter(m => m.userId === msg.userId && !m.fromAdmin && !m.isRead).length;
        conversations.push({ userId: msg.userId, user, lastMessage: msg, unreadFromUser });
      }
    }

    return conversations;
  }

  async markMessagesRead(userId: number, fromAdmin: boolean): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.userId, userId), eq(messages.fromAdmin, fromAdmin)));
  }

  async getUnreadCountFromAdmin(userId: number): Promise<number> {
    const unread = await db.select().from(messages).where(
      and(eq(messages.userId, userId), eq(messages.fromAdmin, true), eq(messages.isRead, false))
    );
    return unread.length;
  }
}

export const storage = new DatabaseStorage();
