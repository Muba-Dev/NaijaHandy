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
