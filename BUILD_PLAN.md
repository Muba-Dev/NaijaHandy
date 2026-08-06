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
- ✅ Profile settings, saved artisans, booking history, and search refinements (booking history polished: fixed Rebook links, added Cancel + Raise Dispute flows, tab counts, error/retry states).
- ✅ Search flow wiring (navbar/hero/popular links deep-link `?q=`, debounce + error state), change-password (backend `POST /auth/change-password` + settings Security tab), review submission (backend `POST /bookings/:id/review` + bookings-page form), navbar Bookings/Saved links, and review-rating distribution derived from `reviews_list`.
- ✅ Verified: backend build clean, 37 unit tests + 52 e2e tests passing (e2e now covers change-password revocation and review rules), frontend typecheck/build/lint clean.
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

1. Finish Phase 2 cleanup: remove old Express files, verify NestJS-only startup, and validate backend endpoints.
2. Add authenticated route guards in the frontend and protect dashboard routes.
3. Flesh out Phase 3 UI polish: bookings page, profile settings, saved artisans, search flow, and responsive state handling.
4. Add targeted tests for auth refresh, protected routes, and booking transitions.

## Security Remediation (Supabase RLS) ✅ COMPLETE

- ✅ Confirmed Architecture B: Frontend → NestJS → Prisma → Supabase PostgreSQL (no direct Supabase client).
- ✅ Enabled RLS on all `public` tables (clears 13 Security Advisor "RLS disabled" findings).
- ✅ Deny-all for `anon`/`authenticated` on sensitive tables: `users`, `refresh_tokens`, `bookings`, `payments`, `saved_artisans`, `disputes`, `_prisma_migrations` (privileges revoked, no policies).
- ✅ Read-only catalog policies for `artisan_profiles`, `services`, `portfolio_items`, `reviews`.
- ✅ Event trigger auto-enables RLS on future tables.
- ✅ Backup (`backup-db.sh`), rollback (`rls-rollback.sql`), and verification (`verify-rls.sql`) tooling under `backend/supabase/`.
- ✅ Passwords verified as bcrypt-hashed (cost 12); refresh tokens only managed by the backend.

## Next Work Plan (saved for later)

### 1. Demo data (labeled, no purge) + CI DB split — DONE

- ✅ Migration `add_demo_flags` (`20260806120000`): `ArtisanProfile.isDemo` + `User.isDemo` (`Boolean @default(false)`), applied.
- ✅ Seed (`backend/prisma/seed.ts`): marks the 10 demo artisans + demo customers `isDemo: true`; ratings untouched (clearly demo). Gated by `SEED_DEMO` (default on; `SEED_DEMO=0` = production-safe, no demo flags). Documented in `.env.example`.
- ✅ Backend filtering (`ArtisanService.findAll/findOne` + `categoryCounts`): anonymous → demo visible; authenticated non-demo user → `isDemo: false` filter; demo users + admin → sees all. **No** `?demo=1` preview toggle (decision: skip). Implemented via new `OptionalJwtAuthGuard` (bad/garbage tokens fall back to anonymous) + `JwtStrategy` now returning `isDemo`.
- ✅ Frontend: "Demo" badge on artisan cards + profile header; Book button / booking form replaced with "Demo profile — not bookable" (decision: not bookable). No preview toggle.
- ✅ CI DB split: `backend-e2e` + `frontend-e2e` jobs in `.github/workflows/ci.yml` now use `secrets.DATABASE_URL_CI` (Neon branch) + explicit `SEED_DEMO: 'true'`; Render keeps `secrets.DATABASE_URL` (Render only runs migrations, never seeds). Prod safety = any manual prod seed must set `SEED_DEMO=0`.
- ✅ Playwright booking/browse specs updated: demo artisan profile asserts the not-bookable notice; booking + bookable-profile tests create a fresh non-demo artisan (register → admin approve) via `e2e/support/helpers.ts`.
- ✅ Verified: backend build + 44 unit tests + 58 e2e tests; frontend lint + build; 12 Playwright e2e tests green.
- ✅ Manual step done: `DATABASE_URL_CI` repository secret created (a `naijahandy_ci` database in the existing Supabase project, isolated from the DB Render reads); CI e2e jobs green on the new CI DB.
- Rationale: demo data used to reach prod because CI e2e seeded the same Neon DB that Render reads.

