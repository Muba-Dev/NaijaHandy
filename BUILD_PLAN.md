# ArtisanNG Build Plan

## Phase 0: Foundation

- Keep the project in one GitHub repository with `frontend/` and `backend/` applications.
- Protect environment files, dependencies, build output, and local databases from Git.
- Use the existing Next.js frontend and Express API as the working prototype.
- Record every milestone with a focused commit and a passing validation command.

## Phase 1: Product Core

1. Finalize the customer, artisan, and admin workflows.
2. Define booking and payment states before adding more screens.
3. Replace SQLite with PostgreSQL and add Prisma migrations.
4. Add shared API contracts, DTO validation, and consistent errors.

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

The current prototype is connected locally: Next.js uses `NEXT_PUBLIC_API_URL` to call the backend, and the backend serves seeded artisan data from Prisma. The next implementation milestone is PostgreSQL plus a formal booking state model.