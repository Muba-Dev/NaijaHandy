-- =============================================================================
-- NaijaHandy — Supabase RLS Remediation
-- -----------------------------------------------------------------------------
-- Resolves the 13 Security Advisor findings ("RLS disabled in public" + the
-- "public.refresh_tokens" sensitive-column exposure).
--
-- ARCHITECTURE (confirmed): Architecture B
--   Frontend (Next.js)  ->  NestJS API (backend/)  ->  Prisma  ->  Supabase PostgreSQL
--
--   * The frontend never talks to Supabase directly (no anon/service key usage).
--   * The backend connects through Prisma using DATABASE_URL. In Supabase this
--     resolves to the `postgres` superuser role, which has BYPASSRLS, so RLS
--     policies NEVER block the application.
--   * RLS is therefore a defense-in-depth boundary: it locks the tables against
--     direct access via the anon / authenticated roles (e.g. PostgREST, a leaked
--     anon key, or accidental direct client queries).
--
-- RLS MODEL (least privilege):
--   * Sensitive tables (users, refresh_tokens, bookings, payments,
--     saved_artisans, _prisma_migrations, disputes): RLS enabled and NO policy
--     granted to anon/authenticated => default deny-all for any direct client.
--     The trusted backend remains the only way to read/write them.
--   * Public catalog tables (artisan_profiles, services, portfolio_items,
--     reviews): anonymous SELECT is allowed because that data is already served
--     publicly by the unauthenticated API endpoints and contains no credentials
--     or PII beyond what the public profile page shows.
--
-- NOTE ON auth.uid():
--   Users are identified by Prisma CUIDs, NOT Supabase Auth UUIDs. The
--   application does not use Supabase Auth, so `auth.uid() = "userId"` policies
--   could never match and are intentionally NOT created. Ownership + role
--   authorization is enforced by the NestJS API (the only accessor), not by
--   Supabase Auth sessions.
--
-- IDEMPOTENT: safe to run multiple times.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. SNAPSHOT / BACKUP REMINDER
-- -----------------------------------------------------------------------------
-- Run a backup BEFORE applying anything:
--   bash backend/supabase/backup-db.sh
-- Or in the Supabase dashboard: Database -> Backups -> Take a new backup.

BEGIN;


-- -----------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY ON EVERY EXISTING public TABLE
-- -----------------------------------------------------------------------------
-- Dynamic loop so it also covers tables created outside the Prisma migration
-- history (e.g. public.disputes) and any table the advisor lists.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;


-- -----------------------------------------------------------------------------
-- 3. DENY-ALL FOR SENSITIVE TABLES
-- -----------------------------------------------------------------------------
-- RLS with no matching policy is default-deny for non-bypass roles. We go one
-- step further and revoke even the base privileges from anon/authenticated so a
-- policy slip can never expose these tables. (postgres / service_role keep full
-- access, so the backend is unaffected.)

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    '_prisma_migrations',
    'users',
    'refresh_tokens',
    'bookings',
    'payments',
    'saved_artisans',
    'disputes'
  ] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END $$;


-- -----------------------------------------------------------------------------
-- 4. PUBLIC CATALOG TABLES — READ-ONLY FOR anon / authenticated
-- -----------------------------------------------------------------------------
-- These are the tables the public (unauthenticated) API already exposes. The
-- policies are SELECT-only, scoped to roles, and never grant INSERT/UPDATE/DELETE.

-- 4.1 artisan_profiles — public listing (matches GET /api/artisans)
DROP POLICY IF EXISTS "public_read_artisan_profiles" ON public.artisan_profiles;
CREATE POLICY "public_read_artisan_profiles"
  ON public.artisan_profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4.2 services — public service list (shown on artisan profile page)
DROP POLICY IF EXISTS "public_read_services" ON public.services;
CREATE POLICY "public_read_services"
  ON public.services
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4.3 portfolio_items — public portfolio images (shown on artisan profile page)
DROP POLICY IF EXISTS "public_read_portfolio_items" ON public.portfolio_items;
CREATE POLICY "public_read_portfolio_items"
  ON public.portfolio_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4.4 reviews — public review content (shown on artisan profile page)
DROP POLICY IF EXISTS "public_read_reviews" ON public.reviews;
CREATE POLICY "public_read_reviews"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);


-- -----------------------------------------------------------------------------
-- 5. AUTOMATICALLY ENABLE RLS FOR FUTURE TABLES
-- -----------------------------------------------------------------------------
-- Equivalent of the Supabase "Automatically enable RLS for new tables" toggle.
-- Fires whenever a table is created (including by future Prisma migrations),
-- ensuring a new table can never silently ship without RLS.

CREATE OR REPLACE FUNCTION public.enable_rls_on_new_table()
RETURNS event_trigger AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN
    SELECT event_object_schema, event_object_name
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag = 'CREATE TABLE'
  LOOP
    IF obj.event_object_schema = 'public' THEN
      EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', obj.event_object_schema, obj.event_object_name);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

DROP EVENT TRIGGER IF EXISTS enable_rls_on_new_table;
CREATE EVENT TRIGGER enable_rls_on_new_table
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION public.enable_rls_on_new_table();


-- -----------------------------------------------------------------------------
-- 6. POST-CHANGE CHECK
-- -----------------------------------------------------------------------------
-- Should return zero rows. Any table listed here still has RLS disabled.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM pg_class c
        WHERE c.relname = pg_tables.tablename
          AND c.relrowsecurity = true
      )
  LOOP
    RAISE WARNING 'RLS still disabled on public.%', t.tablename;
  END LOOP;
END $$;

COMMIT;

-- -----------------------------------------------------------------------------
-- After applying, confirm in the Supabase dashboard:
--   Security Advisor  ->  should show the RLS findings cleared.
-- And run the end-to-end smoke tests in README section "Security — Testing".
-- -----------------------------------------------------------------------------
