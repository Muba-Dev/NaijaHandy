# NaijaHandy — Developer Handoff Package

Nigeria's premier artisan-finder marketplace. This package contains the complete source code your developer needs to build and deploy the full application.

---

## Project Structure

```
handoff/
├── frontend/          ← Next.js 15 + TypeScript + Tailwind CSS
└── backend/           ← Node.js + Express + Prisma + PostgreSQL
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v3 |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Authentication | JWT + bcrypt |
| Frontend Deploy | Vercel |
| Backend Deploy | Render or Railway |
| Database Host | Neon PostgreSQL |

---

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| Primary | `#047857` | Buttons, links, active states |
| Accent | `#F59E0B` | Highlights, badges, CTAs |
| Background | `#F9FAFB` | Page background |
| Radius | `16px` / `12px` | Cards and inputs |
| Font — Display | Fraunces (serif) | All h1–h4 headings |
| Font — Body | Outfit (sans-serif) | All body text |

---

## Pages

| Route | Page | Notes |
|---|---|---|
| `/` | Home / Landing | Hero, categories, featured artisans, How It Works |
| `/login` | Login | Email + password, Google OAuth button |
| `/register` | Register | Customer vs Artisan toggle |
| `/search` | Search & Results | Filters sidebar + artisan list |
| `/artisans/[id]` | Artisan Profile | Tabs: About, Services, Portfolio, Reviews + booking sidebar |
| `/dashboard/customer` | Customer Dashboard | Stats, upcoming bookings |
| `/dashboard/artisan` | Artisan Dashboard | Toggle availability, job requests, calendar |
| `/bookings` | Booking History | Filter tabs: All / Active / Completed / Cancelled |
| `/settings` | Profile Settings | Tabs: Personal, Security, Payment, Notifications |
| `404` | Not Found | Friendly error page |

---

## Quick Start — Frontend

```bash
cd frontend
npm install          # or: pnpm install
cp .env.local.example .env.local
npm run dev          # starts on http://localhost:3000
```

### Environment Variables (frontend/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## Quick Start — Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET in .env

npx prisma migrate dev --name init   # runs migrations
npx prisma generate                  # generates Prisma client
npm run dev                          # starts on http://localhost:4000
```

### Environment Variables (backend/.env)

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/naijahandy?sslmode=require"
JWT_SECRET="your-super-secret-key"
FRONTEND_URL="http://localhost:3000"
PORT=4000
```

---

## Database (Neon PostgreSQL)

1. Go to [neon.tech](https://neon.tech) and create a free project
2. Copy the **Connection string** → paste as `DATABASE_URL` in `backend/.env`
3. Run: `npx prisma migrate dev --name init`

### Schema Summary

| Model | Description |
|---|---|
| `User` | All users (customers + artisans) with `role` field |
| `ArtisanProfile` | Artisan-specific data linked to `User` |
| `Service` | Services offered by an artisan (name + rate) |
| `PortfolioItem` | Photos uploaded by artisan |
| `Booking` | Customer → Artisan booking with status |
| `Review` | Customer review after completed booking |
| `SavedArtisan` | Customer's saved/favourited artisans |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user (customer or artisan) |
| POST | `/api/auth/login` | Login → returns JWT token |

**Login response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "id": "...", "name": "Chisom Eze", "role": "CUSTOMER" }
}
```

Store token in `localStorage` (already handled in `src/lib/utils.ts`).

### Artisans
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/artisans` | List artisans (filters: category, city, minRating, available) |
| GET | `/api/artisans/:id` | Single artisan profile |
| PATCH | `/api/artisans/me` | Update own profile (artisan only, requires JWT) |

**Query params example:**
```
GET /api/artisans?category=Plumbing&city=Lagos&minRating=4.5&available=true&sortBy=rating
```

### Bookings
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/bookings` | Create booking (customer, requires JWT) |
| GET | `/api/bookings` | List own bookings (filtered by role, requires JWT) |
| PATCH | `/api/bookings/:id/status` | Update booking status (requires JWT) |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me` | Get own profile (requires JWT) |
| PATCH | `/api/users/me` | Update own profile (requires JWT) |

**All protected routes:** Include header `Authorization: Bearer <token>`

---

## Connecting Frontend to Backend

In `src/lib/data.ts`, replace the mock arrays with API calls. Example pattern:

```typescript
// Before (mock):
export const ARTISANS = [{ id: 1, name: 'Emeka Okafor', ... }]

// After (real API):
import axios from 'axios'
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL })

export async function fetchArtisans(params?: Record<string, string>) {
  const res = await api.get('/artisans', { params })
  return res.data.data
}
```

For server components (Next.js App Router), use `fetch` directly:
```typescript
// app/search/page.tsx (server component)
const artisans = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/artisans`).then(r => r.json())
```

---

## Security — Supabase Row Level Security (RLS)

### Architecture (confirmed)

NaijaHandy uses **Architecture B**:

```
Frontend (Next.js)
   ↓  HTTP + JWT (never talks to Supabase directly)
NestJS API (backend/)
   ↓  Prisma
