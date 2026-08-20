-- Migration: Consolidate is_admin() to the admin_roles table
-- Date: 2026-08-12
-- Description:
--   is_admin() was defined twice in history:
--     * 20260321150000_consolidated_admin_schema.sql -> hardcoded JWT email
--       (auth.jwt() ->> 'email' = 'adminhr@andx.com')
--     * 20260322000000_security_audit_fixes.sql       -> admin_roles table lookup
--   Migration order means the admin_roles version currently wins, but the stale
--   hardcoded-email definition is a footgun if migrations are ever replayed out
--   of order or the old file is re-run by hand. This migration re-asserts the
--   admin_roles version as the final, authoritative definition.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()
  );
END;
$$;
