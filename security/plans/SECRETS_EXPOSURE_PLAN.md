# SECRETS_EXPOSURE Fix Plan

## Changes

- `enable-admin-portal.sql` — Remove the insecure hardcoded PIN RPC function; provide secure, authenticated role management instructions.
- `admin-portal.html` — Update or deprecate the client-side PIN promotion file to prevent automated brute-force attempts.
- `.gitignore` — Ensure `admin-portal.html` and any local SQL scripts with sensitive admin provisioning are ignored or properly safeguarded.

## New files

- None.

## Verification goals

After implementation, ALL of these must be true:

- [ ] `git ls-files .env` returns nothing
- [ ] `git ls-files FINAL_RELEASE_KEY_INFO.txt google-services.json play-console-key.json` returns nothing
- [ ] No hardcoded PIN or secret bypass exists in `enable-admin-portal.sql`
- [ ] `grep -rn` across source files for dangerous secret patterns returns no leaked private keys
- [ ] No `EXPO_PUBLIC_*` variable contains a secret/private key

## Manual verification (for the human)

- If you previously ran `enable-admin-portal.sql` in your Supabase project, execute `DROP FUNCTION IF EXISTS public.grant_admin_with_pin(text, text);` in the Supabase SQL Editor.
- Assign admin privileges directly via the Supabase Dashboard (`INSERT INTO public.admin_roles (user_id) VALUES ('<USER_UUID>');`).
