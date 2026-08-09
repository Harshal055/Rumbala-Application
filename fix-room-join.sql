-- ==========================================
-- FIX ROOM JOIN RPC FUNCTION
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create or replace join_room_by_code function
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

-- 2. Grant permissions to both authenticated and anon users
GRANT EXECUTE ON FUNCTION public.join_room_by_code(text, uuid, text) TO authenticated, anon, service_role;

-- 3. Ensure rooms table allows joining via RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'rooms' AND policyname = 'rooms_update_guest_join'
  ) THEN
    CREATE POLICY rooms_update_guest_join ON public.rooms
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
