-- =============================================================================
-- NaijaHandy — Rollback for RLS Remediation
-- -----------------------------------------------------------------------------
-- Restores the PRE-remediation state:
--   * drops all RLS policies created by rls-migration.sql
--   * re-grants the default public-schema privileges to anon / authenticated
--   * disables RLS on all public tables
--   * removes the "enable RLS on new table" event trigger
--
-- WARNING: Disabling RLS re-opens the tables to direct client access and
-- re-introduces the Security Advisor findings. Only run this to revert to the
-- previous snapshot (e.g. after a backup restore).
-- =============================================================================

BEGIN;

-- 1. Drop the policies added by the remediation
DROP POLICY IF EXISTS "public_read_artisan_profiles" ON public.artisan_profiles;
DROP POLICY IF EXISTS "public_read_services"        ON public.services;
DROP POLICY IF EXISTS "public_read_portfolio_items" ON public.portfolio_items;
DROP POLICY IF EXISTS "public_read_reviews"         ON public.reviews;

-- 2. Re-grant default Supabase public-schema privileges to anon / authenticated
--    (restores the grants revoked by the remediation). Adjust to match your
--    original grants if they were customized.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 3. Disable RLS on every public table (back to pre-remediation state)
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

-- 4. Remove the automatic-RLS event trigger
DROP EVENT TRIGGER IF EXISTS enable_rls_on_new_table;
DROP FUNCTION IF EXISTS public.enable_rls_on_new_table();

COMMIT;
