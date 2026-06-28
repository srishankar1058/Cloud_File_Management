-- ============================================================
-- supabase_rls_patch.sql
--
-- Tightens Row Level Security so that:
--   • Direct client access (anon/authenticated JWT) is BLOCKED for writes.
--   • Only the Express server (using the Service Role key, which bypasses RLS)
--     can INSERT / UPDATE / DELETE rows.
--   • SELECTs from the client are also blocked — all reads go through the proxy.
--
-- Run this in the Supabase SQL editor (Dashboard → SQL).
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. Enable RLS on all tables (idempotent)
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices     ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────
-- 2. Drop any existing policies (clean slate)
-- ──────────────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM   pg_policies
    WHERE  schemaname = 'public'
    AND    tablename IN ('profiles','files','audit_logs','devices')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END
$$;

-- ──────────────────────────────────────────────────────────
-- 3. Block ALL direct client access
--
-- With RLS enabled and no permissive policies, Postgres denies
-- everything by default. The explicit DENY policies below make
-- the intent unmistakable and survive future Supabase dashboard
-- "magic" that might otherwise auto-create an authenticated policy.
-- ──────────────────────────────────────────────────────────

-- profiles
CREATE POLICY "deny_client_select_profiles"
  ON public.profiles FOR SELECT
  USING (false);

CREATE POLICY "deny_client_insert_profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (false);

CREATE POLICY "deny_client_update_profiles"
  ON public.profiles FOR UPDATE
  USING (false);

CREATE POLICY "deny_client_delete_profiles"
  ON public.profiles FOR DELETE
  USING (false);

-- files
CREATE POLICY "deny_client_select_files"
  ON public.files FOR SELECT
  USING (false);

CREATE POLICY "deny_client_insert_files"
  ON public.files FOR INSERT
  WITH CHECK (false);

CREATE POLICY "deny_client_update_files"
  ON public.files FOR UPDATE
  USING (false);

CREATE POLICY "deny_client_delete_files"
  ON public.files FOR DELETE
  USING (false);

-- audit_logs
CREATE POLICY "deny_client_select_audit_logs"
  ON public.audit_logs FOR SELECT
  USING (false);

CREATE POLICY "deny_client_insert_audit_logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (false);

CREATE POLICY "deny_client_update_audit_logs"
  ON public.audit_logs FOR UPDATE
  USING (false);

CREATE POLICY "deny_client_delete_audit_logs"
  ON public.audit_logs FOR DELETE
  USING (false);

-- devices
CREATE POLICY "deny_client_select_devices"
  ON public.devices FOR SELECT
  USING (false);

CREATE POLICY "deny_client_insert_devices"
  ON public.devices FOR INSERT
  WITH CHECK (false);

CREATE POLICY "deny_client_update_devices"
  ON public.devices FOR UPDATE
  USING (false);

CREATE POLICY "deny_client_delete_devices"
  ON public.devices FOR DELETE
  USING (false);

-- ──────────────────────────────────────────────────────────
-- 4. Revoke anon + authenticated roles from all tables
--    (belt-and-suspenders on top of RLS)
-- ──────────────────────────────────────────────────────────
REVOKE ALL ON public.profiles   FROM anon, authenticated;
REVOKE ALL ON public.files      FROM anon, authenticated;
REVOKE ALL ON public.audit_logs FROM anon, authenticated;
REVOKE ALL ON public.devices    FROM anon, authenticated;

-- ──────────────────────────────────────────────────────────
-- 5. Grant to service_role only (the Express server uses this)
--    service_role bypasses RLS, so no policies needed for it.
-- ──────────────────────────────────────────────────────────
GRANT ALL ON public.profiles   TO service_role;
GRANT ALL ON public.files      TO service_role;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.devices    TO service_role;

-- ──────────────────────────────────────────────────────────
-- 6. Verify (optional — run separately to inspect result)
-- ──────────────────────────────────────────────────────────
-- SELECT tablename, policyname, cmd, qual
-- FROM   pg_policies
-- WHERE  schemaname = 'public'
-- ORDER  BY tablename, cmd;
