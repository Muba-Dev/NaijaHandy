# NaijaHandy

Nigeria's marketplace for finding, vetting, and hiring verified home-service artisans — plumbers, electricians, carpenters, painters, cleaners, and more.

## Problem

Finding a reliable artisan in Nigeria is a trust gamble. There is no dependable way to verify skills, compare prices, read genuine reviews, or guarantee the work. Customers end up with overpriced or unfinished jobs; good artisans struggle to reach new customers.

## Solution

NaijaHandy connects customers with vetted artisans and protects both sides:

- **Honest trust signals** — every rating, review, and "jobs completed" figure on a profile is backed by a real completed booking in the database, never cosmetic numbers.
- **Secure payments** — customers pay through Paystack when they book; the booking is only confirmed after payment succeeds.
- **Disputes & guarantee** — paid bookings are covered by the NaijaHandy Guarantee, with a dispute flow to raise issues within 14 days of the job date.
- **AI support** — a RAG assistant answers questions from the Help Centre articles and can escalate to a human with the full chat transcript.

## Target Users

| Role | Capabilities |
|---|---|
| Customer | Browse/search artisans, save favourites, send instant requests, book & pay, review completed jobs, rebook with one tap, raise disputes |
| Artisan | Accept/decline requests (incl. urgent same-day jobs), manage availability, update profile, upload portfolio photos, submit ID verification, track earnings |
| Admin | Approve/suspend users, approve artisan profiles & verification documents, review disputes, monitor bookings |

## Features

- Live homepage platform stats (verified artisans, cities, completed jobs, reviews) from the API
- Search with category, city, price-range, rating, and distance filters
- Per-category deep links from the homepage into pre-filtered search
- Booking status lifecycle: `PENDING → CONFIRMED → COMPLETED`, `PENDING → REJECTED`, `CONFIRMED → CANCELLED`; payment statuses `UNPAID / PAID / REFUNDED`
- Urgent same-day bookings flagged and surfaced to artisans
- JWT auth (15 min access + 30-day rotated, revocable refresh tokens) with Google OAuth
- Password reset by email, Paystack payments (with offline mock mode), notifications, disputes
- `GET /api/artisans/stats` platform-statistics endpoint
- AI support chat with source links and human escalation

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL (Supabase/Neon) + Prisma ORM |
| Auth | JWT access + refresh tokens (rotated, revocable), bcrypt, Google OAuth |
| Payments | Paystack (with `PAYSTACK_MOCK` offline mode) |
| Support chat | RAG over Help Centre articles (pgvector embeddings + LLM, offline keyword mock) |
| Tests | Jest (backend unit), Playwright (frontend e2e, axe accessibility) |

## Architecture

```
Frontend (Next.js, port 3000)
      │  HTTP + JWT (never talks to the DB directly)
NestJS API (backend, port 4000)
      │  Prisma
PostgreSQL (Supabase)
```

- RLS is enabled on all public tables as a defense-in-depth boundary; ownership and role authorization are enforced by the NestJS API, which connects as the `postgres` role (`BYPASSRLS`).
- Swagger docs (`/api/docs`) are served only when `NODE_ENV !== 'production'`.
- The app fails fast at startup if `JWT_SECRET` is missing in production instead of falling back to a hardcoded secret.

## Project Structure

```
NaijaHandy/
├── frontend/                 ← Next.js 15 app
│   ├── src/app/              ← Routes (pages, dashboards, admin, help, guarantee…)
│   ├── src/components/       ← UI components (navbar, StatusBadge, artisan cards…)
│   ├── src/lib/              ← API client (axios), utilities, demo data
│   ├── src/types/            ← TypeScript interfaces
│   └── e2e/                  ← Playwright end-to-end tests
└── backend/                  ← NestJS API
    ├── prisma/
    │   ├── schema.prisma     ← Database schema
    │   └── seed.ts           ← Realistic demo seed (15 artisans, 50 reviews)
    ├── src/
    │   ├── main.ts           ← Bootstrap (helmet, CORS, rate limit, Swagger)
    │   ├── auth/             ← JWT, roles guard, OAuth, password reset
    │   ├── artisan/          ← Profiles, search, platform stats
    │   ├── booking/          ← Bookings, status transitions, disputes
    │   ├── payment/          ← Paystack integration (mock-capable)
    │   ├── admin/            ← Approvals, user management
    │   ├── support-chat/     ← AI assistant + human escalation
    │   ├── help/             ← Help Centre articles + embeddings
    │   └── …
    └── test/                 ← Jest unit + e2e tests
```