### 2. Ratings integrity — DONE

- ✅ `backend/scripts/recompute-ratings.mjs` (`npm run db:recompute-ratings`): recomputes `avgRating`/`totalReviews` from APPROVED `Review` rows for **non-demo** artisans only (demo keeps its fake numbers). HIDDEN (moderated) reviews are excluded. No-op-safe/idempotent; verified against the live DB (10 demo skipped, non-demo recomputed).
- Seeded `avgRating`/`totalReviews` (up to 201 reviews) have no backing `Review` rows — fiction only OK on labeled demo rows.

### 3. Notifications (email) — DONE

- ✅ `EmailService` generalized with a gated, error-swallowed `send()` (logs + continues; only fires when `EMAIL_ENABLED=true`) plus helpers: `sendBookingStatusEmail`, `sendApprovalStatusEmail`, `sendVerificationStatusEmail`, `sendNewArtisanPendingEmail`. Shared HTML layout; `EMAIL_ENABLED` documented in `.env.example`. Password-reset email unchanged (not gated, errors still surface).
- ✅ Wired into `BookingService.updateStatus` (CONFIRMED/COMPLETED/CANCELLED → the other party), `AdminService.setArtisanApproval`/`setArtisanVerification` (→ artisan), and `AuthService.register` (new ARTISAN → PENDING alert to all admins). Modules updated (`BookingModule`, `AdminModule` import `EmailModule`).
- ✅ Verified: backend build clean, 46 unit tests (new register-alert tests + email-assertions on booking transitions) + 58 e2e tests passing. In CI/test, `EMAIL_ENABLED` is unset so all notification sends are instant no-ops.

### 4. Operational hardening — DONE

- ✅ New `.github/workflows/db-backup.yml`: nightly (cron `0 2 * * *`, also `workflow_dispatch`) `npm run db:backup` (`pg_dump` via `postgresql-client`) against `DATABASE_URL`, uploads `backend/backups/*.sql` as a 30-day artifact (`if-no-files-found: error`).
- ✅ Keep-alive (`keep-alive.yml`) now opens a `keep-alive`-labeled GitHub issue when a health-check failure follows a prior failed run, comments on it on continued failures, and auto-closes it on recovery (via `actions/github-script`, `issues: write`).
- ✅ Root `package.json` renamed `figma-make-app` → `naijahandy`; unused Vite/React/Tailwind scaffold deps removed (only `concurrently` + `oxfmt` remain); lockfiles consolidated on npm — root `pnpm-lock.yaml` and `frontend/pnpm-workspace.yaml` deleted, root `package-lock.json` regenerated (`frontend/.npmrc` kept for native Next.js builds).

### 5. Dashboard UX — DONE

- ✅ Artisan dashboard mobile top-nav parity confirmed (shared layout already matched customer/admin); added PENDING-approvals + open-disputes count badges to the admin dashboard mobile nav to match the desktop sidebar.
- ✅ Loading skeletons + empty states on customer & artisan `/dashboard`: customer dashboard now has a proper loading state (stats + upcoming bookings skeletons) and a "No upcoming bookings" empty state with a Find-an-Artisan CTA; artisan overview got loading skeletons for stats, pending job requests, and confirmed jobs (empty states already existed).
- ✅ Admin artisans list already had inline Approve/Reject/Verify/Unverify actions and the sidebar PENDING badge (verified); the badge now also shows in the mobile top nav.

### Verification (for all above) — DONE

- ✅ Backend: `npm run build` (tsc), `npm test` (46 unit), `npm run test:e2e` (58 e2e) all passing. Frontend: `npm run lint` + `npm run build` clean.
- ✅ Deployed and verified live: backend healthy (`/api/health` → `{"status":"ok","db":"up"}`); logged-out `/api/artisans` returns the 11 profiles (10 demo + 1 real) with demo badge, logged-in non-demo sees zero demo, demo artisans non-bookable, CI green on the new CI DB.
- ✅ Commit `2b76c5f` (on `origin/main`) carries all five items above; Render + Vercel auto-deploy on push.
