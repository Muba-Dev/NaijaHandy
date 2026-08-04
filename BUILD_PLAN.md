# NaijaHandy Build Plan

## Phase 0: Foundation ✅ COMPLETE

- ✅ GitHub monorepo with `frontend/` and `backend/`
- ✅ `.gitignore` protecting .env, node_modules, *.db, build output
- ✅ Root `package.json` orchestrating both apps with `npm run dev`
- ✅ NaijaHandy branding: logo mark, favicon, Brand component
- ✅ All UI references updated to NaijaHandy

## Phase 1: Product Core ✅ COMPLETE

1. ✅ Booking state machine: PENDING → CONFIRMED → COMPLETED/CANCELLED (explicit transitions)
2. ✅ Payment model with status tracking (PENDING, SUCCESS, FAILED, REFUNDED)
3. ✅ Supabase PostgreSQL migration: Regenerated migrations with PostgreSQL-compatible syntax
4. ✅ Connection pooler configured for reliable remote access
5. ✅ Prisma seeding: 2 customers, 3 artisans, demo bookings with payment references
6. ✅ API contracts validated:
   - Ownership check: Customer cannot modify own bookings (403)
   - Artisan can complete confirmed bookings (200)
   - Terminal states enforced: Cannot transition from COMPLETED/CANCELLED (409)
7. ✅ Backend fully connected to Supabase PostgreSQL
8. ✅ All endpoints tested and passing: `/api/artisans`, `/api/bookings`, `/api/auth/login`

## Phase 2: Production Backend

1. Migrate Express modules to NestJS one bounded module at a time.
2. Add secure authentication with JWT access + refresh tokens, role authorization, and refresh token revocation.
3. Wire backend auth into the frontend with token persistence and refresh retry.
4. Add artisan verification, service areas, reviews, and admin moderation.
5. Add Paystack transactions and verified, idempotent webhooks.

## Phase 3: Production Frontend

1. Replace remaining mock data with real API-driven UI flows.
2. Add loading, empty, validation, and error states across pages.
3. Add profile settings, saved artisans, booking history, and search refinements.
4. Improve responsive accessibility, mobile UX, and SEO-ready content.
5. Add real media uploads, map/address selection, and notification support.

## Phase 4: Quality And Release

- Add unit, integration, and Playwright end-to-end tests.
- Add API documentation, CI checks, logging, monitoring, and backups.
- Deploy Next.js to Vercel, the API to Railway or Render, and PostgreSQL to Neon or Supabase.

## Current Milestone

The project is in early Phase 3. The backend has been migrated to NestJS and now supports:
- Prisma-backed user, artisan, booking, payment, review, dispute, saved-artisan, and refresh token models.
- JWT access + refresh token issuance.
- Refresh token rotation and logout revocation.
- Protected API endpoints for customers, artisans, saved artisans, user data, and payments.
- Keyword + availability search on `/api/artisans` (q, category, city, minRating, available, sortBy).
- Saved-artisan endpoints: `GET/POST/DELETE /api/saved-artisans`.

The frontend now uses:
- Axios-based API client with access token injection.
- `401` refresh token retry logic.
- Logout flow that revokes refresh tokens and clears local session state.
- Dashboard pages wired to the API and auth flows instead of stale mock behavior.
- `AuthGuard` route protection for `/dashboard/*`, `/bookings`, `/settings`, and `/saved`.
- Auth-aware Navbar (dashboard link + logout for signed-in users).
- API-driven settings page (GET/PATCH `/users/me`), saved-artisans page, and search refinements.

### Admin features — DONE

