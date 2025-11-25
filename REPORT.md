# SANIT‑M Application — Project Report

Date: 2025-11-03
Branch: `remove-supabase-20251103`

---

## 1. Summary

SANIT‑M is a college portal web application. The frontend is built with React + Vite + TypeScript. The backend is a minimal Node + Express + Prisma service (in `server/`) used for authentication, database access and server-side functions. The project recently migrated away from Supabase client/functions and now uses a local server API.

This report documents the architecture, technologies used, how the system works, setup instructions, APIs, the Supabase removal work performed, verification steps, risks, and recommended next steps.

---

## 2. Tech stack

- Frontend
  - Vite (dev server & build)
  - React 18 + TypeScript
  - Tailwind CSS (with `tailwind.config.ts`)
  - React Router
  - Small UI components in `src/components` and shared UI primitives in `src/components/ui`
- Backend
  - Node.js + Express (under `server/`)
  - Prisma ORM (schema at `server/prisma/schema.prisma`)
  - TypeScript for server source (`server/src`)
- Dev & Tooling
  - ESLint, TypeScript, Vite
  - Git for source control
- Previously used but removed
  - Supabase Functions and client (removed/migrated to local server)

---

## 3. High-level architecture

- Browser → Frontend (`src/`) that calls:
  - `src/lib/api.ts` — a small shim that the frontend calls for auth, db, and functions. It proxys to backend endpoints like `/api/auth/*`, `/api/db`, and `/api/functions/*`.
- Backend server (`server/`) implements REST endpoints and database interactions using Prisma.
- Database and migrations are managed by Prisma (migrations present under `server/prisma/migrations`).

Files of interest:
- Frontend entry: `src/main.tsx`
- Frontend API shim: `src/lib/api.ts`
- App pages: `src/pages/*`
- Backend: `server/src` and Prisma schema at `server/prisma/schema.prisma`

Note: The project originally used `supabase/functions/*` for OTP send/verify, but these have been removed and the frontend uses the `server/` API instead.

---

## 4. How it works (user flows)

- Authentication
  - Frontend calls `api.auth.signInWithPassword` / `api.auth.signUp` / `api.auth.getSession` (these are implemented in `src/lib/api.ts` and proxied to `server/` endpoints).
  - Server issues cookies/sessions / JWTs per the server implementation.

- Data operations
  - Frontend uses `api.from(table)` as a small builder that sends a POST to `/api/db` with a builder state (select/insert/update/delete). The server interprets and executes queries via Prisma.

- OTP (previously)
  - OTP sending & verification used to be implemented in `supabase/functions/send-otp` and `supabase/functions/verify-otp` (Deno). These were migrated/removed in favor of server-side endpoints. If OTP is still required, implement `server/src/routes/otp.ts`.

---

## 5. Setup & run (developer)

Prerequisites: Node 18+, npm, Git, and a database for Prisma (configured in `server/.env` or environment variables used by Prisma).

1. Clone repo and switch to branch (if needed):

```cmd
git clone <repo-url>
cd "SANIT-M-Application-"
git checkout remove-supabase-20251103
```

2. Install frontend deps and run dev:

```cmd
npm install
npm run dev
```

3. Backend (server) setup and dev:

```cmd
cd server
npm install
# run dev server
npm run dev
# or build
npm run build
```

4. Prisma (server):

```cmd
cd server
# configure DATABASE_URL in environment variables
npm run prisma:generate
npm run prisma:migrate
```

---

## 6. Environment variables

- Frontend: no required Supabase env variables (the `.env` currently contains a comment noting Supabase vars were removed).
- Backend: configure database connection and any mail/API keys used by server (see `server/README.md` and `server/.env` if present).

Key places to check:
- `server/prisma/schema.prisma` — DB model
- `server/.env` or CI secrets — DB URL, JWT secret, email provider API keys, etc.

---

## 7. REST endpoints (overview)