Supabase PostgreSQL
```

- The frontend never uses a Supabase client or anon/service key.
- The backend connects via `DATABASE_URL` as the `postgres` superuser role, which has `BYPASSRLS` — so **RLS policies never block the application**.
- RLS is a **defense-in-depth** boundary that locks tables against direct access through the `anon` / `authenticated` roles (e.g. a leaked anon key, PostgREST, or accidental client queries).
- User IDs are Prisma CUIDs, not Supabase Auth UUIDs, and the app does **not** use Supabase Auth. `auth.uid()` ownership policies can therefore never match and are intentionally not used. Ownership + role authorization is enforced by the NestJS API.

### Remediation files (`backend/supabase/`)

| File | Purpose |
|---|---|
| `rls-migration.sql` | Enables RLS on every public table, deny-alls sensitive tables, grants read-only catalog policies, adds auto-RLS for new tables |
| `rls-rollback.sql` | Reverts to the pre-remediation state |
| `backup-db.sh` | Logical backup — auto-uses `pg_dump` or falls back to the Supabase CLI (`supabase db dump`). Run **before** applying |
| `verify-rls.sql` | Confirms RLS state, policies, privileges, event trigger |

### Applying the fix

```bash
# 1. Snapshot (rollback point) — auto-selects pg_dump or Supabase CLI
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/naijahandy?sslmode=require" \
  bash backend/supabase/backup-db.sh

#    Force a specific method if needed:
#    bash backend/supabase/backup-db.sh --method pgdump     # needs Postgres client tools
#    bash backend/supabase/backup-db.sh --method supabase   # needs: npm i -g supabase && supabase login

# 2. Apply RLS remediation
psql "$DATABASE_URL" -f backend/supabase/rls-migration.sql

# 3. Verify
psql "$DATABASE_URL" -f backend/supabase/verify-rls.sql

# 4. Confirm in Supabase dashboard: Security Advisor findings cleared.
```

Alternatively, run the `.sql` files in the Supabase **SQL Editor** (Database → SQL Editor).

### RLS model

- **Sensitive — deny-all for anon/authenticated**: `users`, `refresh_tokens`, `bookings`, `payments`, `saved_artisans`, `disputes`, `_prisma_migrations`. No policies exist for these, and privileges were revoked from `anon`/`authenticated`. Only the trusted backend (`postgres` / `service_role`) can access them.
- **Public catalog — read-only**: `artisan_profiles`, `services`, `portfolio_items`, `reviews` get a `SELECT`-only policy for `anon`/`authenticated`. This data is already served publicly by the unauthenticated API.
- **Future tables**: an event trigger enables RLS automatically on any new `public` table.

### Password & token handling

- Passwords are hashed with **bcrypt (cost 12)** in `backend/src/auth/auth.service.ts` — never stored or returned in plaintext.
- Refresh tokens live only in `public.refresh_tokens`, managed exclusively by the backend, and are revoked on rotation/logout. With RLS enabled and no policy, the `Sensitive Columns Exposed — public.refresh_tokens` finding is resolved.

### Regression testing (after applying)

1. Start backend: `npm run dev:backend` (needs `backend/.env` with `DATABASE_URL` + `JWT_SECRET`).
2. Register customer + artisan, login, logout (refresh-token revocation).
3. List/search artisans, open an artisan profile (services, portfolio, reviews).
4. Create a booking as customer; accept/complete as artisan; cancel path.
5. Update profile settings.
6. Confirm direct `anon`-key queries against `users` / `refresh_tokens` return no rows.

---

## Deployment

### Frontend → Vercel

1. Push `frontend/` to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Set **Root Directory** to `frontend`
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`
5. Deploy

### Backend → Render

1. Push `backend/` to a GitHub repo (can be same repo, different dir)
2. Go to [render.com](https://render.com) → New Web Service
3. Set **Root Directory** to `backend`
4. Build command: `npm install && npx prisma generate && npm run build`
5. Start command: `npm start`
6. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`
7. Deploy

### Backend → Railway (alternative)

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Add a PostgreSQL plugin (or use Neon)
3. Set the same environment variables
4. Deploy

---

## Replacing Mock Data

The current `src/lib/data.ts` uses hardcoded Nigerian artisan data for UI display. Replace in this order:

1. **Auth** — wire `/login` and `/register` forms to `POST /api/auth/*`
2. **Search page** — replace `ARTISANS` array with `GET /api/artisans?...`
3. **Artisan profile** — replace `ARTISANS.find()` with `GET /api/artisans/:id`
4. **Bookings** — replace `BOOKINGS` array with `GET /api/bookings`
5. **Dashboards** — use real user data from `/api/users/me`

---

## Key Files to Know

```
frontend/
├── src/app/layout.tsx          ← Fonts, Navbar, Footer wired here
├── src/lib/data.ts             ← REPLACE THIS with real API calls
├── src/lib/utils.ts            ← formatNGN(), auth token helpers
├── src/types/index.ts          ← All TypeScript interfaces
└── tailwind.config.ts          ← Theme colours (primary #047857, accent #F59E0B)

backend/
├── prisma/schema.prisma        ← Full database schema
├── src/index.ts                ← Express app entry point
├── src/routes/auth.ts          ← Register + Login
├── src/routes/artisans.ts      ← Artisan CRUD
├── src/routes/bookings.ts      ← Booking CRUD
└── src/middleware/auth.ts      ← JWT authentication middleware
```

---

## Notes for Developer

- All price values are in **Nigerian Naira (₦)**. Store as integers in the database (no decimals).
- The `formatNGN()` utility in `src/lib/utils.ts` handles display formatting.
- JWT tokens expire in **7 days**. Store in `localStorage` and clear on logout.
- Image uploads are not yet implemented — use Cloudinary or AWS S3 for production.
- The Google OAuth button on the login page is UI-only — wire it to NextAuth.js or Passport.js.
- Verification (`verified: true` badge) should be set manually by admins in the database initially.
