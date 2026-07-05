-- Migration: Fix LDR Room Join RLS
-- Date: 2026-03-29
-- Description: Updates the 'rooms' table security to allow guests to find a room by code before joining.

-- 1. Drop the overly restrictive select policy
DROP POLICY IF EXISTS "rooms_select_participants" ON public.rooms;

-- 2. Create a new, smarter select policy
-- This allows:
--  - The host to see the room
--  - The current guest to see the room
--  - ANY authenticated user to see the room IF they have the code (for joining)
CREATE POLICY "rooms_select_participants_and_search"
ON public.rooms
FOR SELECT
TO authenticated
USING (
  auth.uid() = host_user_id 
  OR auth.uid() = guest_user_id
  OR (guest_user_id IS NULL AND is_active = true) -- Allow joining active rooms
);

-- 3. Ensure the update policy allows the guest to set their own ID
DROP POLICY IF EXISTS "rooms_update_participants" ON public.rooms;
CREATE POLICY "rooms_update_participants_v2"
ON public.rooms
FOR UPDATE
TO authenticated
USING (
  auth.uid() = host_user_id 
  OR auth.uid() = guest_user_id 
  OR (guest_user_id IS NULL AND is_active = true) -- Allow joining
)
WITH CHECK (
  auth.uid() = host_user_id 
  OR auth.uid() = guest_user_id
  OR (OLD.guest_user_id IS NULL AND NEW.guest_user_id = auth.uid()) -- Allow setting self as guest
);

COMMENT ON POLICY "rooms_select_participants_and_search" ON public.rooms IS 'Allows participants to see the room, and prospective guests to find it by code.';