- ✅ Schema: `User.status` (ACTIVE/SUSPENDED), `ArtisanProfile.approvalStatus` (PENDING/APPROVED/REJECTED) + `verificationStatus` (UNVERIFIED/VERIFIED), `Review.status` (APPROVED/HIDDEN), new `Dispute` model (OPEN/RESOLVED/DISMISSED) with relations to Booking and the raising user. Applied via `20260802210757_admin_features` migration + backfill (existing artisans → APPROVED/VERIFIED).
- ✅ Backend admin module (`/api/admin/*`) guarded by `JwtAuthGuard + RolesGuard` with `@Roles('ADMIN')`: stats, artisan approval/verification, user management/suspend (cannot suspend admins), review moderation, bookings + payments, dispute resolution.
- ✅ Enforcement: suspended users are blocked at login, refresh, and every JWT-protected request (`jwt.strategy.ts` re-checks DB status); unapproved/REJECTED artisans are hidden from public search + profile detail (`/api/artisans`).
- ✅ Customer dispute filing: `POST /api/bookings/:id/dispute` (owner-only, one open dispute per booking, reason ≥ 10 chars).
- ✅ Admin seeded at `admin@naijahandy.com` / `password123`; seed sets artisans to APPROVED/VERIFIED.
- ✅ Admin dashboard at `/dashboard/admin` (AuthGuard `ADMIN`): Overview stats, Artisans (approve/reject/verify), Users (suspend/reactivate + search), Reviews (approve/hide), Bookings, Payments, Disputes (resolve/dismiss with resolution note). Navbar + AuthGuard route ADMIN users correctly.

### Paystack payments — DONE

- ✅ Payment module (`/api/payments/*`): `POST initialize` (owner-only, one payment per booking, generates Paystack reference + metadata), `GET verify/:reference` (owner/admin-only), `POST webhook` (public, HMAC-SHA512 `x-paystack-signature` verification with timing-safe compare).
- ✅ `PAYSTACK_MOCK=true` mode: full flow runs offline (fake authorization_url) so the checkout works without real keys; flip it off with real test keys for live Paystack behavior. Env vars in `.env` + `.env.example` (`PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_BASE_URL`, `PAYSTACK_CALLBACK_URL`, `PAYSTACK_MOCK`).
- ✅ Idempotent finalization: success marks `Payment SUCCESS` + `Booking paymentStatus=PAID`, sets `paymentReference`/`paidAt`; duplicate webhooks/verifies are no-ops (`{ received: true, duplicate: true }`); amount mismatches and non-success events mark `FAILED`.
- ✅ Payment gating: `PENDING → CONFIRMED` is blocked (403) until the booking is PAID.
- ✅ Booking API exposes `paymentStatus` + payment on `GET /api/bookings`.
- ✅ Frontend: booking now redirects to Paystack checkout (`authorization_url`), `/bookings` shows Paid/Unpaid badges + a "Pay Now" button, and verifies the payment on return (`?reference=`). Seed creates real `Payment` rows for the seeded PAID bookings so admin revenue/payments populate.
- ✅ Verified end-to-end (mock): create → unpaid gate 403 → non-owner 403 → initialize → verify → PAID → confirm 200 → re-init 400 → webhook finalize → duplicate idempotent → bad/missing/tampered signatures 401 → admin revenue populated.

### Phase 2 Cleanup — DONE

- ✅ Legacy Express artifacts removed (`src/index.ts`, `src/routes/`, `src/middleware/`); NestJS-only startup verified.
- ✅ Added `refresh_tokens` migration (table was missing from the DB) and `saved_artisans` FK migration.
- ✅ Frontend route protection + auth redirects for dashboard/protected pages.
- ✅ Refresh-token rotation, logout revocation, and session persistence verified end-to-end (login → /users/me → refresh → old-token reuse 401 → logout → reuse 401).
- ✅ Booking state machine + ownership rules verified (accept/complete by artisan, customer cancel, terminal-state 403, ownership 403).

### Ready for Phase 3

- ✅ Replace remaining mock data with real API-driven UI flows (settings, saved artisans, search).
- ✅ Add loading, empty, validation, and error states across pages.
- ✅ Admin platform (Phase 2 item 4): approvals, verification, user suspension, review moderation, bookings/payments, disputes.
- 🔄 Profile settings, saved artisans, booking history, and search refinements (settings + saved artisans + search done; booking history pending polish).
- Pending: improve responsive accessibility, mobile UX, SEO-ready content.
- Pending: real media uploads, map/address selection, notification support.

### Targeted tests — DONE

