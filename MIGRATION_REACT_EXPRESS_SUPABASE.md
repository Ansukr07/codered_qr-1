# React + Express + Supabase migration

## Target architecture

- `client/`: React 18 SPA built with Vite and React Router.
- `backend/`: Express API. It owns authorization, validation, privileged Supabase access, and HTTP-only application sessions.
- Supabase: the only database and participant OTP provider. MongoDB/Mongoose are not part of the target.
- `frontend/`: current Next.js production application, retained temporarily as a rollback/reference implementation.

The browser never receives the Supabase service-role key. All privileged database operations go through Express.

## Implemented

- Supabase-only Express application factory and health endpoint.
- Participant email OTP generation and verification.
- Admin/volunteer password login.
- HTTP-only cookie session lookup and logout.
- Participant profile retrieval and validated profile updates.
- React login, protected dashboard, logout, and onboarding/profile editor.
- Explicit origin allowlist and credentialed CORS.
- NFC issue/recovery/revocation, role-aware NFC resolution, participant connections, and QR backup scanning.
- Quest proof submission through private Supabase Storage and staff verification.
- Announcements, help requests, resource issuing/returns, live resource tracking, and CSV exports.
- Participant event assignment, configurable schedule, leaderboard, and repository submission.
- Admin overview, participant roster/detail, staff management, repository audit, and NFC administration.
- Same-origin Vercel API proxy for first-party Safari-compatible session cookies.

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

Set each Vercel project's Root Directory explicitly: `backend` for the API project and `client` for the React project. The backend uses `api/[...path].js` so `/api/*` reaches Express without a path-rewriting shim. The client uses its own `api/[...path].js` as the first-party proxy.

The client includes a same-origin `/api` serverless proxy. The browser therefore stores a first-party portal cookie instead of a third-party API cookie, avoiding Safari's cross-site cookie restrictions when both projects use separate `vercel.app` domains. The local Vite server applies the same pattern by proxying `/api` to port 5000. Add preview and production client origins explicitly to `CLIENT_ORIGINS`.

## Migration sequence

1. Authentication and participant profile — complete.
2. NFC token resolution, connection creation, and volunteer resource actions — complete.
3. Participant networking/profile card, scan analytics, and QR backup — complete.
4. Quests, proof upload to Supabase Storage, and volunteer verification — complete.
5. Resource tracking, help desk, announcements, GitHub, seating, and admin tools — complete for the new stack.
6. Production pilot and traffic cutover — pending. Keep `frontend/` as rollback until the pilot passes.

Each phase must migrate its server routes and React screens together. Do not point the new React UI at the old Next.js `/api` implementation.

## Verification gates

- `cd backend && npm run check && npm test`
- `cd client && npm run build`
- Optional live read-only API check: set `SMOKE_PARTICIPANT_ID` and `SMOKE_PARTICIPANT_EMAIL` in `backend/.env.local`, then run `npm run smoke:live`.
- Pilot participant OTP, onboarding, NFC/QR connection, volunteer issue/return, quest approval, and admin exports on the deployed HTTPS domains before traffic cutover.

The API includes compatibility fallbacks for deployments where `participants.github_link` is absent; in that case repository submission uses `github_profile`. Resource APIs intentionally use only columns present in the deployed schema.

## Security action required

`backend/env.example` previously contained a real Supabase service-role key. The template is sanitized now, but Git history still contains the old value. Rotate the service-role key in Supabase before using this repository for deployment, and update deployment secrets afterward.
