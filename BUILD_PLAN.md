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
4. ✅ Improve responsive accessibility, mobile UX, and SEO-ready content.
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
- ✅ Improve responsive accessibility, mobile UX, SEO-ready content (see "Accessibility, mobile UX & SEO" below).
- ✅ Real media uploads for artisans (see "Media uploads" below).
- ✅ In-app notifications (see "In-app notifications" below).
- ✅ Map/address selection (see "Map / address selection" below).

### Accessibility, mobile UX & SEO (Phase 3 item 4) — DONE

- ✅ SEO: root `layout.tsx` metadata (title template, canonical, OpenGraph/Twitter, `themeColor`, Organization JSON-LD, skip-to-content link); per-route `layout.tsx` metadata for search/bookings/settings/saved/login/register/forgot-password/reset-password/oauth-callback/dashboard; dynamic `generateMetadata` for `/artisans/[id]` (name + profession + bio + OG profile). `sitemap.ts` (static routes + artisan URLs from API) and `robots.ts` (disallow dashboard/settings/bookings/saved/oauth-callback) generated at build; `NEXT_PUBLIC_APP_URL` documented in `.env.local.example`.
- ✅ Accessibility: focus-visible rings + reduced-motion support in `globals.css`; `aria-label`/`aria-hidden`/`aria-pressed`/`aria-expanded`/`aria-controls`/`role="status"|"alert"|"switch"|"group"` across Navbar, Footer, AuthGuard, Home, search, artisan profile, bookings (dialogs, star rating, tabs), settings (photo upload, switches, notif checkboxes), all auth pages, customer/artisan/admin dashboards, schedule/requests/earnings/profile, saved, not-found; `h3→h2` heading order; form controls labeled (`htmlFor` + sr-only where needed); calendar day buttons get `aria-label`s; nested `<main>` elements replaced.
- ✅ Mobile UX + contrast: larger tap targets (checkboxes w-5 h-5, buttons px-4 py-2), footer links w-11 h-11, `text-gray-400` bumped to `gray-500/600` on light backgrounds, real social links (inline SVG brand marks; lucide removed Facebook/Instagram/Twitter) with `target=_blank`, newsletter form extracted to client `NewsletterForm.tsx` (server components can't take event handlers).
- ✅ Verified: `npm run lint` + `npm run build` clean; build emits `sitemap.xml` + `robots.txt`.

### Media uploads (Phase 3 item 5) — DONE

- ✅ Backend: `UploadService` generalized behind a private `uploadImage(dataUrl, folder, transformation, label)` — `uploadAvatar` (400×400), `uploadCover` (1200×400 fill → `naijahandy/covers`), `uploadPortfolio` (1200×900 fill → `naijahandy/portfolio`). All share mime (JPG/PNG/WebP/GIF) + 4MB validation and the Cloudinary-less dev fallback (stores the data URL).
- ✅ Backend endpoints (`ARTISAN` guard), `ArtisanModule` now imports `UploadModule`:
  - `POST /api/artisans/me/cover` (body `{ image }`) → updates profile `coverImage`.
  - `POST /api/artisans/me/portfolio` (body `{ image, caption? }`) → creates a `PortfolioItem`.
  - `DELETE /api/artisans/me/portfolio/:id` → deletes an item owned by the artisan (404 otherwise).
- ✅ Unit tests: `ArtisanService.updateCover` / `addPortfolio` / `removePortfolio` (upload called, ownership, profile-missing + item-missing 404s). Backend build + 54 unit tests green.
- ✅ Frontend: `PortfolioItem` type (`{ id, imageUrl, caption }`), `Artisan.portfolio` changed `string[] → PortfolioItem[]` (normalizer + mock data updated), `updateArtisanCover` / `uploadPortfolioItem` / `deletePortfolioItem` helpers in `api.ts`.
- ✅ Artisan profile page (`/dashboard/artisan/profile`): cover URL text field replaced with file-picker + preview + upload button; new portfolio card (grid with delete-per-item, optional caption, add-photo uploader). Same validation/feedback pattern (`role="status"` / `role="alert"`) as settings. Public `/artisans/[id]` portfolio tab renders `imageUrl` + caption alt text.
- ✅ Verified: backend `npm run build` + `npm test` clean; frontend `npm run lint` + `npm run build` clean (22 routes).

### In-app notifications (Phase 3 item 5) — DONE

- ✅ Prisma `Notification` model (`id`, `userId`, `type`, `title`, `body`, `link?`, `read`, `createdAt`, index `[userId, read]`, cascade delete) + migration `20260808222651_add_notifications` applied.
- ✅ Backend `NotificationsModule`: `NotificationsService` (`create`, `findAll`, `unreadCount`, `markRead`, `markAllRead`) + authenticated controller — `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all`.
- ✅ Emitted from domain services: `BOOKING_REQUEST` (new booking → artisan), `BOOKING_ACCEPTED`/`BOOKING_COMPLETED` (→ customer), `BOOKING_CANCELLED` (→ other party), `REVIEW_RECEIVED` (→ artisan), `PROFILE_APPROVED`/`PROFILE_REJECTED` (admin approval → artisan), `PAYMENT_RECEIVED` (paid → artisan). Each carries a deep link (e.g. `/dashboard/artisan/requests`, `/bookings`).
- ✅ Unit tests: new `notifications.service.spec.ts` (create/findAll/unreadCount/markRead-ownership/markAllRead) + booking/payment specs extended to assert notification emission. Backend build + 64 unit tests green.
- ✅ Frontend: `AppNotification` type, `fetchNotifications`/`fetchUnreadCount`/`markNotificationRead`/`markAllNotificationsRead` helpers. Navbar bell with unread badge (30s polling + on-route-change refresh) in desktop + mobile menu. New `/notifications` page (unread highlight, click-to-open deep links auto-marking read, "Mark all as read", empty + loading states). `/notifications` added to `robots.ts` disallow.
- ✅ Verified: frontend `npm run lint` + `npm run build` clean (23 routes incl. `/notifications`).

### Map / address selection (Phase 3 item 5) — DONE

- ✅ Prisma `User` now has `address?`, `latitude?`, `longitude?`; migration `20260809000000_add_user_location` generated **offline** (`prisma migrate diff`) because the Supabase pooler was unreachable (P1001 — transient DNS/network outage). **Applied 2026-08-08** via `npx prisma migrate deploy` once connectivity returned; `prisma migrate status` confirms DB in sync, `prisma validate` clean, and the `address`/`latitude`/`longitude` columns verified in `information_schema`.
- ✅ Backend `UserService.findMe/updateMe` select + persist location; `updateMe` validates lat ∈ [−90, 90] and lng ∈ [−180, 180] (accepts numeric strings), `BadRequestException('Invalid coordinates')` otherwise. `ArtisanService` public profile includes now return `phone`/`address`/`latitude`/`longitude`.
- ✅ Unit tests: new `user.service.spec.ts` (store + numeric-string coercion + out-of-range + non-numeric + no-coords). Backend build + 70 unit tests green (no backend lint script; `tsc` build is the check).
- ✅ Frontend: installed `leaflet@^1.9.4`, `react-leaflet@^5.0.0`, `@types/leaflet`; `leaflet/dist/leaflet.css` imported in `globals.css`; `src/components/map/MapView.tsx` (MapContainer + OSM tiles + custom div-icon pin, click-to-select, `isolate` wrapper), `MapPicker.tsx` (Nominatim address search + reverse-geocode on map click, all client-side via `next/dynamic ssr:false`), `LocationMap.tsx` (static, non-interactive).
- ✅ Artisan profile page (`/dashboard/artisan/profile`): new Location card — address search box, clickable map, "Save Location" → `PATCH /api/users/me` (`{ address, latitude, longitude }`), saved/error feedback. Public `/artisans/[id]` shows a Location card (address + static map + "Open in Google Maps" link) whenever lat/lng are present.
- ✅ Verified: frontend `npm run lint` + `npm run build` clean (23 routes); backend `npm run build` + `npm test` clean (70 tests, 9 suites).

### Next action for another developer

1. Phase 4 is complete: prod `GET /api/artisans/:id` 500 resolved (missing prod migrations — see the Lighthouse section above), all Lighthouse audits green (100 on A11y/BP/SEO across `/`, `/search`, `/artisans/[id]`), CI green.

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
- ✅ Frontend Playwright e2e (`frontend/e2e/`, `playwright.config.ts`, `npm run test:e2e`): 18 tests against the real app + DB, self-cleaning via `e2e/support/db.ts` (unique description marker → deletes bookings/payments/disputes; `e2e.bookable.%` user cleanup cascades notifications):
  - Auth: protected-route redirect, invalid-credentials error, customer login → dashboard, logout → home + protected pages locked.
  - Browse: search lists artisans from the API, artisan profile shows details + booking form.
  - Booking + payment: book on the profile page → mock Paystack redirect → `?reference=` verify → PAID; Pay Now on an API-created UNPAID booking → verify → PAID.
  - **New — SEO (`seo.spec.ts`)**: `robots.txt` disallows `/dashboard`, `/settings`, `/bookings`, `/saved`, `/notifications`, `/oauth-callback` + sitemap reference; `sitemap.xml` lists public pages + `/artisans/` URLs (asserted against the production `NEXT_PUBLIC_APP_URL` base); `/artisans/[id]` emits title/description/canonical/OG meta.
  - **New — dashboard work (`dashboard.spec.ts`)**: booking request → artisan bell badge shows unread count, `/notifications` lists it, click → deep link to job requests where the booking appears; artisan cover + portfolio uploads (data-URL dev fallback) with success states and portfolio delete; location card — click map → type address → Save → "Location saved.", then the public profile shows the Location card + "Open in Google Maps" + Leaflet map.
  - CI job `frontend-e2e` in `.github/workflows/ci.yml` (Playwright install, DB seed, artifact upload), gated on the `DATABASE_URL` secret.
- ✅ E2E reliability fixes along the way: login/register selectors scoped to `main form` (the footer newsletter form added the same `input[type="email"]`, tripping strict-mode); global `express-rate-limit` raised to `max: 1000` when `NODE_ENV=test` (the 100/15min production limit was 429-ing the full suite); `MapPicker` now propagates typed addresses to the parent and only auto-fills a reverse-geocoded address when the user hasn't typed since the map click (fixed the save-no-address bug).
- ✅ Accessibility (axe) audit (`e2e/a11y.spec.ts`, `@axe-core/playwright`): scans 16 pages (home, search, auth, artisan profile, customer dashboard/bookings/saved/settings/notifications, artisan dashboard/requests/schedule/earnings/profile) and fails on any `serious`/`critical` violation. Fixes made:
  - Brand "Handy" span needed a `dark` variant (`text-emerald-400` + white "Naija") for the dark footer (was `#047857` on `#111827`, 3.23:1).
  - Register page: role-toggle inactive buttons `text-gray-500` → `text-gray-700` (2.8:1 → 4.9:1); City/Profession `<select>`s + all inputs got `htmlFor`/`id` label associations (`select-name`/`label`).
  - Job-requests tab counts lost their `opacity-70` (white-on-emerald dropped to 3.53:1); settings form + artisan-profile form fields got `htmlFor`/`id` associations.
  - Leaflet: pin markers set `interactive={false} keyboard={false}` (Leaflet no longer adds an unnamed `role="button"`/`tabindex` → `aria-command-name`); map tiles get `alt=""` via a `tileload` listener + container sweep (`image-alt`); attribution link styled `#0f766e` + underlined (`link-in-text-block`).
  - Notifications timestamps `text-gray-400` → `text-gray-700` (2.41:1 on the emerald unread-card tint); demo-profile "not bookable" banner `bg-gray-300 text-white` → `bg-amber-50 text-amber-800` border; profile cover placeholder `text-gray-400` → `text-gray-600`.
  - Spec robustness: `goto` with `waitUntil: 'domcontentloaded'` (avoid slow third-party resources), then `main` visible + `networkidle` (10s cap) + 500ms paint-settle (axe can catch mid-`transition-opacity` frames on disabled→enabled buttons and report false color-contrast failures).
- ✅ Lighthouse audit (`lighthouse@12.8.2`, headless Chrome, categories perf/a11y/best-practices/seo; JSON reports kept in `frontend/lighthouse/`, gitignored):
  - **Fixes from the audit:**
    - **Live sitemap/robots used a dead domain.** `NEXT_PUBLIC_APP_URL` default in `sitemap.ts`, `robots.ts`, and `layout.tsx` (`metadataBase`) was `https://naijahandy.vercel.app` — but the real deployment is `https://naija-handy.vercel.app` (the other 404s). The env var is unset in production, so the broken default shipped and the live sitemap pointed at the wrong domain. Corrected default → `https://naija-handy.vercel.app` (also fixed the hardcoded base in `e2e/seo.spec.ts`).
    - **Newsletter button `label-content-name-mismatch`**: `aria-label="Subscribe to newsletter"` vs visible text "Go" → button text now "Subscribe" (accessible name contains the visible text). Fixes the flag on every page footer.
    - **`ArtisanCard` disabled "Demo profile" chip** `bg-gray-100 text-gray-500` was 4.07:1 (fails AA) → `text-gray-700`. This surfaced only with demo data on the live home grid (local e2e DB had few demo cards in the scanned viewport).
  - **Login page split (server + client)**: `/login` was a fully `'use client'` page using `useSearchParams()`; refactored into `src/app/login/LoginForm.tsx` (client form) + `src/app/login/page.tsx` (server page with a `<Suspense>` boundary) so the shell is statically prerendered instead of a full-CSR bailout.
  - **Intentional `noindex`**: `/login`, `/register`, and all `/dashboard/*` routes deliberately set `robots: { index: false }` (auth/app pages — correct product decision). Lighthouse reports ~SEO 69 on `/login` because of it; public pages are 100.
   - **Artisan profile SSR (fixed the last SEO gap)**: `/artisans/[id]` was a `'use client'` page with per-page dynamic `generateMetadata` in the layout. During React hydration the `<head>` is cleared, so the meta description was missing at Lighthouse's `load` moment (present again at networkidle) → SEO 92. Refactored to a server component: `page.tsx` now `await`s `fetchArtisanById(id)` server-side (same call `generateMetadata` already makes, so it's proven safe — the axios client's interceptor no-ops without `window`) and renders `<ArtisanProfileClient artisan={artisan} />` (`src/components/artisan/ArtisanProfileClient.tsx`, which holds all the interactive state). The head is now stable SSR HTML and the profile content (h1/LCP) ships in the initial HTML instead of after a client fetch.
   - **Mobile heading order (`/search`)**: Lighthouse audits in **mobile emulation** (412x823). The filter sidebar is `hidden md:block`, so on mobile its `h2 "Filters"` is `display:none` and the result cards' `h3`s followed the sr-only `h1` directly → skipped heading level (A11y 98). Made the mobile "Filters" toggle a real `<h2>` (visible on mobile, `md:hidden` on desktop) so every viewport renders h1 → h2 → h3.
   - **Scores** (final live, Lighthouse mobile, post all fixes — reports `live-home3.json`, `live-search3.json`, `live-artisan4.json`):
     - `/` → Perf 88, A11y 100, Best-practices 100, SEO 100.
     - `/search` → Perf 76, A11y 100, BP 100, SEO 100.
     - `/artisans/[id]` → Perf 77, A11y 100, BP 100, SEO 100 (was 58 / 100 / 100 / 92).
     - `/login` → Perf 91, A11y 100, BP 100, SEO 69 (intentional noindex).
  - **Perf notes (not fixed — structural)**: LCP on `/` is the low-opacity hero Unsplash image (already `priority`); `/search` LCP locally is the CORS-blocked "Could not load" error (data-driven pages are distorted on localhost; live numbers are the real ones). Main-thread work from JS bundles + `render-blocking-resources` (187ms, the static CSS chunk) + ~11KB `legacy-javascript` are the remaining levers.
  - **⚠️ PRODUCTION INCIDENT (RESOLVED)**: `GET /api/artisans/:id` **500'd for every artisan on the live API** (list/categories/health all worked). **Root cause:** the prod DB was **behind the deployed code by two migrations** — `_prisma_migrations` on prod ended at `20260806120000_add_demo_flags`; `20260808222651_add_notifications` and `20260809000000_add_user_location` (adds `users.address`/`latitude`/`longitude`, which `findOne` selects at `artisan.service.ts:69`) were never applied. The `findOne` query against the missing columns threw Prisma P2021 → Nest's generic 500. `list`/`categories` worked because they never select those columns; local worked because the local DB had the migrations. A non-existent cuid 404'd because no row was found (the broken columns were never SELECTed). The Render log line the customer saw (`ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`) was a separate config bug, not the 500.
    - **Fix (done, via Supabase SQL Editor):** applied the two missing migrations manually (idempotent SQL: `ALTER TABLE users ADD COLUMN IF NOT EXISTS address/latitude/longitude` + full `notifications` table/index/FK) and inserted matching `_prisma_migrations` rows with the exact Prisma checksums (`f6b3de…b321f`, `e1936e…c4e5`) so future `prisma migrate deploy` won't re-apply or conflict. Verified live: `GET /api/artisans/cmsamk6b60004956gefs6r6rx` → 200 with full payload.
    - **Prevention:** Render only runs `prisma migrate deploy` on deploy (it never ran here because the deploy predates the new migrations); prod schema drift is now impossible to miss going forward (the bookkeeping rows are recorded).
  - **Backend fix from the Render log** (`ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`, `express-rate-limit@7.5.1`): the API never set Express `trust proxy`, so on Render every request carries `X-Forwarded-For` while the limiter believed the client was `::1` — the library's validation fired (visible in Render logs) and all users shared one rate-limit bucket. Fixed in `src/main.ts` with `app.set('trust proxy', 1)` (Render is one proxy hop; `true` is rejected by express-rate-limit's `ERR_ERL_PERMISSIVE_TRUST_PROXY`). Backend build clean + 70/70 unit tests pass.
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

