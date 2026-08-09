# AUTH_MIDDLEWARE Fix Plan

## Changes

- None required. All backend routes and tables are protected by Supabase Auth and RLS policies.

## Verification goals

- [x] Unauthenticated calls to private user endpoints are blocked at the database level.
- [x] JWT sessions are validated by Supabase for every database request.
- [x] Admin endpoints verify user role via `public.is_admin()`.

## Manual verification (for the human)

- Verify that trying to access user tables without an active session fails with 401 Unauthorized in Supabase REST API.