- ✅ Test tooling: `jest` + `ts-jest` + `supertest` + `@nestjs/testing@10` installed in `backend/`; `npm test` (unit, `test/unit/`) and `npm run test:e2e` (e2e, `test/e2e/`) scripts; `tsconfig.test.json` + `test/jest-e2e.json`.
- ✅ Unit tests (33): booking state machine transitions (`domain/booking.ts`), `JwtStrategy.validate` suspension/deletion checks, `AuthService` login/refresh (suspension, expiry, rotation, revocation, logout), `BookingService.updateStatus` ownership + payment gate + transitions, `BookingService.raiseDispute` ownership + single-open-dispute, `PaymentService.handleWebhook` HMAC-SHA512 signature (missing/invalid/tampered/correct) + idempotency + amount-mismatch FAILED.
- ✅ E2E tests (39) against the real app + Supabase, self-cleaning:
  - Auth: register/duplicate/validation, login, wrong password, 401 on protected routes (no/garbage token), `/users/me`, refresh rotation + replay rejection, logout revocation, ARTISAN registration.
  - Booking: auth gate, short description, ownership 403, UNPAID confirm gate 403, invalid status 400, customer cancel, terminal-state 403, own-bookings list, dispute + duplicate-dispute 403.
  - Admin: non-admin 403, unauthenticated 401, stats/users/payments, suspend → token + login 401 → reactivate, cannot-suspend-admin 400, invalid status 400.
  - Payments: non-owner/unauth initialize 403/401, mock initialize → verify → PAID + confirm 200, re-init 400, non-owner verify 403, duplicate webhook, amount-mismatch → FAILED (booking stays UNPAID).

### Phase 4 — Quality And Release

- ✅ Unit + integration (e2e) test suites for the backend (see "Targeted tests" above).
- ✅ API documentation: Swagger/OpenAPI at `GET /api/docs` (docs JSON at `/api/docs-json`). `@nestjs/swagger@8` added to the backend.
- ✅ CI checks: `.github/workflows/ci.yml` — backend build + unit tests, backend e2e (runs only when the `DATABASE_URL` secret is configured; seeds the DB, which is idempotent), frontend lint + build. Runs on push to `main` and pull requests.
- ✅ Logging: `morgan('combined')` request logging in `main.ts` (skipped in tests) + Nest bootstrap logs.
- ✅ Monitoring: `GET /api/health` — DB connectivity check returning `{ status, db, timestamp }`, 503 when the DB is down.
- ✅ Backups: `backend/scripts/backup-db.sh` (timestamped `pg_dump`, keeps newest `BACKUP_KEEP` = 14) with cron example; `npm run db:backup`; `backups/` gitignored.
- ✅ Frontend lint: ESLint 9 flat config (`eslint.config.mjs`) + `npm run lint`; fixed all `no-explicit-any` and unused-variable issues across the app.
- ✅ Frontend Playwright e2e (`frontend/e2e/`, `playwright.config.ts`, `npm run test:e2e`): 8 tests against the real app + DB, self-cleaning via `e2e/support/db.ts` (unique description marker → deletes bookings/payments/disputes):
  - Auth: protected-route redirect, invalid-credentials error, customer login → dashboard, logout → home + protected pages locked.
  - Browse: search lists artisans from the API, artisan profile shows details + booking form.
  - Booking + payment: book on the profile page → mock Paystack redirect → `?reference=` verify → PAID; Pay Now on an API-created UNPAID booking → verify → PAID.
  - CI job `frontend-e2e` in `.github/workflows/ci.yml` (Playwright install, DB seed, artifact upload), gated on the `DATABASE_URL` secret.
- ✅ Deployment (Vercel / Render / Neon) — **DONE**: frontend live, backend live, DB migrated+seeded, Paystack mock, CI green.

### Next action for another developer

1. (Done) Deployment: Next.js → Vercel, API → Render, PostgreSQL → Neon; wire the CI e2e `DATABASE_URL` secret to the production DB.

### Deployment — how to start (COMPLETE)

Live stack: Next.js → Vercel · NestJS API → Render · PostgreSQL → Neon · Payments → Paystack (mock)

Live URLs:
- Frontend: `https://naija-handy.vercel.app` — `NEXT_PUBLIC_API_URL = https://naijahandy.onrender.com/api`
- Backend: `https://naijahandy.onrender.com` — healthcheck `GET /api/health` → `{ status: 'ok', db: 'up' }`
- DB: Neon (single DB shared by prod + CI e2e), migrated + seeded via the **DB Maintain** workflow.

#### 0. Accounts (done)
- ✅ GitHub (`Muba-Dev/NaijaHandy`), ✅ Vercel, ✅ Render, ✅ Neon
- Neon pooled connection string (strip `&channel_binding=require`):
  `postgresql://neondb_owner:npg_7o0aXKfvySHE@ep-shy-feather-axg4z1jt-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require`
