-- =============================================================================
-- NaijaHandy — Verify RLS Remediation
-- -----------------------------------------------------------------------------
-- Run AFTER applying rls-migration.sql to confirm:
--   1. No public table has RLS disabled.
--   2. Sensitive tables have NO policies for anon/authenticated (deny-all).
--   3. Public catalog tables have only the read policy.
--   4. The automatic-RLS event trigger exists.
-- =============================================================================

-- 1. Tables in public with RLS STILL DISABLED (expect: 0 rows)
SELECT n.nspname AS schema,
       c.relname  AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
ORDER BY c.relname;

-- 2. Tables in public WITHOUT FORCE RLS (informational)
SELECT n.nspname AS schema, c.relname AS table_name, c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

-- 3. All RLS policies in public (review per table)
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Sensitive tables should appear with NO rows here (no policies at all)
SELECT schemaname, tablename
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('_prisma_migrations','users','refresh_tokens','bookings','payments','saved_artisans','disputes')
ORDER BY tablename;

-- 5. Privileges granted to anon / authenticated (sensitive tables should be absent)
SELECT table_schema, table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;

-- 6. Automatic-RLS event trigger (expect: 1 row)
SELECT evtname, evtenabled
FROM pg_event_trigger
WHERE evtname = 'enable_rls_on_new_table';
