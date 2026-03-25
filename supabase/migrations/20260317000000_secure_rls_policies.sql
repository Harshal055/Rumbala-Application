-- ==============================================================================
-- Migration: Secure RLS Policies and App Economy
-- Date: 2026-03-17
-- Description: Locks down the purchases, game history, profiles, and rooms
-- tables to prevent malicious client-side data manipulation.
-- ==============================================================================

-- 1. Purchases Table
-- Only the backend (Service Role) should insert purchases.
DROP POLICY IF EXISTS "purchases_insert_own" ON public.purchases;

-- 2. Game History Table
-- Users should never be able to delete their game history to hide failures.
DROP POLICY IF EXISTS "history_delete_own" ON public.game_history;

-- 3. Profiles Table (Trigger)
-- Users can't maliciously update their card_count, last_weekly_claim_at, or last_card_update directly.
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
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_sensitive_profile_updates ON public.profiles;
CREATE TRIGGER trg_restrict_sensitive_profile_updates
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.restrict_sensitive_profile_updates();


-- 4. Rooms Table (Trigger)
-- Prevent spoofing/hijacking the host role in a game room.
CREATE OR REPLACE FUNCTION public.restrict_room_member_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If the user is authenticated (client side)
  IF NULLIF(current_setting('request.jwt.claim.role', true), '') = 'authenticated' THEN
    -- Nobody is allowed to spoof the host after creation
    IF NEW.host_user_id <> OLD.host_user_id THEN
      RAISE EXCEPTION 'Not allowed to modify the host_user_id';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_room_member_updates ON public.rooms;
CREATE TRIGGER trg_restrict_room_member_updates
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.restrict_room_member_updates();
