import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Set up file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  })
});

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user is admin
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.role === 'admin') return next();
  res.status(401).json({ message: "Unauthorized admin access" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth (Passport)
  setupAuth(app);

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadDir));

  // --- LOGS ---
  app.post(api.logs.create.path, isAuthenticated, upload.single('screenshot'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Screenshot is required' });
      }

      const { date, aCoins, credits } = req.body;
      const parsedACoins = parseInt(aCoins);
      const parsedCredits = parseInt(credits);

      if (isNaN(parsedACoins) || isNaN(parsedCredits)) {
        return res.status(400).json({ message: 'Invalid resource values' });
      }
      
      const user = req.user!;
      
      // Calculate changes
      // Check if user already submitted today and fetch logs
      const userLogs = await storage.getUserLogs(user.id);
      
      // Only block if there's a pending or approved submission for today
      // Allow resubmission if the only submission for today was rejected
      const todaySubmission = userLogs.find(log => log.date === date);
      if (todaySubmission && todaySubmission.status !== 'rejected') {
        return res.status(400).json({ message: 'You have already submitted for this date' });
      }
      let prevACoins = user.startACoins;
      let prevCredits = user.startCredits;
      
      if (userLogs.length > 0) {
        // Find latest approved log
        const latestApproved = userLogs.find(l => l.status === 'approved');
        if (latestApproved) {
          prevACoins = latestApproved.aCoins;
          prevCredits = latestApproved.credits;
        }
      }

      const aCoinChange = parsedACoins - prevACoins;
      const creditsChange = parsedCredits - prevCredits;
      
      // Basic anti-cheat logic simulation
      let creditsSpent = 0;
      if (creditsChange < 0) {
        creditsSpent = Math.abs(creditsChange);
      }
      
      if (aCoinChange < 0) {
        await storage.updateUser(user.id, { isDisqualified: true });
        await storage.createActivity({
          type: 'disqualification',
          message: `${user.username} has been disqualified for spending A-Coins.`
        });
      } else if (creditsSpent > 4000) {
         await storage.createActivity({
          type: 'warning',
          message: `${user.username} spent more than 4000 credits.`
        });
      }

      const log = await storage.createDailyLog({
        userId: user.id,
        date: date || new Date().toISOString().split('T')[0],
        aCoins: parsedACoins,
        credits: parsedCredits,
        screenshotUrl: `/uploads/${req.file.filename}`
      });

      // Update log with calculated changes and credit spent tracking
      const { db } = await import('./db');
      const { dailyLogs } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const [fullLog] = await db.update(dailyLogs)
        .set({ 
          aCoinChange, 
          creditsChange, 
          creditsSpent: Math.abs(Math.min(creditsChange, 0)),
          status: 'pending'
        })
        .where(eq(dailyLogs.id, log.id))
        .returning();

      await storage.createActivity({
        type: 'submission',
        message: `${user.username} submitted daily resources.`
      });

      res.status(201).json(fullLog);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get(api.logs.listMyLogs.path, isAuthenticated, async (req, res) => {
    const logs = await storage.getUserLogs(req.user!.id);
    res.status(200).json(logs);
  });

  app.get(api.logs.listPending.path, isAdmin, async (req, res) => {
    const logs = await storage.getPendingLogs();
    res.status(200).json(logs);
  });

  app.patch(api.logs.updateStatus.path, isAdmin, async (req, res) => {
    try {
      const { status, adminNotes } = api.logs.updateStatus.input.parse(req.body);
      const id = parseInt(req.params.id);
      const log = await storage.updateLogStatus(id, status, adminNotes);

      // Fetch the user who owns this log
      const logOwner = await storage.getUser(log.userId);
      const username = logOwner?.username || 'Unknown';

      if (status === 'approved') {
        await storage.createActivity({
          type: 'approved',
          message: `${username}'s daily submission was approved. +${log.aCoinChange} A-Coins, +${log.creditsChange} Credits.`,
        });

        // Check milestones on A-Coins
        const allLogs = await storage.getUserLogs(log.userId);
        const totalACoins = allLogs
          .filter(l => l.status === 'approved')
          .reduce((sum, l) => sum + l.aCoinChange, 0);
        const totalCredits = allLogs
          .filter(l => l.status === 'approved')
          .reduce((sum, l) => sum + l.creditsChange, 0);

        const acoinMilestones = [1000, 5000, 10000, 50000, 100000];
        for (const m of acoinMilestones) {
          if (totalACoins >= m && (totalACoins - log.aCoinChange) < m) {
            await storage.createActivity({
              type: 'milestone',
              message: `🏅 ${username} reached ${m.toLocaleString()} A-Coins earned!`,
            });
          }
        }

        const creditMilestones = [10000, 50000, 100000, 500000, 1000000];
        for (const m of creditMilestones) {
          if (totalCredits >= m && (totalCredits - log.creditsChange) < m) {
            await storage.createActivity({
              type: 'milestone',
              message: `🏅 ${username} reached ${m.toLocaleString()} Credits earned!`,
            });
          }
        }
      } else if (status === 'rejected') {
        await storage.createActivity({
          type: 'rejected',
          message: `${username}'s submission was rejected${adminNotes ? ': ' + adminNotes : '.'}`,
        });
      }

      res.status(200).json(log);
    } catch(err: any) {
       res.status(400).json({ message: err.message });
    }
  });

  // --- USERS ---
  app.get(api.users.list.path, async (req, res) => {
    const usersList = await storage.getAllUsers();
    // remove passwords
    const safeUsers = usersList.map(({ password, ...u }) => u);
    res.status(200).json(safeUsers);
  });

  app.patch(api.users.updateProfile.path, isAuthenticated, async (req, res) => {
    try {
      const updates = api.users.updateProfile.input.parse(req.body);
      const user = await storage.updateUser(req.user!.id, updates);
      res.status(200).json(user);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch(api.users.updateRole.path, isAdmin, async (req, res) => {
    try {
      const { role } = api.users.updateRole.input.parse(req.body);
      const id = parseInt(req.params.id);
      const user = await storage.updateUser(id, { role });
      res.status(200).json(user);
    } catch(err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // --- LEADERBOARDS ---
  app.get(api.leaderboard.aCoins.path, async (req, res) => {
    const data = await storage.getLeaderboardData('aCoins');
    // sanitize users
    res.status(200).json(data.map(d => ({ ...d, user: { ...d.user, password: '' } })));
  });

  app.get(api.leaderboard.credits.path, async (req, res) => {
    const data = await storage.getLeaderboardData('credits');
    res.status(200).json(data.map(d => ({ ...d, user: { ...d.user, password: '' } })));
  });

  // --- USERS ---
  app.post('/api/users/mark-welcome-seen', isAuthenticated, async (req, res) => {
    try {
      const user = await storage.markWelcomeAsSeen(req.user.id);
      res.status(200).json({ ...user, password: '' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to update welcome status' });
    }
  });

  // --- ADMIN EXTENDED ---

  // Reinstate a disqualified user
  app.post('/api/admin/users/:id/reinstate', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const target = await storage.getUser(id);
      if (!target) return res.status(404).json({ message: 'User not found' });
      const updated = await storage.updateUser(id, { isDisqualified: false });
      await storage.createActivity({
        type: 'reinstate',
        message: `${target.username} has been reinstated by an admin.`,
      });
      const { password, ...safe } = updated;
      res.status(200).json(safe);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Edit a user's starting resource values
  app.patch('/api/admin/users/:id/starting-values', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { startACoins, startCredits } = z.object({
        startACoins: z.number().int().min(0),
        startCredits: z.number().int().min(0),
      }).parse(req.body);
      const updated = await storage.updateUser(id, { startACoins, startCredits });
      const { password, ...safe } = updated;
      res.status(200).json(safe);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Post a custom network announcement
  app.post('/api/admin/announce', isAdmin, async (req, res) => {
    try {
      const { message } = z.object({ message: z.string().min(1) }).parse(req.body);
      const activity = await storage.createActivity({ type: 'announcement', message });
      res.status(201).json(activity);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // View any user's logs (admin)
  app.get('/api/admin/users/:id/logs', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const logs = await storage.getUserLogs(id);
      res.status(200).json(logs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Get personal stats for profile
  app.get('/api/users/me/stats', isAuthenticated, async (req, res) => {
    try {
      const logs = await storage.getUserLogs(req.user!.id);
      const approved = logs.filter(l => l.status === 'approved');
      const rejected = logs.filter(l => l.status === 'rejected');
      const pending = logs.filter(l => l.status === 'pending');
      const totalACoinsEarned = approved.reduce((s, l) => s + Math.max(0, l.aCoinChange), 0);
      const totalCreditsEarned = approved.reduce((s, l) => s + Math.max(0, l.creditsChange), 0);
      res.status(200).json({
        totalSubmissions: logs.length,
        approved: approved.length,
        rejected: rejected.length,
        pending: pending.length,
        totalACoinsEarned,
        totalCreditsEarned,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- STATS ---
  app.get(api.stats.global.path, async (req, res) => {
    const stats = await storage.getGlobalStats();
    res.status(200).json(stats);
  });

  // --- ACTIVITIES ---
  app.get(api.activities.list.path, async (req, res) => {
    const activities = await storage.getActivities();
    res.status(200).json(activities);
  });

  return httpServer;
}
