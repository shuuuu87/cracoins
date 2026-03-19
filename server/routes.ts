import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

// Configure Cloudinary — supports CLOUDINARY_URL or individual vars
const cloudinaryConfigured = !!(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET)
);

if (cloudinaryConfigured) {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
  console.log("[cloudinary] configured ✓");
}

// Upload to Cloudinary with a 30s timeout
function uploadToCloudinary(buffer: Buffer, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Cloudinary upload timed out")), 30000);
    const stream = cloudinary.uploader.upload_stream(
      { folder: "cracoins", resource_type: "image", public_id: filename },
      (error, result) => {
        clearTimeout(timer);
        if (error || !result) {
          console.error("[cloudinary] upload error:", error);
          return reject(error ?? new Error("Upload failed"));
        }
        console.log("[cloudinary] upload success:", result.secure_url);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// Save buffer to local disk and return a /uploads URL
function saveLocally(buffer: Buffer, filename: string): string {
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${filename}`;
}

// Upload to Cloudinary if configured, otherwise save locally
async function storeScreenshot(buffer: Buffer, originalname: string): Promise<string> {
  const ext = path.extname(originalname) || ".jpg";
  const basename = `screenshot-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  if (cloudinaryConfigured) {
    try {
      return await uploadToCloudinary(buffer, basename);
    } catch (err) {
      console.error("[cloudinary] falling back to local storage due to error:", err);
    }
  }
  return saveLocally(buffer, basename + ext);
}

// Use memory storage so we can handle the buffer ourselves
const upload = multer({ storage: multer.memoryStorage() });

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

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth (Passport)
  setupAuth(app);

  // Serve old locally-uploaded files (fallback for pre-Cloudinary submissions)
  app.use("/uploads", express.static(uploadDir));

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

      const screenshotUrl = await storeScreenshot(req.file.buffer, req.file.originalname);

      const log = await storage.createDailyLog({
        userId: user.id,
        date: date || new Date().toISOString().split('T')[0],
        aCoins: parsedACoins,
        credits: parsedCredits,
        screenshotUrl,
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

  // Manually disqualify a user (with reason)
  app.post('/api/admin/users/:id/disqualify', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
      const target = await storage.getUser(id);
      if (!target) return res.status(404).json({ message: 'User not found' });
      const updated = await storage.updateUser(id, { isDisqualified: true });
      await storage.createActivity({
        type: 'disqualification',
        message: `${target.username} has been disqualified by admin${reason ? ': ' + reason : '.'}`,
      });
      const { password, ...safe } = updated;
      res.status(200).json(safe);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Issue a warning to a user
  app.post('/api/admin/users/:id/warn', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);
      const target = await storage.getUser(id);
      if (!target) return res.status(404).json({ message: 'User not found' });
      await storage.createActivity({
        type: 'warning',
        message: `⚠️ ${target.username} received a warning: ${reason}`,
      });
      res.status(200).json({ message: 'Warning issued' });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Delete a user from the challenge
  app.delete('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const adminId = req.user!.id;
      if (id === adminId) return res.status(400).json({ message: 'Cannot delete yourself' });
      const target = await storage.getUser(id);
      if (!target) return res.status(404).json({ message: 'User not found' });
      await storage.deleteUser(id);
      res.status(200).json({ message: 'User deleted' });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Batch approve or reject submissions
  app.post('/api/admin/logs/batch', isAdmin, async (req, res) => {
    try {
      const { ids, status } = z.object({
        ids: z.array(z.number()).min(1),
        status: z.enum(['approved', 'rejected']),
      }).parse(req.body);
      const results = [];
      for (const id of ids) {
        const log = await storage.updateLogStatus(id, status);
        const logOwner = await storage.getUser(log.userId);
        const username = logOwner?.username || 'Unknown';
        if (status === 'approved') {
          await storage.createActivity({ type: 'approved', message: `${username}'s daily submission was approved.` });
        } else {
          await storage.createActivity({ type: 'rejected', message: `${username}'s submission was rejected.` });
        }
        results.push(log);
      }
      res.status(200).json(results);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Get ALL logs (admin view) with optional filters
  app.get('/api/admin/logs', isAdmin, async (req, res) => {
    try {
      const { userId, status } = req.query;
      const logs = await storage.getAllLogs({
        userId: userId ? parseInt(userId as string) : undefined,
        status: status as string | undefined,
      });
      res.status(200).json(logs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Get per-user stats (admin)
  app.get('/api/admin/users/:id/stats', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const logs = await storage.getUserLogs(id);
      const approved = logs.filter(l => l.status === 'approved').length;
      const rejected = logs.filter(l => l.status === 'rejected').length;
      const pending = logs.filter(l => l.status === 'pending').length;
      const total = logs.length;
      const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
      res.status(200).json({ total, approved, rejected, pending, approvalRate });
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

  // --- PROFILE IMAGE UPLOAD ---
  app.post('/api/users/me/profile-image', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No image file provided' });
      const url = await storeScreenshot(req.file.buffer, req.file.originalname);
      const user = await storage.updateUser(req.user!.id, { profileImageUrl: url });
      const { password, ...safe } = user;
      res.status(200).json(safe);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- MESSAGES (User side) ---
  app.get('/api/messages', isAuthenticated, async (req, res) => {
    try {
      const msgs = await storage.getMessagesForUser(req.user!.id);
      res.status(200).json(msgs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req, res) => {
    try {
      const { content } = z.object({ content: z.string().min(1).max(2000) }).parse(req.body);
      const msg = await storage.createMessage({ userId: req.user!.id, content, fromAdmin: false });
      res.status(201).json(msg);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch('/api/messages/read', isAuthenticated, async (req, res) => {
    try {
      await storage.markMessagesRead(req.user!.id, true);
      res.status(200).json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/messages/unread-count', isAuthenticated, async (req, res) => {
    try {
      const count = await storage.getUnreadCountFromAdmin(req.user!.id);
      res.status(200).json({ count });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- MESSAGES (Admin side) ---
  app.get('/api/admin/messages', isAdmin, async (req, res) => {
    try {
      const conversations = await storage.getAllConversations();
      const safe = conversations.map(c => ({ ...c, user: { ...c.user, password: '' } }));
      res.status(200).json(safe);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/admin/messages/:userId', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const msgs = await storage.getMessagesForUser(userId);
      res.status(200).json(msgs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/admin/messages/:userId', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { content } = z.object({ content: z.string().min(1).max(2000) }).parse(req.body);
      const msg = await storage.createMessage({ userId, content, fromAdmin: true });
      res.status(201).json(msg);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch('/api/admin/messages/:userId/read', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      await storage.markMessagesRead(userId, false);
      res.status(200).json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}
