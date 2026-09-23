-- Migration: Create crash_reports table for automated app telemetry and admin crash triaging
-- Date: 2026-09-23
-- Description:
--   Supports automated error reporting from React Native ErrorBoundary and global handlers,
--   with triaging status updates from the web admin panel.

CREATE TABLE IF NOT EXISTS public.crash_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message text NOT NULL,
  stack_trace text,
  component_stack text,
  is_fatal boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'unknown',
  screen text,
  platform text NOT NULL DEFAULT 'unknown',
  app_version text,
  device_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'wont_fix')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crash_reports_created_at ON public.crash_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crash_reports_status ON public.crash_reports(status);
CREATE INDEX IF NOT EXISTS idx_crash_reports_is_fatal ON public.crash_reports(is_fatal);
CREATE INDEX IF NOT EXISTS idx_crash_reports_user_id ON public.crash_reports(user_id);

-- Enable RLS
ALTER TABLE public.crash_reports ENABLE ROW LEVEL SECURITY;

-- 1. Insert: Anyone (guest or authenticated) can submit crash telemetry
DROP POLICY IF EXISTS "crash_reports_insert_all" ON public.crash_reports;
CREATE POLICY "crash_reports_insert_all"
ON public.crash_reports
FOR INSERT
WITH CHECK (true);

-- 2. Select: Admins can view all crash reports
DROP POLICY IF EXISTS "crash_reports_select_admin" ON public.crash_reports;
CREATE POLICY "crash_reports_select_admin"
ON public.crash_reports
FOR SELECT
USING (public.is_admin());

-- 3. Update: Admins can update status ('investigating', 'resolved', etc.)
DROP POLICY IF EXISTS "crash_reports_update_admin" ON public.crash_reports;
CREATE POLICY "crash_reports_update_admin"
ON public.crash_reports
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Delete: Admins can clean up old logs
DROP POLICY IF EXISTS "crash_reports_delete_admin" ON public.crash_reports;
CREATE POLICY "crash_reports_delete_admin"
ON public.crash_reports
FOR DELETE
USING (public.is_admin());

-- Realtime publication for live monitoring
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crash_reports;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
