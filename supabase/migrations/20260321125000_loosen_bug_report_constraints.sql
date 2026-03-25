-- Loosen bug_reports user_id constraint to allow easier guest submissions
-- Migration Date: 2026-03-21

ALTER TABLE public.bug_reports 
DROP CONSTRAINT IF EXISTS bug_reports_user_id_fkey;

-- Ensure RLS allows insert for everyone
DROP POLICY IF EXISTS "bug_reports_insert_own" ON public.bug_reports;
CREATE POLICY "bug_reports_insert_all" ON public.bug_reports
    FOR INSERT WITH CHECK (true);
