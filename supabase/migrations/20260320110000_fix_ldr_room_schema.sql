-- Migration: Fix Missing LDR Room Columns
-- Date: 2026-03-20
-- Description: Adds missing columns required for LDR mode turns and room types.

-- 1. Add missing columns to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS current_turn_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS room_type text DEFAULT 'video' CHECK (room_type IN ('video', 'normal'));

-- 2. Initialize existing rooms (if any)
-- Set the turn to the host by default for any legacy rooms
UPDATE public.rooms 
SET current_turn_user_id = host_user_id 
WHERE current_turn_user_id IS NULL;

-- 3. Update Indexes (Optional but recommended)
CREATE INDEX IF NOT EXISTS idx_rooms_current_turn ON public.rooms(current_turn_user_id);
