import { db } from "./db";
import { 
  users, dailyLogs, activities, 
  type User, type InsertUser, 
  type DailyLog, type InsertDailyLog, 
  type Activity, type InsertActivity,
  type LogWithUser
} from "@shared/schema";
import { eq, desc, sum, and, gte, lte } from "drizzle-orm";
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
  
  getLeaderboardData(type: 'aCoins' | 'credits'): Promise<{user: User, totalApprovedChange: number}[]>;
  getGlobalStats(): Promise<{totalPlayers: number, activeToday: number, totalACoinsGained: number, totalCreditsGained: number}>;
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
  
  async getLeaderboardData(type: 'aCoins' | 'credits'): Promise<{user: User, totalApprovedChange: number}[]> {
    // For MVP, fetch all approved logs and aggregate in memory to keep it simple
    // In production, use SQL grouping
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
    
    // Get logs for today (simplified - using current date)
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
}

export const storage = new DatabaseStorage();
