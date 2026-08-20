-- ==========================================
-- DEPRECATED — DO NOT RUN THE OLD VERSION
-- ==========================================
--
-- The previous contents of this file were an UNSAFE, superseded version of the
-- room-join logic. Running it re-opened a room-hijack hole because it:
--   1. Defined join_room_by_code() WITHOUT the auth.uid() = p_guest_user_id
--      ownership check.
--   2. Granted EXECUTE to `anon`.
--   3. Created policy rooms_update_guest_join ON public.rooms
--        FOR UPDATE USING (true) WITH CHECK (true)
--      i.e. any user (even anonymous) could UPDATE any room row.
--
-- The correct, secure implementation lives in the tracked migration:
--   supabase/migrations/20260712000000_fix_room_join_security.sql
-- Use that. Do not reintroduce the wide-open policy or the anon grant.
--
-- This script is now a SAFE REPAIR: running it only removes the dangerous
-- policy if it is still present. It does not grant anything.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rooms' AND policyname = 'rooms_update_guest_join'
  ) THEN
    DROP POLICY "rooms_update_guest_join" ON public.rooms;
    RAISE NOTICE 'Removed unsafe policy rooms_update_guest_join from public.rooms.';
  END IF;
END $$;

-- Revoke the over-broad anon grant if it was previously applied.
REVOKE EXECUTE ON FUNCTION public.join_room_by_code(text, uuid, text) FROM anon;