## Getting Started

### Backend

```bash
cd backend
npm install
cp .env.example .env       # fill in DATABASE_URL + JWT_SECRET at minimum
npx prisma migrate dev
npm run db:seed            # realistic demo data (see below)
npm run dev                # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                # http://localhost:3000
```

### Environment variables

Key backend variables (`backend/.env`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase/PostgreSQL connection string (session pooler) |
| `JWT_SECRET` | Signs access + refresh tokens. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `FRONTEND_URL` | CORS origin (default `http://localhost:3000`) |
| `PORT` | API port (default `4000`) |
| `SMTP_*`, `EMAIL_ENABLED` | Email for password reset + notifications |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (optional) |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_MOCK` | Paystack payments; `PAYSTACK_MOCK=true` runs offline |
| `SUPPORT_CHAT_ENABLED` / `SUPPORT_CHAT_MOCK` / `LLM_API_KEY` | AI support chat; mock mode needs no API key |
| `SEED_DEMO` | `true` marks seeded users as demo accounts (set `0` for production) |

Key frontend variables (`frontend/.env.local`):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (e.g. `http://localhost:4000/api`) |
| `NEXT_PUBLIC_APP_URL` | Public site URL for canonical/OpenGraph/sitemap |
| `NEXT_PUBLIC_SUPPORT_CHAT_ENABLED` | Show the chat widget (must match backend) |

### Demo data

`npm run db:seed` is idempotent and seeds honest, internally consistent data: 15 artisans (incl. AC servicing, welding, and electronics repair), 6 demo customers, 50 reviews — each backed by a real `COMPLETED`+`PAID` booking with a payment record — plus active demo bookings (confirmed, pending, urgent, and rejected).

All seeded accounts use password `password123`. Key emails:

- Admin: `admin@naijahandy.com`
- Customers: `chisom@example.com`, `bayo@example.com`, `nneka@example.com`, `ada@example.com`, `kelechi@example.com`, `zainab@example.com`
- Artisans: `emeka@example.com` (plumber), `fatima@example.com` (electrician), `chidi@example.com` (carpenter), `amaka@example.com` (painter), `yusuf@example.com` (auto mechanic), `ngozi@example.com` (interior designer), and more

Ratings and completed-job counts shown on profiles are recomputed from the actual review/booking rows — the seed never writes fake aggregates.

## Testing

```bash
# Backend unit tests
cd backend && npm test

# Frontend build + type check + lint
cd frontend && npm run build

# Frontend e2e (Playwright + axe a11y). Runs best with CI=true so the
# frontend is served from a production build instead of the dev server.
cd frontend && CI=true npx playwright test
```

## API Overview

| Module | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/refresh`, `/logout`, `GET /api/auth/google`, password reset |
| Artisans | `GET /api/artisans`, `GET /api/artisans/:id`, `GET /api/artisans/stats`, `PATCH /api/artisans/me` |
| Bookings | `POST /api/bookings`, `GET /api/bookings`, `PATCH /api/bookings/:id/status`, dispute endpoints |
| Payments | Paystack initialize/verify with mock support |
| Admin | Approvals, user status, disputes |
| Help / Support chat | Help Centre articles, `/api/support/chat`, escalation to a ticket |
| Users | `GET/PATCH /api/users/me`, saved artisans, notifications, verification documents |

Interactive Swagger docs: `http://localhost:4000/api/docs` (non-production only).

Protected routes require `Authorization: Bearer <accessToken>`.

## Security Notes

- `JWT_SECRET` is mandatory in production (startup fails fast if missing — see `backend/src/config.ts`).
- Passwords hashed with bcrypt (cost 12); refresh tokens are stored server-side, rotated on use, and revoked on logout.
- Helmet, CORS allow-listing, and per-IP rate limiting (`express-rate-limit`) are enabled.
- Swagger is disabled in production.
- Supabase RLS is enabled as a second boundary; see `backend/supabase/` for the migration, rollback, backup, and verification scripts.

## Deployment

- **Frontend → Vercel**: import the repo, set root directory to `frontend`, add `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL`, deploy.
- **Backend → Render/Railway**: root directory `backend`, build `npm install && npx prisma generate && npm run build`, start `npm start`, set `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`.
- **Database**: Supabase PostgreSQL. Apply migrations with `npx prisma migrate deploy`.

## Future Work

- ID document verification pipeline with manual review UI
- Push/mobile notifications for booking status changes
- Escrow-style milestone payments for large jobs
- Native mobile app