The frontend `src/lib/api.ts` proxies to the following paths. Implementations live in the backend under `server/src`:

- Auth
  - `POST /api/auth/signin`
  - `POST /api/auth/signup`
  - `GET /api/auth/user` (session)
  - `POST /api/auth/signout`
- DB
  - `POST /api/db` — receives a builder state (table, op, filters, payload) and executes the operation server-side.
- Functions
  - `POST /api/functions/:name` — generic function invocation endpoint. Use for server-side operations that used to be Supabase Functions.

Note: If OTP endpoints are required, add `POST /api/functions/send-otp` and `POST /api/functions/verify-otp` (or create dedicated routes like `/api/otp/send` and `/api/otp/verify`) in `server/src/routes` and update the frontend to call them through `api.functions.invoke(name)` or direct fetch.

---

## 8. Supabase removal — what changed

- Removed files and stubs modified during migration:
  - `supabase/functions/send-otp/index.ts` — previously handled OTP send via Supabase client; removed.
  - `supabase/functions/verify-otp/index.ts` — previously handled OTP verify; removed.
  - `src/integrations/supabase/client.ts` — adapter re-exporting `@/lib/api` (deleted).
  - `src/integrations/supabase/types.ts` — shim removed.
- `eslint.config.js` updated to remove the ignore for `supabase/functions/**`.

These deletions were done to fully detach the frontend and repo from Supabase client/functions and move the functionality to the local server.

If you host or run CI that previously expected `supabase/functions`, update your deploy configuration to use the `server/` implementation or remove the reference.

---

## 9. Verification / checks performed

- Repo-wide textual search for `supabase` — confirmed frontend and server do not import `@supabase/supabase-js`.
- Confirmed `package.json` (root & `server/`) have no Supabase dependencies.
- Confirmed frontend calls `src/lib/api.ts` (the central shim) rather than a Supabase client.

Local build & lint: please run the following locally to validate (recommended):

```cmd
# frontend
npm install
npm run lint
npm run build
# backend
cd server
npm install
npm run build
```

---

## 10. Risks & mitigations

- External deployment (hosting/CI) may reference `supabase/functions` — verify any hosting dashboard or CI config.
  - Mitigation: update pipeline to build/deploy `server/` or remove the Supabase function deploy step.
- If OTP flows are in use, they currently reference removed functions. Ensure the frontend calls new server endpoints for OTP.
- OneDrive sync may cause file-lock issues on Windows — if git operations fail, pause OneDrive or run git from a non-synced folder.

---

## 11. Next steps (recommended priorities)

1. Finalize git commit & push for the removal changes (if not already committed). Example:

```cmd
git add -A
git commit -m "chore(remove-supabase): remove Supabase functions and adapter shims"
git push origin remove-supabase-20251103
```

2. Implement server-side OTP endpoints under `server/src/routes/otp.ts` and wire frontend `api.functions.invoke('send-otp')` / `invoke('verify-otp')` to these routes (or update `src/lib/api.ts` to map them).
3. Run full lint and build in CI and fix any issues.
4. Remove documentation comments referencing Supabase or add an entry to the project README to note the migration.

---

## 12. Appendix — Useful commands (cmd.exe)

Staging, commit, push:

```cmd
git status
git add -A
git commit -m "chore(remove-supabase): remove Supabase functions and adapter shims"
git push origin remove-supabase-20251103
```

Run frontend dev/build:

```cmd
npm install
npm run dev
npm run build
npm run lint
```

Run backend dev/build (server):

```cmd
cd server
npm install
npm run dev
npm run build
```

---

If you want, I can:
- Commit the `REPORT.md` file for you now (say: "Commit report"), or
- Add an OTP server scaffold under `server/src/routes/otp.ts` and sample tests (say: "Scaffold OTP server"), or
- Export this report as `REPORT.pdf` (I can create markdown and help convert locally).


