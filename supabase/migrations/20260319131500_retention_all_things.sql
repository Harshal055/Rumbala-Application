-- Migration: Retention and LDR All Things
-- Date: 2026-03-19
-- Description: Adds new columns for streaks, milestones, partner linking, and room types. Adds daily responses table.

-- 1. Update Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS streak_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_at date,
ADD COLUMN IF NOT EXISTS milestones text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS partner_user_id uuid REFERENCES public.profiles(id);

-- 2. Update Rooms
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS room_type text DEFAULT 'video' CHECK (room_type IN ('video', 'normal'));

-- 3. Create Daily Responses Table
CREATE TABLE IF NOT EXISTS public.daily_responses (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id integer NOT NULL,
  response text NOT NULL,
  created_at date DEFAULT CURRENT_DATE,
  UNIQUE(user_id, created_at)
);

-- 4. Enable RLS and Policies for Daily Responses
ALTER TABLE public.daily_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_responses_select_own" ON public.daily_responses;
CREATE POLICY "daily_responses_select_own" ON public.daily_responses
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_responses_insert_own" ON public.daily_responses;
CREATE POLICY "daily_responses_insert_own" ON public.daily_responses
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_responses_select_partner" ON public.daily_responses;
CREATE POLICY "daily_responses_select_partner" ON public.daily_responses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND partner_user_id = daily_responses.user_id
  )
);

-- 5. Add Vibe to Profile if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vibe text DEFAULT 'fun';
