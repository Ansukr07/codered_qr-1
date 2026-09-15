# React + Express + Supabase migration

## Target architecture

- `client/`: React 18 SPA built with Vite and React Router; static output is served by one Vercel project.
- `api/index.js`: the same project's serverless `/api/*` function, running the Express application from `backend/src/`. An explicit `/api/(.*)` Vercel route sends requests here before the SPA fallback.
- `backend/`: Express route implementation. It owns authorization, validation, privileged Supabase access, and HTTP-only application sessions; it is not deployed as a separate project.
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
- Same-origin Vercel serverless API for first-party Safari-compatible session cookies; no API proxy or second backend deployment.

## Local development

1. Copy `backend/env.example` to `backend/.env.local` and fill secrets.
2. Copy `client/env.example` to `client/.env.local`.
3. Run `npm install` in `backend/` and `client/`.
4. Run `npm run dev` in both directories.
5. Open `http://localhost:5173`.

## Deployment

Deploy **one Vercel project** from the repository root (Root Directory blank/`.`). Set the framework preset to Other, or use the checked-in root `vercel.json`. Its install command installs the `backend/` and `client/` packages; its build command builds Vite to `client/dist`. The explicit API route takes precedence over the filesystem and SPA fallback, so `/api/*` reaches Express instead of returning `index.html`.

Configure the **single project's server-side** environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `NFC_TOKEN_ENCRYPTION_KEY`, `PUBLIC_APP_URL=https://your-portal-domain`, `CLIENT_ORIGINS=https://your-portal-domain`, `NODE_ENV=production`, and optional `SUBMISSIONS_OPEN` / `EVENT_SCHEDULE_JSON`. Leave `VITE_API_URL` empty. Do not set `API_ORIGIN` or expose any service-role key with `VITE_`/`NEXT_PUBLIC_`.

After deployment, verify the site from the repository root:

```bash
npm run verify:deployment -- https://your-portal-domain
```

This fails if the URL still serves the legacy Next.js application, the same-project serverless health endpoint is unavailable, the SPA deep link fails, or the Express security headers are absent. The current `codered-participant-portal.vercel.app` production domain still serves the legacy Next.js app; switch its project to the repository-root build only after a pilot deployment passes.

The browser calls `/api` on its own domain and stores a first-party portal cookie, avoiding Safari cross-site cookie restrictions. Local Vite development still forwards `/api` to the Express process on port 5000; this local forwarding is not part of the Vercel deployment. Add preview and production origins to `CLIENT_ORIGINS` if direct cross-origin requests are needed.

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
- GitHub Actions runs both gates for changes under `backend/` or `client/` on pull requests and pushes to `main`.
- Optional live read-only API check: set `SMOKE_PARTICIPANT_ID` and `SMOKE_PARTICIPANT_EMAIL` in `backend/.env.local`, then run `npm run smoke:live`.
- With both local development servers running, `npm run smoke:proxy` in `backend/` verifies the Vite SPA deep-link and authenticated client → Express → Supabase local development path.
- Pilot participant OTP, onboarding, NFC/QR connection, volunteer issue/return, quest approval, and admin exports on the deployed HTTPS domains before traffic cutover.

The API includes compatibility fallbacks for deployments where `participants.github_link` is absent; in that case repository submission uses `github_profile`. Resource APIs intentionally use only columns present in the deployed schema.

## Security action required

`backend/env.example` previously contained a real Supabase service-role key. The template is sanitized now, but Git history still contains the old value. Rotate the service-role key in Supabase before using this repository for deployment, and update deployment secrets afterward.
