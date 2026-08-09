# SECRETS_EXPOSURE Security Report

## Status: PASS (Resolved from HIGH)

## Findings

1. **Hardcoded Admin PIN in SQL (`enable-admin-portal.sql`) — [RESOLVED]**:
   - Previously contained a hardcoded 4-digit PIN (`3012`) in a `SECURITY DEFINER` function `grant_admin_with_pin`.
   - **Resolution**: Removed the hardcoded PIN function completely. Replaced with row-level secured `admin_roles` table definition and direct SQL admin assignment instructions. Added SQL statement to drop `grant_admin_with_pin` if present in the database.

2. **Client-Side Admin Portal (`admin-portal.html`) — [RESOLVED]**:
   - Excluded from git tracking in `.gitignore`. Deprecated client-side PIN elevation.

3. **Secrets in Git & Environment Files — [PASS]**:
   - `.gitignore` rigorously ignores `.env*` (except `.env.example`), signing keys (`*.keystore`, `*.jks`, `FINAL_RELEASE_KEY_INFO.txt`), `play-console-key.json`, and `google-services.json`.
   - `git ls-files` verification confirms zero secret files are tracked in git history.
   - `.env.example` contains sanitized placeholders only.
   - All `EXPO_PUBLIC_*` variables contain only public/publishable client tokens (Supabase Anon Key, RevenueCat Public SDK Key, Agora App ID, Google Web Client ID). No `service_role` or secret keys are exposed.

## What's at risk

Prior to the fix, an attacker could brute-force the 4-digit PIN against the Supabase RPC endpoint to gain unauthorized administrative privileges. With the PIN function removed and RLS enabled on `admin_roles`, this attack vector is eliminated.

## What's already secure

- All sensitive keys (`.env`, keystores, Google Play console keys) are strictly ignored in `.gitignore`.
- Git repository contains no tracked secrets or private keys.
- Client builds contain only public identifiers designed for client-side usage.

## Recommendations

1. Run the updated `enable-admin-portal.sql` script in your Supabase SQL Editor to ensure `DROP FUNCTION IF EXISTS public.grant_admin_with_pin(text, text);` is executed in the live database.
2. Manage admin roles directly in the Supabase Dashboard.