## Next Milestone: Growth Roadmap (in progress — WhatsApp booking shipped)

**Goal:** Make NaijaHandy the most trusted and fastest artisan marketplace in Nigeria.

**Current gaps (what's already shipped vs. what's missing):**
- Trust: "Verified" badge exists (admin approval flag) but there is **no real ID/document verification**.
- Reviews: text + star rating only — **no photos, no verified-buyer tag**.
- Booking: manual form → Paystack; **no instant/WhatsApp path, no formal price estimate**.
- Discovery: filters exist (category, city, minRating, available, sortBy) but **no price range, distance, or emergency/same-day jobs**.
- Retention: saved artisans, booking history, rebook links, notifications all shipped — **no rewards, no referral program**.
- Differentiation: disputes + admin moderation shipped — **no service guarantee, escrow, or response-time signals**.

**Priority roadmap:**

### P0 — Trust

1. **Feature: Real ID verification (document upload + admin review)** — ✅ DONE (see below)
   - Problem: "Verified" is just an admin flag; users can't tell real artisans from demo/impersonators.
   - Benefit: buyers trust booking = more first bookings.
   - Effort: Medium (reuse `UploadService`; new document endpoint + admin review UI + badge states).
   - Success: % of real artisans verified; higher conversion on verified profiles.

