-- Migration: Add Secure RPCs for Card Management
-- Date: 2026-03-18
-- Description: Adds SECURITY DEFINER functions to securely update card counts, bypassing the client-side profile trigger restrictions.

-- 1. Add Purchased Cards RPC
-- Safely increments the card_count for a given user.
CREATE OR REPLACE FUNCTION public.add_purchased_cards(p_user_id uuid, p_count integer)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as the definer (postgres), bypassing RLS and trigger restrictions that check auth.uid()
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  -- Validate count
  IF p_count <= 0 THEN
    RAISE EXCEPTION 'Card count must be greater than 0';
  END IF;

  -- Update and return the modified profile
  UPDATE public.profiles
  SET 
    card_count = card_count + p_count,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  RETURN v_profile;
END;
$$;

-- 2. Claim Weekly Cards RPC
-- Safely checks if 7 days have passed since the last claim, and if so, grants 5 free cards.
CREATE OR REPLACE FUNCTION public.claim_weekly_cards(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles;
  v_days_since_claim numeric;
BEGIN
  -- Get the current profile lock for update to prevent race conditions
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  -- If last_weekly_claim_at is set, check if 7 days have passed
  IF v_profile.last_weekly_claim_at IS NOT NULL THEN
    v_days_since_claim := extract(epoch FROM (now() - v_profile.last_weekly_claim_at)) / 86400;
    
    IF v_days_since_claim < 7 THEN
      RETURN json_build_object(
        'success', false, 
        'message', 'Cannot claim yet. You must wait 7 days between claims.'
      );
    END IF;
  END IF;

  -- Give 5 free cards and update the timestamp
  UPDATE public.profiles
  SET 
    card_count = card_count + 5,
    last_weekly_claim_at = now(),
    updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  RETURN json_build_object(
    'success', true, 
    'message', 'Successfully claimed 5 weekly free cards!',
    'card_count', v_profile.card_count,
    'last_weekly_claim_at', v_profile.last_weekly_claim_at
  );
END;
$$;
