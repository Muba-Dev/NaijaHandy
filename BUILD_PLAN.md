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

The project is in late Phase 2. The backend has been migrated to NestJS and now supports:
- Prisma-backed user, artisan, booking, payment, review, and refresh token models.
- JWT access + refresh token issuance.
- Refresh token rotation and logout revocation.
- Protected API endpoints for customers, artisans, and user data.

The frontend now uses:
- Axios-based API client with access token injection.
- `401` refresh token retry logic.
- Logout flow that revokes refresh tokens and clears local session state.
- Dashboard pages wired to the API and auth flows instead of stale mock behavior.

### Ready for Phase 3

The repo is ready to move into Phase 3 once these Phase 2 cleanup items are confirmed:
- Remove any remaining legacy Express artifacts from the backend package.
- Add frontend route protection and auth redirects for dashboard/protected pages.
- Verify refresh-token retry and session persistence end-to-end.
- Ensure API-driven dashboard, search, bookings, and profile flows are working.

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
