# DATABASE_ACCESS Security Report

## Status: PASS

## Findings

1. **Row Level Security (RLS) Coverage**:
   - **`profiles`**: RLS enabled. SELECT, INSERT, UPDATE strictly scoped to `auth.uid() = id`.
   - **`purchases`**: RLS enabled. SELECT, INSERT scoped to `auth.uid() = user_id`.
   - **`game_scores`**: RLS enabled. SELECT, INSERT, UPDATE scoped to `auth.uid() = user_id`.
   - **`game_history`**: RLS enabled. SELECT, INSERT, DELETE scoped to `auth.uid() = user_id`.
   - **`rooms`**: RLS enabled. SELECT, UPDATE, DELETE scoped to `auth.uid() = host_user_id OR auth.uid() = guest_user_id`. Room joining is protected by the `join_room_by_code` atomic RPC with code and authorization verification (`auth.uid() = p_guest_user_id`).
   - **`room_messages`**: RLS enabled. SELECT scoped to room participants, INSERT scoped to `auth.uid() = sender_user_id`.
   - **`cards`**: RLS enabled. Public SELECT restricted to `is_active = true`. Modifications restricted to `public.is_admin()`.
   - **`admin_roles`**: RLS enabled. SELECT scoped to `auth.uid() = user_id`.
   - **`feedback` & `bug_reports`**: RLS enabled. INSERT scoped to `auth.uid() = user_id`, read access restricted to admins.
   - **`crash_reports`**: RLS enabled. INSERT allowed for diagnostic logging; read/update restricted to admin.

2. **Standardized Admin Checks**:
   - Database functions use `public.is_admin()` which checks against the secured `public.admin_roles` table.
   - `crash_reports_migration.sql` had a minor legacy email check which should be aligned with `public.is_admin()`.

3. **RPC Function Security**:
   - `add_purchased_cards` and `claim_weekly_cards` validate `auth.uid() = p_user_id` to prevent Broken Object Level Authorization (BOLA).
   - Functions set explicit `search_path = public` to prevent schema path injection.

## What's at risk

Without RLS and explicit user scoping, malicious users could query other couples' private game scores, chat messages, profiles, or manipulate card balances. Rumbala's strict RLS architecture prevents this.

## What's already secure

- Every database table has `ENABLE ROW LEVEL SECURITY`.
- User-specific tables are strictly bound to `auth.uid()`.
- Room join cannot be enumerated or hijacked without knowing the unique room code.
- No table uses `USING (true)` for open unrestricted read/write operations on user data.

## Recommendations

1. Standardize `crash_reports_migration.sql` to use `public.is_admin()` for consistency.
