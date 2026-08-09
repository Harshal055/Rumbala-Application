# DATABASE_ACCESS Fix Plan

## Changes

- `supabase/crash_reports_migration.sql` — Standardize admin RLS policy on crash reports to use `public.is_admin()`.

## New files

- None.

## Verification goals

After implementation, ALL of these must be true:

- [ ] Every table has RLS enabled
- [ ] User tables have explicit policies scoped to `auth.uid()`
- [ ] Admin policies across all tables use `public.is_admin()`
- [ ] Direct anon query cannot access other users' private records

## Manual verification (for the human)

- Execute `supabase/crash_reports_migration.sql` in Supabase SQL Editor if creating the crash_reports table.