- Note: the local machine can't reach Neon on 5432 (ISP filters non-443 egress) → all DB operations (migrate/seed) run via the **DB Maintain** workflow on GitHub Actions (Render free tier has no shell/console).

#### 1. Repo prep (dev) — START HERE (done)
- ✅ Deleted stale `frontend/pnpm-lock.yaml`.
- ✅ `backend/package.json`: added `"postinstall": "prisma generate"` and `"db:deploy": "prisma migrate deploy"`.
- ✅ Added `backend/render.yaml`:
  ```yaml
  services:
    - type: web
      name: naijahandy-api
      env: node
      plan: free
      buildCommand: npm install && npm run build
      preDeployCommand: npm run db:deploy
      startCommand: npm run start
      healthCheckPath: /api/health
  ```
- ✅ Added `backend/.nvmrc` and `frontend/.nvmrc` containing `22`.

#### 2. Neon (you) — done
- Used a single Neon DB for prod + CI e2e. (Optional later: add a separate `naijahandy_ci` DB so CI e2e data never touches prod.)

#### 3. Render backend (you) — done
- New → Web Service → connect GitHub → `Muba-Dev/NaijaHandy`, **Root Directory `backend/`** (this was the original deploy bug — Render was building at the repo root).
- Build `npm install && npm run build`, Start `npm run start`, `preDeployCommand: npm run db:deploy` (via `backend/render.yaml`).
- Env vars:
  - `DATABASE_URL` = the Neon pooled string above
  - `JWT_SECRET` = strong random value
  - `FRONTEND_URL` = `https://naija-handy.vercel.app`
  - `PAYSTACK_MOCK` = `true`
  - `PAYSTACK_BASE_URL` = `https://api.paystack.co`
  - `PAYSTACK_CALLBACK_URL` = `https://naija-handy.vercel.app/bookings`
- Result: `https://naijahandy.onrender.com`.

#### 4. Vercel frontend (you) — done
- Add New → Project → import `Muba-Dev/NaijaHandy`, root dir `frontend/`.
- Env: `NEXT_PUBLIC_API_URL` = `https://naijahandy.onrender.com/api` (baked at build time — redeploy after changing). Result: `https://naija-handy.vercel.app`.

#### 5. Wire + seed (dev) — done
- Backend `FRONTEND_URL` / `PAYSTACK_CALLBACK_URL` set to the real Vercel URL.
- Seeding/migrations run from the **DB Maintain** workflow: Actions → DB Maintain → Run workflow (`run_seed: true`). Render free tier has **no shell**, so DB ops must go through this workflow.
- Verified `GET /api/health` → `{ status: 'ok', db: 'up' }`; CORS from the Vercel origin; real login → `201` ADMIN.

#### 6. CI wiring (dev) — done
- GitHub repo secrets: `DATABASE_URL` (Neon string) and `JWT_SECRET`.
- CI runs on every push: backend unit, backend e2e, frontend lint+build, frontend Playwright e2e — all green against Neon.
- Gotchas fixed along the way (see git log):
  - `secrets` context is **not allowed in job-level `if`** — guard inside a step instead.
  - `working-directory: backend` default broke the step that ran before checkout — checkout first.
  - Seed/env: `DATABASE_URL` must be set at **job level** so every step (including `db:seed`) gets it; frontend-e2e must `npm ci` in `backend/` before seeding.
  - `frontend-e2e` has `needs: [backend-e2e]` — both jobs seed the **same shared DB**, so they can't run in parallel.
  - `JWT_SECRET` fallback in CI: `${{ secrets.JWT_SECRET || 'ci-test-jwt-secret' }}`.
  - App bug: refresh tokens were plain JWTs, so two logins of the same user in the same second collided on the `token` unique constraint — fixed with a random `nonce` in the token payload (`backend/src/auth/auth.service.ts`).
  - App bug: `logout()` cleared localStorage only after the network call — a page unload mid-request leaked the session. Now clears tokens synchronously first (`frontend/src/lib/api.ts`).
  - e2e tests: dropped racy assertions on the transient `/bookings?reference=` URL (the page strips the query via `replaceState`) and on the trivially-true post-logout URL.
