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
2. Add secure authentication, refresh tokens, role authorization, and account recovery.
3. Add artisan verification, service areas, reviews, and admin moderation.
4. Add Paystack transactions and verified, idempotent webhooks.

## Phase 3: Production Frontend

1. Remove remaining mock data and use the API for every user-facing flow.
2. Add loading, empty, validation, and error states to each workflow.
3. Add image uploads, location search, notifications, and responsive accessibility.

## Phase 4: Quality And Release

- Add unit, integration, and Playwright end-to-end tests.
- Add API documentation, CI checks, logging, monitoring, and backups.
- Deploy Next.js to Vercel, the API to Railway or Render, and PostgreSQL to Neon or Supabase.

## Current Milestone

The current prototype is connected locally: Next.js uses `NEXT_PUBLIC_API_URL` to call the backend, and the backend serves seeded artisan data from Prisma. Phase 1 now has a baseline Prisma migration, explicit booking/payment states, repeatable seed data, and role-based booking transition rules. The next implementation milestone is applying this migration to a PostgreSQL staging database.

### Phase 1 State Contract

Booking states are `PENDING -> CONFIRMED -> COMPLETED` or `CANCELLED`. A confirmed booking may be cancelled, but completed and cancelled bookings are terminal. Payment states are `PENDING`, `SUCCESS`, `FAILED`, and `REFUNDED`; booking payment state is `UNPAID`, `PAID`, or `REFUNDED`.

The local SQLite schema now includes payment fields and a `Payment` model so the API contract can be tested before connecting a hosted PostgreSQL database. The next database step is to set a PostgreSQL `DATABASE_URL`, switch the Prisma provider, create a named migration, and run the seed against a disposable staging database.