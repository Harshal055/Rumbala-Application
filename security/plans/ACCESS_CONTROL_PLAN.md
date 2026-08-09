# ACCESS_CONTROL Fix Plan

## Changes

- `supabase/migrations/20260712000200_fix_purchase_recording.sql` — Fix auth guard in `add_purchased_cards` to reject anonymous/null `auth.uid()`.
- `supabase/migrations/20260322000000_security_audit_fixes.sql` — Fix auth guard in `claim_weekly_cards` and `add_purchased_cards` to reject anonymous/null `auth.uid()`.
- Create `supabase/migrations/20260803000000_secure_rpc_auth_guards.sql` — Consolidated migration applying the strict authentication check to all RPC functions.

## New files

- `supabase/migrations/20260803000000_secure_rpc_auth_guards.sql`

## Verification goals

After implementation, ALL of these must be true:

- [ ] `add_purchased_cards` rejects unauthenticated callers where `auth.uid() IS NULL`
- [ ] `add_purchased_cards` rejects authenticated callers where `auth.uid() != p_user_id` and not admin
- [ ] `claim_weekly_cards` rejects unauthenticated callers where `auth.uid() IS NULL`
- [ ] `claim_weekly_cards` rejects authenticated callers where `auth.uid() != p_user_id` and not admin
- [ ] `join_room_by_code` rejects unauthenticated callers and non-matching user IDs

## Manual verification (for the human)

- Run `supabase/migrations/20260803000000_secure_rpc_auth_guards.sql` in the Supabase SQL Editor.
