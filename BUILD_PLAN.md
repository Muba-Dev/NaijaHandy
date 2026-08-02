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

### Next action for another developer

1. Phase 4: API documentation, CI checks, logging, monitoring, and backups.
