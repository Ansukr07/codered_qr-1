# Migration to Serverless Architecture

This document describes the migration from a separate frontend/backend structure to a unified serverless Next.js application.

## What Changed

### Structure
- **Before**: Separate `frontend/` and `backend/` folders
- **After**: Single unified structure with Next.js API routes

### Backend Routes → Next.js API Routes
All Express routes have been converted to Next.js API routes:

- `backend/routes/auth.js` → `app/api/auth/*/route.ts`
- `backend/routes/otp.js` → `app/api/otp/*/route.ts`
- `backend/routes/scan.js` → `app/api/scan/route.ts` and `app/api/scan/return/route.ts`
- `backend/routes/resources.js` → `app/api/resources/route.ts`
- `backend/routes/admin.js` → `app/api/admin/*/route.ts` (to be completed)

### Config Files
- `backend/config/supabase.js` → `lib/config/supabase.ts`
- `backend/config/email.js` → `lib/config/email.ts`

### Middleware
- `backend/middleware/auth.js` → `lib/middleware/auth.ts`
- `backend/middleware/rbac.js` → `lib/middleware/rbac.ts`

### Models
- `backend/models/*.js` → `lib/models/*.ts` (TypeScript versions)

### Migrations & Scripts
- `backend/migrations/` → `migrations/` (root level)
- `backend/scripts/` → `scripts/` (root level)
- `backend/uploads/` → `uploads/` (root level)

## Environment Variables

All environment variables should be in `.env.local` at the root level (not in `backend/.env.local`).

Required variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MONGODB_URI` (for Admin/Volunteer models)
- `JWT_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (for email)

## API Routes Created

### Authentication
- `POST /api/auth/login` - Login for admin/volunteer
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### OTP
- `POST /api/otp/generate` - Generate OTP for participant
- `POST /api/otp/verify` - Verify OTP and login participant

### Scanning
- `POST /api/scan` - Claim resource (issue bag)
- `POST /api/scan/return` - Return resource

### Resources
- `GET /api/resources` - Get all resources
- `POST /api/resources` - Create resource (admin only)

## Remaining Routes to Convert

The following routes still need to be converted:
- `backend/routes/admin.js` → `app/api/admin/*/route.ts`
- `backend/routes/announcements.js` → `app/api/announcements/route.ts`
- `backend/routes/gamification.js` → `app/api/gamification/route.ts`
- `backend/routes/helpRequests.js` → `app/api/help-requests/route.ts`
- `backend/routes/transactions.js` → `app/api/transactions/route.ts`
- `backend/routes/volunteers.js` → `app/api/volunteers/route.ts`

## Next Steps

1. **Install Dependencies**: Run `npm install` in the `frontend/` directory
2. **Update Environment Variables**: Copy `.env.local` to root if needed
3. **Test API Routes**: Verify all converted routes work
4. **Convert Remaining Routes**: Complete conversion of remaining Express routes
5. **Update Frontend API Calls**: Ensure all frontend code uses `/api/*` instead of `http://localhost:5000/api/*`
6. **Remove Backend Folder**: Once everything is migrated and tested

## Deployment

This is now a Next.js application that can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Any Node.js hosting** that supports Next.js

The application is serverless - each API route is a serverless function.


