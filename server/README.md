SANIT Server
===============

This folder contains a minimal Node + Express + Prisma server to replace Supabase usage in the frontend.

Features scaffolded:
- JWT-based auth with httpOnly cookie
- Prisma schema for User, Profile, Feedback (Postgres datasource configured via DATABASE_URL)
- Endpoints:
  - POST /api/auth/signup
  - POST /api/auth/signin
  - POST /api/auth/signout
  - GET  /api/auth/user
  - GET  /api/profile
  - GET  /api/feedbacks
  - POST /api/feedbacks
  - PUT  /api/feedbacks/:id
  - POST /api/functions/send-otp (dev OTP)
  - POST /api/functions/verify-otp
  - POST /api/functions/submit-hash (placeholder)

How to run (local dev):

1. Copy `.env.example` to `.env` and set DATABASE_URL and JWT_SECRET.
2. Install packages:

   npm install

3. Generate Prisma client and run migrations (Postgres required):

   npx prisma generate
   npx prisma migrate dev --name init

4. Start dev server:

   npm run dev

Notes:
- For simple local testing you can point DATABASE_URL at a local Postgres instance. If you prefer, change Prisma datasource to SQLite for quick experiments.
- File uploads currently served from `uploads/` (local). Replace with S3 signed URL flow in `routes/feedbacks.ts` or a dedicated `/api/storage` route.
- The server includes placeholders for encryption, hashing, and submitting hashes to a blockchain. Implement those steps in `routes/feedbacks.ts` or `routes/functions.ts` to match your flow diagram.
