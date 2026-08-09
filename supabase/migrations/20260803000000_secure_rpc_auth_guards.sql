-- Migration: Fix RPC Authorization Guards
-- Date: 2026-08-03
-- Description:
--   Ensures RPC functions strictly verify that callers are authenticated (auth.uid() IS NOT NULL)
--   and authorized (auth.uid() = p_user_id OR public.is_admin()) to prevent unauthenticated/BOLA exploitation.

-- 1. Secure add_purchased_cards RPC
CREATE OR REPLACE FUNCTION public.add_purchased_cards(
  p_user_id uuid,
  p_count integer,
  p_sku text DEFAULT NULL,
  p_amount integer DEFAULT 0
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  -- Strict Auth & Ownership Check
  IF auth.uid() IS NULL OR (auth.uid() != p_user_id AND NOT public.is_admin()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validate count
  IF p_count <= 0 THEN
    RAISE EXCEPTION 'Card count must be greater than 0';
  END IF;

  UPDATE public.profiles
  SET
    card_count = card_count + p_count,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  IF p_sku IS NOT NULL THEN
    INSERT INTO public.purchases (user_id, sku, amount, cards_added)
    VALUES (p_user_id, p_sku, p_amount, p_count);
  END IF;

  RETURN v_profile;
END;
$$;

-- 2. Secure claim_weekly_cards RPC
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
  -- Strict Auth & Ownership Check
  IF auth.uid() IS NULL OR (auth.uid() != p_user_id AND NOT public.is_admin()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  IF v_profile.last_weekly_claim_at IS NOT NULL THEN
    v_days_since_claim := extract(epoch FROM (now() - v_profile.last_weekly_claim_at)) / 86400;
    
    IF v_days_since_claim < 7 THEN
      RETURN json_build_object(
        'success', false, 
        'message', 'Cannot claim yet. You must wait 7 days between claims.'
      );
    END IF;
  END IF;

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
