# ACCESS_CONTROL Security Report

## Status: PASS (Resolved from HIGH)

## Findings

1. **BOLA in RPC Functions (`add_purchased_cards` & `claim_weekly_cards`) — [RESOLVED]**:
   - Previously checked `IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id AND NOT public.is_admin() THEN`, which failed to reject callers where `auth.uid() IS NULL` (unauthenticated anonymous callers).
   - **Resolution**: Updated the RPC check to strictly enforce:
   ```sql
   IF auth.uid() IS NULL OR (auth.uid() != p_user_id AND NOT public.is_admin()) THEN
     RAISE EXCEPTION 'Unauthorized';
   END IF;
   ```
   - Created `supabase/migrations/20260803000000_secure_rpc_auth_guards.sql` and updated existing migration definitions.

2. **Room Access Control — [PASS]**:
   - Protected by `join_room_by_code` RPC which strictly verifies `IF auth.uid() IS NULL OR auth.uid() <> p_guest_user_id THEN RAISE EXCEPTION 'Unauthorized'; END IF;` and requires knowing the valid uppercase room code.
   - RLS on `rooms` and `room_messages` strictly enforces participant isolation (`auth.uid() = host_user_id OR auth.uid() = guest_user_id`).

3. **User Profile & History Access Control — [PASS]**:
   - Profiles, game history, and scores strictly enforce ownership through RLS (`auth.uid() = id` / `auth.uid() = user_id`). Users cannot read or modify another user's game history or scores.

## What's at risk

Prior to the fix, unauthenticated callers could call RPC functions without an authenticated JWT. With the updated guard, only authenticated and authorized users (or admins) can execute card balance modifications and claims.

## What's already secure

- Base tables have robust RLS policies scoped to `auth.uid()`.
- Room join and chat messaging strictly enforce participant boundaries.
- Admin routes require database verified `admin_roles` via `public.is_admin()`.

## Recommendations

1. Execute `supabase/migrations/20260803000000_secure_rpc_auth_guards.sql` in the Supabase SQL Editor.
