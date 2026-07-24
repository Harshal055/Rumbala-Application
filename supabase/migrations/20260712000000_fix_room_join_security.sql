-- Migration: Fix Room Join Security Hole
-- Date: 2026-07-12
-- Description:
--   fix_room_join_rls (2026-03-29) opened SELECT and UPDATE on `rooms` to
--   ANY authenticated user for rows where guest_user_id IS NULL AND is_active,
--   with no requirement that the caller actually supply the room's code. In
--   practice this means:
--     1. Any signed-in user can list every open room in the app (SELECT),
--        leaking who's hosting and their host_name.
--     2. Any signed-in user can UPDATE (join) a random open room without ever
--        knowing its code — a straight room-hijack, since the policy
--        predicate never references the `code` column.
--   This migration removes that broad access and replaces "find/join by
--   code" with two SECURITY DEFINER RPCs that do the code check server-side,
--   so RLS on the base table can go back to strict host/guest-only access.

-- 1. Revert rooms SELECT policy to participants only.
DROP POLICY IF EXISTS "rooms_select_participants_and_search" ON public.rooms;
DROP POLICY IF EXISTS "rooms_select_participants" ON public.rooms;
CREATE POLICY "rooms_select_participants"
ON public.rooms
FOR SELECT
TO authenticated
USING (auth.uid() = host_user_id OR auth.uid() = guest_user_id);

-- 2. Revert rooms UPDATE policy to participants only. Joining a room is now
--    handled exclusively by join_room_by_code() below, not by a direct
--    client-side UPDATE, so the "guest_user_id IS NULL" carve-out is removed.
DROP POLICY IF EXISTS "rooms_update_participants_v2" ON public.rooms;
DROP POLICY IF EXISTS "rooms_update_participants" ON public.rooms;
CREATE POLICY "rooms_update_participants"
ON public.rooms
FOR UPDATE
TO authenticated
USING (auth.uid() = host_user_id OR auth.uid() = guest_user_id)
WITH CHECK (auth.uid() = host_user_id OR auth.uid() = guest_user_id);

-- 3. RPC: look up a room by code. Runs as definer so it can see rows the
--    caller isn't a participant of yet, but only returns non-sensitive
--    existence/status info — not the full row (no current_card, scores,
--    chat, etc. before you've actually joined).
CREATE OR REPLACE FUNCTION public.find_room_by_code(p_code text)
RETURNS TABLE (
  code text,
  host_name text,
  room_type text,
  is_active boolean,
  is_full boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT r.code, r.host_name, r.room_type, r.is_active,
         (r.guest_user_id IS NOT NULL) AS is_full
  FROM public.rooms r
  WHERE r.code = upper(p_code);
END;
$$;

REVOKE ALL ON FUNCTION public.find_room_by_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.find_room_by_code(text) TO authenticated;

-- 4. RPC: atomically join a room by code. Requires the caller to actually
--    supply the correct code (it's the lookup key), enforces active/slot
--    checks server-side, and returns the full row on success so the app can
--    hydrate its RoomData immediately.
CREATE OR REPLACE FUNCTION public.join_room_by_code(
  p_code text,
  p_guest_user_id uuid,
  p_guest_name text
)
RETURNS public.rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.rooms;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_guest_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_room
  FROM public.rooms
  WHERE code = upper(p_code)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room "%" not found.', upper(p_code);
  END IF;

  IF NOT v_room.is_active THEN
    RAISE EXCEPTION 'Meeting has ended.';
  END IF;

  IF v_room.guest_user_id IS NOT NULL AND v_room.guest_user_id <> p_guest_user_id THEN
    RAISE EXCEPTION 'Room is full.';
  END IF;

  UPDATE public.rooms
  SET guest_user_id = p_guest_user_id,
      guest_name = p_guest_name
  WHERE code = v_room.code
  RETURNING * INTO v_room;

  RETURN v_room;
END;
$$;

REVOKE ALL ON FUNCTION public.join_room_by_code(text, uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.join_room_by_code(text, uuid, text) TO authenticated;

COMMENT ON FUNCTION public.find_room_by_code IS 'Safe pre-join lookup: returns only non-sensitive status for a room code, callable by any authenticated user.';
COMMENT ON FUNCTION public.join_room_by_code IS 'Atomic, code-gated room join. Replaces the broad rooms_select_participants_and_search / rooms_update_participants_v2 policies from 2026-03-29 that allowed joining any open room without knowing its code.';