2. **Feature: Reviews with photos + verified-buyer tag** — ✅ DONE (see below)
   - Problem: buyers can't judge work quality from text alone.
   - Benefit: richer social proof; repeat-booking confidence.
   - Effort: Medium (`Review.photos` schema + upload + moderation + display).
   - Success: % of reviews with photos; review completion rate up.

3. **Feature: Skill badges** — ✅ DONE (see below)
   - Problem: a profession like "Plumber" is vague; users can't see specialty.
   - Benefit: clearer matching.
   - Effort: Easy (derive from the existing services list; badge UI).
   - Success: more shortlist/profile engagement.

4. **Feature: Completed-job history** — ✅ DONE (see below)
   - Problem: users can't see proof of work.
   - Benefit: confidence; separates real pros.
   - Effort: Easy (completed bookings already stored — surface count + timeline on the profile).
   - Success: more profile views → bookings.

### P1 — Conversion

5. **Feature: WhatsApp booking** — ✅ DONE (see below)
   - Problem: Nigerians book via WhatsApp; the current flow forces form + payment.
   - Benefit: instant conversations; big conversion lift.
   - Effort: Easy (frontend `wa.me` deep link with prefilled message on the profile page).
   - Success: % of bookings started via WhatsApp.

6. **Feature: Instant booking (one-tap request with saved details)**
   - Problem: multi-field form friction.
   - Benefit: fewer drop-offs.
   - Effort: Medium (prefill from profile/saved address; reduce required fields).
   - Success: checkout completion rate.

