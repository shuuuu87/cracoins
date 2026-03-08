import { z } from 'zod';
import { insertUserSchema, users, dailyLogs, activities } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// We define custom schemas for relations if needed
const userSchema = z.custom<typeof users.$inferSelect>();
const dailyLogSchema = z.custom<typeof dailyLogs.$inferSelect>();
const activitySchema = z.custom<typeof activities.$inferSelect>();

const logWithUserSchema = dailyLogSchema.and(z.object({ user: userSchema }));

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: userSchema,
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: userSchema,
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: userSchema,
        401: errorSchemas.unauthorized,
      },
    },
  },
  logs: {
    create: {
      method: 'POST' as const,
      path: '/api/logs' as const,
      // Uses multipart/form-data so we don't strictly type the body in Zod here for fetch purposes, 
      // but frontend should send FormData with 'date', 'aCoins', 'credits', and 'screenshot' file.
      responses: {
        201: dailyLogSchema,
        400: errorSchemas.validation,
      },
    },
    listMyLogs: {
      method: 'GET' as const,
      path: '/api/logs/me' as const,
      responses: {
        200: z.array(dailyLogSchema),
      },
    },
    listPending: {
      method: 'GET' as const,
      path: '/api/admin/logs/pending' as const,
      responses: {
        200: z.array(logWithUserSchema),
      }
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/admin/logs/:id/status' as const,
      input: z.object({ 
        status: z.enum(['pending', 'approved', 'rejected', 'disqualified']), 
        adminNotes: z.string().optional() 
      }),
      responses: {
        200: dailyLogSchema,
      },
    },
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: {
        200: z.array(userSchema),
      },
    },
    updateProfile: {
      method: 'PATCH' as const,
      path: '/api/users/me' as const,
      input: z.object({ 
        avatar: z.string().optional(), 
        username: z.string().optional(), 
        password: z.string().optional(), 
        country: z.string().optional() 
      }),
      responses: {
        200: userSchema,
      },
    },
    updateRole: {
      method: 'PATCH' as const,
      path: '/api/admin/users/:id/role' as const,
      input: z.object({ role: z.enum(['user', 'admin']) }),
      responses: {
        200: userSchema,
      },
    },
  },
  leaderboard: {
    aCoins: {
      method: 'GET' as const,
      path: '/api/leaderboard/a-coins' as const,
      responses: {
        200: z.array(z.object({ user: userSchema, totalApprovedChange: z.number() })),
      },
    },
    credits: {
      method: 'GET' as const,
      path: '/api/leaderboard/credits' as const,
      responses: {
        200: z.array(z.object({ user: userSchema, totalApprovedChange: z.number() })),
      },
    },
  },
  stats: {
    global: {
      method: 'GET' as const,
      path: '/api/stats/global' as const,
      responses: {
        200: z.object({ 
          totalPlayers: z.number(), 
          activeToday: z.number(),
          totalACoinsGained: z.number(), 
          totalCreditsGained: z.number() 
        }),
      },
    },
  },
  activities: {
    list: {
      method: 'GET' as const,
      path: '/api/activities' as const,
      responses: {
        200: z.array(activitySchema),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
