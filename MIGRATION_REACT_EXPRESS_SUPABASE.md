# React + Express + Supabase migration

## Target architecture

- `client/`: React 18 SPA built with Vite and React Router.
- `backend/`: Express API. It owns authorization, validation, privileged Supabase access, and HTTP-only application sessions.
- Supabase: the only database and participant OTP provider. MongoDB/Mongoose are not part of the target.
- `frontend/`: current Next.js production application, retained temporarily as a rollback/reference implementation.

The browser never receives the Supabase service-role key. All privileged database operations go through Express.

## Implemented in phase 1

- Supabase-only Express application factory and health endpoint.
- Participant email OTP generation and verification.
- Admin/volunteer password login.
- HTTP-only cookie session lookup and logout.
- Participant profile retrieval and validated profile updates.
- React login, protected dashboard, logout, and onboarding/profile editor.
- Explicit origin allowlist and credentialed CORS.

## Local development

1. Copy `backend/env.example` to `backend/.env.local` and fill secrets.
2. Copy `client/env.example` to `client/.env.local`.
3. Run `npm install` in `backend/` and `client/`.
4. Run `npm run dev` in both directories.
5. Open `http://localhost:5173`.

## Deployment

Deploy the React client and Express API as separate Vercel projects. Configure:

- API: `CLIENT_ORIGINS=https://your-react-domain`, Supabase variables, `JWT_SECRET`, `NFC_TOKEN_ENCRYPTION_KEY`, and `PUBLIC_APP_URL`.
- Client: leave `VITE_API_URL` empty and set server-only `API_ORIGIN=https://your-api-project.vercel.app`.

The client includes a same-origin `/api` serverless proxy. The browser therefore stores a first-party portal cookie instead of a third-party API cookie, avoiding Safari's cross-site cookie restrictions when both projects use separate `vercel.app` domains. The local Vite server applies the same pattern by proxying `/api` to port 5000. Add preview and production client origins explicitly to `CLIENT_ORIGINS`.

## Migration sequence

1. Authentication and participant profile — phase 1 complete.
2. NFC token resolution, connection creation, and volunteer resource actions.
3. Participant networking/profile card and scan analytics.
4. Quests, proof upload to Supabase Storage, and volunteer verification.
5. Resource tracking, help desk, announcements, GitHub, seating, and admin tools.
6. Route parity tests, production pilot, traffic cutover, then remove Next.js routes.

Each phase must migrate its server routes and React screens together. Do not point the new React UI at the old Next.js `/api` implementation.

## Security action required

`backend/env.example` previously contained a real Supabase service-role key. The template is sanitized now, but Git history still contains the old value. Rotate the service-role key in Supabase before using this repository for deployment, and update deployment secrets afterward.