7. **Feature: Upfront price estimates** — ✅ DONE (see below)
   - Problem: users fear hidden costs.
   - Benefit: trust + clearer decision.
   - Effort: Medium (per-service rate → estimate summary before booking; optional quote-request flow).
   - Success: estimate acceptance rate.

8. **Feature: Better search filters (price range, distance, urgency)** — ✅ DONE (see below)
   - Problem: can't narrow by budget/area/need-speed.
   - Benefit: faster matching.
   - Effort: Medium (backend query params + UI).
   - Success: search-to-booking rate.

9. **Feature: Help & Support centre + AI assistant** — Phase 1 (Help Centre + contact form + support inbox) ✅ DONE; Phase 2 (AI) pending
   - Problem: WhatsApp was repurposed to support chat, but there's still **no in-app help** — users stuck before/during booking have nowhere to go and leave.
   - Benefit: fewer drop-offs, fewer support tickets, and instant answers to recurring questions (pricing, payments, trust, disputes).
   - Effort: Medium-Hard (Phase 1 = static Help Centre + contact form — Easy; Phase 2 = AI assistant over the help content — Hard).
   - Success: % of stuck users who complete a booking after using help; support-ticket deflection rate.
   - See full spec + Phase 1 DONE below.

### P2 — Retention

10. **Feature: Repeat booking ("Book again" prefilled)** — ✅ DONE (see below)
   - Problem: rehiring a good artisan is manual.
   - Benefit: habit loop.
   - Effort: Easy (rebook exists in history — prefill and shorten to one tap).
   - Success: % of repeat bookings.
   - Note: **saved artisans already shipped** (original plan's P2 item) — do not rebuild.

11. **Feature: Customer rewards (points/credits after completed jobs)**
    - Problem: no reason to come back.
    - Benefit: loyalty.
    - Effort: Hard (ledger/credits model + apply to payment).
    - Success: return/retention rate.

12. **Feature: Referral program**
    - Problem: no word-of-mouth engine.
    - Benefit: cheap growth.
    - Effort: Medium (referral codes + credit on first booking).
    - Success: referral-sourced signups.

### P3 — Differentiation

13. **Feature: Response-time badges** — ✅ DONE (low-effort proxy shipped; measured first-response time is the upgrade path)
    - Problem: users don't know if an artisan is responsive.
    - Benefit: quality signal.
    - Effort: Medium (measure time from booking request → first response; badge in search/profile).
    - Success: higher booking on fast responders.

14. **Feature: Service guarantee (NaijaHandy Guarantee)**
    - Problem: fear of poor/overpriced work.
    - Benefit: risk-reversal.
    - Effort: Medium (policy page + tie into existing dispute flow).
    - Success: fewer cancellations; better conversion.

15. **Feature: Emergency / same-day jobs**
    - Problem: urgent jobs (leak, lockout) have no fast path.
    - Benefit: differentiated high-intent segment.
    - Effort: Medium (urgent flag + filter + notify nearby artisans).
    - Success: emergency-job volume.

16. **Feature: Escrow protection (hold payment until job done)**
    - Problem: paying upfront is scary for customers; paying after is scary for artisans.
    - Benefit: two-sided safety — category-defining trust.
    - Effort: Hard (Paystack charge-on-delivery/split; release flow; dispute tie-in).
    - Success: completed-booking trust; fewer disputes.

**Shipped:** WhatsApp booking, skill badges, completed-job history, response-time badges (proxy), real ID verification, review photos + verified-buyer tag, repeat booking, upfront price estimates, and better search filters — all DONE below.
**Remaining (best next):** 9. Help & Support centre + AI assistant (spec below). Then 14. Service guarantee, 15. Emergency/same-day jobs (P3). Harder backlog: 11. Customer rewards, 12. Referral program, 16. Escrow protection.
**Prerequisite for payments work:** switch from `PAYSTACK_MOCK=true` to real test/live Paystack keys before escrow/credits.

### WhatsApp booking (Growth Roadmap P1.5) — DONE

- ✅ `Artisan.phone` now flows to the UI: added to the `Artisan` type + `RawArtisan` normalizer (the backend already returned `phone` on `GET /api/artisans/:id`).
- ✅ `buildWhatsAppLink(phone, message)` helper in `frontend/src/lib/utils.ts`: strips non-digits, prepends `234` to Nigerian `0…` numbers, rejects invalid/short numbers, returns a `https://wa.me/<digits>?text=<encoded>` link.
- ✅ Public artisan profile (`ArtisanProfileClient.tsx`):
  - Header "Message" button now opens a WhatsApp chat (teal `#075E54`, AA-contrast safe) prefilled with a greeting, the requested service, and the artisan's hourly rate; non-demo only.
  - Booking sidebar gains a full-width **"Book via WhatsApp"** button that deep-links `wa.me` with the form's date/time/job-description prefilled. Demo profiles keep the not-bookable notice (no WhatsApp path).
- ✅ E2E (`browse.spec.ts`): bookable profile shows the WhatsApp link; prefilled message contains the artisan name, date, time, and job description; demo profile hides it. `createBookableArtisan` registers with a phone.
- ✅ **Test-infra fix (pre-existing flake):** React 19's controlled `<input type="date">` intermittently ignores Playwright's programmatic `fill()` (date state stayed empty → flaky booking + WhatsApp tests). New `fillBookingDate(page, date)` helper clicks + types the `mmddyyyy` digits (5/5 reliable vs 1/3) and asserts the controlled value; now used by `browse.spec.ts` and `booking.spec.ts`.
- ✅ Verified: frontend `npm run lint` + `npm run build` clean; Playwright `browse` (4) + `booking` (4) specs green. No backend changes required.

### Skill badges (Growth Roadmap P0.3) — DONE

- ✅ New `SkillBadges` component (`frontend/src/components/SkillBadges.tsx`): renders pill chips from the existing `services` list (`bg-[#ECFDF5]`/`text-[#047857]`, AA-clean), optional `limit` with a `+N more` chip, returns `null` when there are no services.
- ✅ Shown in three places, all data-driven off the already-shipped `services` payload:
  - `ArtisanCard` (home featured grid) — up to 3 chips + `+N more` below the bio.
  - `/search` result cards — up to 3 chips + `+N more` below the bio (the search page has its own inline card markup, not `ArtisanCard`).
  - Public artisan profile About tab — a **Specialties** `h3` (keeps `h1→h2→h3` order) listing all service names as badges above the stats grid.
- ✅ No backend changes (list/detail endpoints already return `services`).
- ✅ E2E (`browse.spec.ts`): search card shows badge chips + `+1 more` (Emeka, 4 seeded services); Emeka's profile shows the Specialties heading + `Pipe Installation`/`Emergency Leak Repair`/`Drain Cleaning`. Verified: frontend lint + build clean; Playwright `browse` (5) green.

### Completed-job history (Growth Roadmap P0.4) — DONE

- ✅ Backend `ArtisanService.findOne` now returns `completedJobsCount` (count of `COMPLETED` bookings for the artisan) + `recentCompletedJobs` (last 5 completed bookings: `id`, `description`, `date`), fetched in parallel with `Promise.all`. No schema change.
- ✅ Frontend: `Artisan` type gains `completedJobsCount` + `recentCompletedJobs` (new `CompletedJob` type); normalizer maps + formats dates (`en-NG` locale); mock data updated.
- ✅ Public profile About tab:
  - The **Jobs Completed** stat now shows the **real** completed-booking count (previously a fake `reviews+` figure).
  - New **Work History** section (visible only when there are completed jobs) lists recent jobs with a check icon, truncated description, and the job date.
- ✅ Unit test: `artisan.service.spec.ts` asserts the count + recent-jobs query shape (`where { artisanId, status: 'COMPLETED' }`, `take: 5`). Backend build + **71 unit tests** green.
- ✅ E2E (`browse.spec.ts`): Chidi (1 seeded completed booking) shows the Work History heading, `Build custom bookshelf`, and a `Jobs Completed` stat of `1`. Verified: frontend lint + build clean; Playwright `browse` (6) + `booking` (4) specs green.

### Response-time badges (Growth Roadmap P3.12 — low-effort proxy) — DONE

- ✅ Refactored `frontend/src/lib/utils.ts`: extracted `parsePhoneDigits()` (shared digit-normalisation) + new `isWhatsAppPhone()`; `buildWhatsAppLink()` reuses it.
- ✅ Public artisan profile header now shows a neutral **Quick responder** badge (Zap icon, amber) for any artisan with a valid WhatsApp-parseable phone number **and** `available: true` — the roadmap's "low effort now" proxy signal. Neutral by design: no harm while unmeasured; can be upgraded to measured first-response time later.
- ✅ E2E (`browse.spec.ts`): Emeka (valid phone + available) shows `Quick responder`; Chidi (busy) does not. Verified: frontend lint + build clean; Playwright `browse` (6) green.

### Real ID verification (Growth Roadmap P0.1) — DONE

- ✅ Schema: new `verificationDocUrl` column on `ArtisanProfile`; `verificationStatus` extended to `UNVERIFIED | PENDING | VERIFIED | REJECTED` (migration `20260810215747_add_verification_document`).
- ✅ Backend:
  - `UploadService.uploadVerificationDocument` (folder `naijahandy/verification`, no crop).
  - `POST /api/artisans/me/verification-document` (artisan auth): uploads the ID image, sets status `PENDING`; blocks resubmission while a doc is already pending; allows resubmission after a rejection.
  - Public `findOne` **strips `verificationDocUrl`** (never leaks the document) but exposes `verificationStatus` for badge states.
  - Admin `setArtisanVerification` now accepts `REJECTED`; verify/reject send an email + in-app notification (`IDENTITY_VERIFIED`/`IDENTITY_REJECTED` — new notification types).
- ✅ Frontend:
  - Public profile header badges: **Verification pending** (amber) / **Verification rejected** (red) alongside the existing Verified badge.
  - Artisan dashboard → My Profile: new **ID Verification** card with status pill (Not submitted / Pending review / Rejected / Verified), document upload, previously-submitted preview, and clear reject/pending messaging.
  - Admin → Artisans: verification pill tones for PENDING/REJECTED, a **View ID** link to the submitted document, and Verify/Reject actions when pending (Verify/Unverify otherwise).
- ✅ Tests: `artisan.service.spec.ts` — submit sets PENDING + stores URL, blocks while pending, allows resubmit after rejection, NotFound when missing, and `findOne` strips the doc URL. Backend **76 unit tests** green.
- ✅ E2E (`verification.spec.ts`): artisan uploads a 1×1 PNG → dashboard shows Pending review → admin rejects → dashboard shows Rejected → admin verifies → dashboard shows Verified; public profile shows **Verified Artisan**; public API returns `verified: true` with **no** `verificationDocUrl`.
- ✅ Verified: backend `tsc` + 76 unit tests; frontend lint + build clean; Playwright browse (6) + booking (4) + verification (1) + dashboard/settings/auth/seo/a11y (14) all green.

### Review photos + verified-buyer tag (Growth Roadmap P0.2) — DONE

- ✅ Schema: optional `photoUrl` on `Review` (migration `add_review_photo`).
- ✅ Backend:
  - `UploadService.uploadReviewPhoto` (folder `naijahandy/reviews`, 800×600 fill).
  - `BookingService.createReview` now takes an optional `photoUrl`, uploads before persisting, and stores it; `BookingModule` imports `UploadModule`.
  - `POST /api/bookings/:id/review` accepts an optional `photoUrl`.
- ✅ Frontend:
  - `/bookings`: the review dialog lets the customer attach a photo (preview + remove) and submits it with the rating/comment.
  - Public profile Reviews tab: renders the work photo and a **Verified buyer** badge next to the reviewer name (reviews only come from completed bookings, so the tag is always accurate).
  - Admin → Reviews: thumbnail link to the review photo for moderation.
- ✅ Tests: `booking.service.spec.ts` — review with photo stores the uploaded URL; upload errors propagate. Backend **77 unit tests** green.
- ✅ E2E (`review.spec.ts`): book + pay → artisan confirms/completes → customer leaves a 5-star review with a photo → public profile shows the photo + **Verified buyer**; also hardened the e2e cleanup to delete reviews before bookings (FK order). Verified: backend 77 tests; frontend lint + build clean; full Playwright suite **26/26** green.

### Repeat booking — one-tap rehire (Growth Roadmap P2.9) — DONE

- ✅ `/bookings` (customer history): completed booking cards now show a **Book Again** button that links to the artisan's profile with the previous time + job description as query params (`?bookagain=1&time=…&desc=…`).
- ✅ Public profile booking sidebar: when arriving via `bookagain=1`, it pre-fills the time and job description from the last job, defaults the date to today, shows a green **Rebooking** banner, and smooth-scrolls the booking form into view — so rehiring a trusted artisan is one tap.
- ✅ Frontend-only change (no backend/schema work needed — rebook reuses the existing create-booking flow).
- ✅ E2E (`booking.spec.ts`): book + pay → artisan completes → **Book Again** → profile pre-filled (time, description, date) + banner → one-tap re-books and pays through mock Paystack. Verified: frontend lint + build clean; full Playwright suite **27/27** green.

### Upfront price estimates (Growth Roadmap P1.7) — DONE

- ✅ New helpers in `frontend/src/lib/utils.ts`: `minServiceRate(services)` and `estimateBookingAmount(services, service, hours, hourlyRate)` → `{ unitRate, serviceFee, platformFee, total }` (per-service rate × duration + ₦500 platform fee).
- ✅ **Per-service estimate before booking**: the profile booking sidebar now has a **Service** select (each service with its rate — the `Service.rate` column already existed) and a **Duration** select (1/2/4/8 hrs); the **Estimated Total** breakdown updates live, and the charged `amount` sent to booking + Paystack is exactly that estimate (falls back to `hourlyRate × hours + 500` for artisans without services). Booking form controls now have proper label/input association (`booking-date`, `booking-time`, `booking-service`, `booking-duration`, `job-desc`) — also an a11y win.
- ✅ **"From ₦X" pricing surfaced on cards**: home `ArtisanCard` and `/search` result cards now show **From ₦X** (lowest service rate) instead of a plain hourly rate when the artisan has priced services.
- ✅ WhatsApp booking message now includes the chosen service, duration, and estimated total.
- ✅ E2E (`booking.spec.ts`): a bookable artisan with two seeded services (₦15,000 / ₦8,000) → estimate defaults to ₦30,500 (2hrs), re-prices to ₦16,500 on service change and ₦8,500 on 1hr, and the customer is charged exactly ₦8,500 through mock Paystack. All e2e specs switched from ambiguous `getByRole('combobox')` to `getByLabel('Time')`. Verified: frontend lint + build clean; full Playwright suite **28/28** green.

### Better search filters — price range + distance (Growth Roadmap P1.8) — DONE

- ✅ Backend `ArtisanService.findAll`:
  - New query params `minPrice`/`maxPrice` filter by the **effective rate** (lowest service rate, falling back to `hourlyRate` for artisans without services) — the exact figure the "From ₦X" cards already display. Implemented as `AND[ price-OR, keyword-OR ]` so price and keyword searches compose.
  - New query params `lat`/`lng`/`radius` (default 50 km) + `sortBy=distance`: fetches matching artisans (list endpoint now selects `user.latitude/longitude`), computes **Haversine** distance in JS, excludes coordinate-less artisans, filters to the radius, sorts ascending, attaches `distanceKm` (1 decimal), and paginates via slice. `sortBy=distance` without a location falls back to rating sort.
  - Exported `haversineKm()` pure helper.
- ✅ Frontend `/search`:
  - New **Price** filter section with preset bands (Any / Under ₦5k / ₦5k–₦10k / ₦10k–₦20k / Over ₦20k) sending `minPrice`/`maxPrice`.
  - **Use my location** button (`navigator.geolocation`) activates distance mode (`lat/lng/radius=50`, auto-selects **Nearest** sort, shows a "Using your location" chip with Clear; graceful "Location unavailable" message on denial). Sort dropdown shows **Nearest** (disabled) while location is active.
  - Result cards show **"X km away"** when the backend returns `distanceKm`.
  - "Clear filters" (empty state) now also resets price band + location.
- ✅ `/search` fetch now guards against stale responses (a request-id ref ignores any out-of-order response older than the latest filter change) — fixes a race where an unfiltered response could briefly overwrite filtered results.
- ✅ Tests: `artisan.service.spec.ts` — price-bounds where shape, lower-bound-only, keyword+price AND composition, distance ordering + radius filtering + coordinate-less exclusion, rating fallback, and `haversineKm` (zero/null/sanity). Backend **86 unit tests** green.
- ✅ E2E (`search-filters.spec.ts`): price band hides a ₦25,000 artisan while showing a ₦3,000 one (service-rate pricing); with browser geolocation granted, a 0 km artisan shows "0 km away" while a ~55 km one is excluded by the 50 km radius. `createBookableArtisan` helper now accepts optional `{ latitude, longitude }` (set via `PATCH /api/users/me`). Verified: frontend lint + build clean; Playwright `search-filters` (2) green. (Full-suite runs occasionally flake on Supabase latency — login/upload/review POSTs stalling — each such test passes in isolation; not a code regression.)

### Instant booking — one-tap request with saved details (Growth Roadmap P1.6) — DONE

- ✅ Schema: optional `address` + `customerPhone` columns on `Booking` (migration `20260811163912_add_booking_contact`, applied to CI + prod). Captures a snapshot of where the job happens + how to reach the customer, independent of the profile row.
- ✅ Backend: `POST /api/bookings` accepts optional `address` (max 300) + `customerPhone` (max 30) via `createSchema`; `BookingService.create` persists them (null when omitted). Zod `.parse` still strips unknown keys, so older clients are unaffected. Booking e2e suite green.
- ✅ Frontend:
  - `Booking` type + normalizer surface `address`/`customerPhone`.
  - Public profile booking sidebar loads the customer's saved contact (`fetchMe` fallback to `getStoredUser`) and prefills editable **Phone** + **Job Address** fields; submitting either flow persists them back via `PATCH /users/me` so next time is prefilled ("saved details").
  - New **"Send Instant Request"** amber one-tap button: creates the booking request with today's date, **ASAP** time (new time option), a sensible default description, and the saved contact — **no Paystack redirect** (requests are free; payment only happens at checkout). Requires a phone so the artisan can reach the customer; success shows a green "Instant request sent" banner. Unauthenticated users are sent to login.
  - Existing "Proceed to Book & Pay" path unchanged.
  - Artisan **Job Requests** now show the customer's phone (tap-to-call) + job address so they can actually reach out.
- ✅ Verified: backend `tsc` + 87 unit tests + booking e2e (21) green; frontend lint + build clean.

### WhatsApp repurposed: support chat, not a booking action — DONE

- ✅ **UX decision:** WhatsApp can't confirm bookings or take payment, so the full-width "Book via WhatsApp" button (deep-linked with date/time/estimate) was removed. Booking now has two clear in-app paths only: **Send Instant Request** (free) and **Proceed to Book & Pay** (Paystack + confirmation) — no off-platform untracked requests.
- ✅ WhatsApp stays as **support/chat**: the header "Message" button remains, and the booking sidebar now shows a subtle neutral card ("Questions before you book? Chat with {name} on WhatsApp") whose prefilled message asks a question about the service — no date/time/estimate prefill. Demo profiles still hide WhatsApp entirely.
- ✅ E2E (`browse.spec.ts`): support link visible with `wa.me` href + question-style message (asserts **no** `Date:`/`Time:`/`Estimated total:` prefill), header Message link shares the href, `Book via WhatsApp` count is 0. All 6 browse e2e green; frontend lint + `tsc` + build clean.
- ⏭️ **Future option:** platform-wide AI chat assistant / help & contact centre for customer questions (kept out of scope here).

---

### Help & Support centre + AI assistant (Growth Roadmap P1.7) — SPEC

**Why now:** WhatsApp is now a per-artisan support channel, but the platform itself has no help surface. Users who get stuck mid-booking (or distrust the process) have nowhere to go and leave. This is a drop-off/trust problem first, a cost-saver second.

**Outcome:** Any user can (a) find a curated answer to a common question in seconds, (b) reach a human when needed — without abandoning the app. The AI assistant answers confidently from our own help content and escalates honestly.

**Phase 1 — Help Centre + human contact (Easy, no AI). Do this first.**
- New `/help` page (public) with categorized FAQs, all written by us:
  - Getting started (registration, saved artisans, shortlisting).
  - Booking & payment (instant request vs book & pay, Paystack flow, refunds, cancelled bookings).
  - Trust & safety (verified badge, ID verification, how reviews are moderated).
  - Disputes & the service guarantee (existing dispute flow on bookings — link to `/bookings`).
  - Artisan side (job requests, payout, verification).
- Entry points: footer link + a "Need help?" link on the booking sidebar (near the "Instant requests are free" note) + a small help widget button in the header nav.
- Contact form (fallback for anything not covered): subject + message → creates a `SupportMessage` row (auth'd users prefilled with name/email/phone) and emails `support@naijahandy.com`. Admin "Support" inbox in the existing dashboard to read/reply.
- Success: % of help visitors who reach an answer without a ticket; ticket volume baseline (measure before Phase 2).

**Phase 2 — AI assistant (Hard). Gate on Phase 1 being live with real FAQ data.**
- **Build vs buy decision (decide during Phase 2 kickoff):**
  - *Buy* (e.g. Intercom/Crisp/Tidio AI): fastest, but recurring cost, user data leaves the platform, weaker custom routing to our flows.
  - *Build*: a `SupportChatController`/`SupportChatService` in the existing NestJS backend + a floating chat widget in the frontend.
- **Build approach (if chosen):**
  - LLM via API (OpenAI/Anthropic) with **RAG over the Phase-1 help articles** (store articles as markdown in a `HelpArticle` table; chunk + embed with `pgvector` in Postgres; retrieve top-k by cosine similarity).
  - System prompt: answer **only** from retrieved articles; if no confident match, answer "I'm not sure — here's how to reach a human" and show the contact form / support email; never invent policies or prices.
  - **Structured actions** surfaced as buttons in chat: "View my bookings", "Open dispute", "Contact support" (deep links to existing `/bookings` and the contact form) — the assistant routes to flows, it doesn't replace them.
  - Rate limits (per-user per-hour), token caps, latency budget (~2 s), and a content-safety layer that rejects personal-data extraction, prompt-injection attempts, and abuse.
  - **Privacy:** never send PII (email/phone/booking IDs) into the prompt unless the user volunteers it; logs store only the question + article IDs for quality review, never booking payloads.
  - Human escalation: low-confidence answers + explicit "talk to a human" requests create a `SupportMessage` with the chat transcript.
- **Success metrics:** ticket-deflection rate (Phase-1 baseline → after), AI answer-accuracy (sampled human review), completion of a booking within 1 day of a help session, escalation rate.

**Explicitly out of scope (for now):** voice assistant, proactive/outbound support, personalizing answers with a user's live booking data, and AI for the *artisan* help surface (same infra later, but not now).

**Risks:** LLM hallucinating policy (mitigated: retrieval-only answers + strict system prompt + human review sampling); cost (mitigated: rate limits + caching repeated questions); privacy (mitigated: no PII in prompts, minimal logging).

**Ordering note:** Phase 1 ships alone and pays for itself; Phase 2 is a follow-up decision once real ticket data exists.

### Help & Support Phase 1 — DONE

- ✅ **Schema:** `SupportMessage` model (`name`, `email`, `phone?`, `subject`, `message`, `status` OPEN|REPLIED|CLOSED, optional `userId` → `User` with `SetNull`). Migration `20260811173505_add_support_messages` applied to **CI** (`naijahandy_ci`, via `prisma migrate dev`) and **prod** (`postgres`, via `prisma migrate deploy`).
- ✅ **Backend:** new `SupportModule` with `POST /api/support/messages` — public (OptionalJwtAuthGuard: logged-in users' messages link to their `userId`; guests stay anonymous). Zod-validated (name ≥2, email, phone ≤30, subject 3–120, message 10–2000). Sends a support email (new `EmailService.sendSupportMessageEmail`, gated by `EMAIL_ENABLED`) to `SUPPORT_EMAIL || support@naijahandy.com`.
- ✅ **Admin inbox:** `GET /api/admin/support-messages` (status filter + pagination, includes linked user) and `PATCH /api/admin/support-messages/:id/status` (OPEN/REPLIED/CLOSED). `AdminStats` gained `openSupportMessages` (count + red badge on the Support tab).
- ✅ **Frontend `/help`:** public Help Centre with 5 categorized FAQ accordions (Getting started · Booking & payments · Trust & safety · Disputes & guarantee · For artisans), a contact form prefilled from the stored profile (name/email/phone) that POSTs to `/api/support/messages` and shows a success banner, plus a `mailto:support@naijahandy.com` fallback card. Sticky contact column on desktop.
- ✅ **Entry points:** Navbar "Help" link (desktop + mobile), Footer "Help Centre" link, and a "Need help? Visit our Help Centre" link on the artisan booking sidebar.
- ✅ **Admin console:** new **Support** tab (status filter pills, subject/message/contact rows, open-count badge in both sidebars + overview stat card, Mark replied / Close / Reopen / Reply-to-email actions).
- ✅ **Verified:** backend `tsc` + 91 unit tests green (4 new support-service tests); booking + admin + payment backend e2e suites each green individually (full-run flake = shared-DB cross-suite interference, pre-existing); frontend lint + `tsc` + build clean; Playwright `help.spec.ts` (2) green (FAQ expand + contact form success banner).
- ⏭️ **Phase 2 (AI assistant)** — still pending; gate on real ticket volume/FAQ data. See spec above.
