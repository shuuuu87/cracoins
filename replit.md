# CraCoins - No-Spend Challenge Tracker

## Overview
A full-stack web application for tracking the "4-Month No-Spend Challenge" for Mech Arena players. Users submit daily screenshots of their A-Coins and Credits to prove they haven't spent resources. Admins review and approve/reject submissions. A leaderboard ranks participants.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui components, located in `client/`
- **Backend**: Express.js (TypeScript) server in `server/`
- **Database**: PostgreSQL via Drizzle ORM, schema in `shared/schema.ts`
- **Auth**: Passport.js with local strategy (username/password) + session-based auth
- **File Uploads**: Multer, stored in `uploads/` directory

## Key Files
- `server/index.ts` - Express server entry point (port 5000)
- `server/routes.ts` - All API route definitions
- `server/auth.ts` - Passport authentication setup
- `server/storage.ts` - Database query layer
- `server/db.ts` - Drizzle DB connection
- `shared/schema.ts` - Drizzle schema (users, dailyLogs, activities)
- `shared/routes.ts` - Shared route/API type definitions
- `client/src/App.tsx` - React app root with routing
- `vite.config.ts` - Vite config (root: client/, aliases: @, @shared, @assets)

## Running the App
- Dev: `npm run dev` (uses tsx to run server/index.ts, Vite dev server proxied)
- Build: `npm run build`
- Production: `npm start`

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `SESSION_SECRET` - Express session secret
- `PORT` - Server port (default: 5000)

## Features
- User registration/login
- Daily resource submission with screenshot upload
- Admin review dashboard (approve/reject/batch)
- Leaderboards (A-Coins and Credits)
- Activity feed / announcements
- Anti-cheat: auto-disqualification for spending A-Coins
- User profile management
- Welcome screen for new users
