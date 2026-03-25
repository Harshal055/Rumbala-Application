-- ==============================================================================
-- Migration: Audit Security Fixes and Indexing Optimizations
-- Date: 2026-03-20
-- Description: Secures new profile columns and adds performance indexes.
-- ==============================================================================

-- 1. Update Profile Protection Trigger
-- Prevent users from manually altering their streak_count or milestones.
CREATE OR REPLACE FUNCTION public.restrict_sensitive_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If the user is authenticated (client side)
  IF NULLIF(current_setting('request.jwt.claim.role', true), '') = 'authenticated' THEN
    -- Prevent altering card counts
    IF NEW.card_count <> OLD.card_count THEN
      RAISE EXCEPTION 'Not allowed to modify card_count directly';
    END IF;
    -- Prevent altering cheat timers
    IF NEW.last_card_update <> OLD.last_card_update THEN
      RAISE EXCEPTION 'Not allowed to modify last_card_update directly';
    END IF;
    IF NEW.last_weekly_claim_at IS DISTINCT FROM OLD.last_weekly_claim_at THEN
      RAISE EXCEPTION 'Not allowed to modify last_weekly_claim_at directly';
    END IF;
    
    -- NEW: Prevent altering streak_count directly
    IF NEW.streak_count <> OLD.streak_count THEN
      RAISE EXCEPTION 'Not allowed to modify streak_count directly. Use the app logic.';
    END IF;
    
    -- NEW: Prevent altering milestones directly
    IF NEW.milestones IS DISTINCT FROM OLD.milestones THEN
      RAISE EXCEPTION 'Not allowed to modify milestones directly. Earn them through play!';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Performance Indexes
-- Index rooms by host and guest for faster "my rooms" queries.
CREATE INDEX IF NOT EXISTS idx_rooms_host_user_id ON public.rooms(host_user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_guest_user_id ON public.rooms(guest_user_id);

-- Index daily_responses by date for faster retrieval of today's answers.
CREATE INDEX IF NOT EXISTS idx_daily_responses_created_at ON public.daily_responses(created_at DESC);

-- 3. Daily Responses Security Constraint
-- Ensure users don't try to insert multiple responses for the same day (handled by UNIQUE constraint already).
-- But let's add a check to make sure they aren't inserting future dates.
ALTER TABLE public.daily_responses DROP CONSTRAINT IF EXISTS check_daily_responses_date;
ALTER TABLE public.daily_responses ADD CONSTRAINT check_daily_responses_date CHECK (created_at <= CURRENT_DATE);
