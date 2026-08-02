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
- Prisma-backed user, artisan, booking, payment, review, and refresh token models.
- JWT access + refresh token issuance.
- Refresh token rotation and logout revocation.
- Protected API endpoints for customers, artisans, saved artisans, and user data.
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

### Phase 2 Cleanup — DONE

- ✅ Legacy Express artifacts removed (`src/index.ts`, `src/routes/`, `src/middleware/`); NestJS-only startup verified.
- ✅ Added `refresh_tokens` migration (table was missing from the DB) and `saved_artisans` FK migration.
- ✅ Frontend route protection + auth redirects for dashboard/protected pages.
- ✅ Refresh-token rotation, logout revocation, and session persistence verified end-to-end (login → /users/me → refresh → old-token reuse 401 → logout → reuse 401).
- ✅ Booking state machine + ownership rules verified (accept/complete by artisan, customer cancel, terminal-state 403, ownership 403).

### Ready for Phase 3

- ✅ Replace remaining mock data with real API-driven UI flows (settings, saved artisans, search).
- ✅ Add loading, empty, validation, and error states across pages.
- 🔄 Profile settings, saved artisans, booking history, and search refinements (settings + saved artisans + search done; booking history pending polish).
- Pending: improve responsive accessibility, mobile UX, SEO-ready content.
- Pending: real media uploads, map/address selection, notification support.

### Next action for another developer

1. Add targeted tests for auth refresh, protected routes, and booking transitions.
2. Add Paystack transactions and verified, idempotent webhooks (Phase 2 item 5).
3. Add artisan verification, service areas, reviews, and admin moderation (Phase 2 item 4).
4. Phase 4: API documentation, CI checks, logging, monitoring, and backups.
