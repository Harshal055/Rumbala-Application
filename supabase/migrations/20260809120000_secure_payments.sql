-- Migration: Lock Down Purchases and Client RLS
-- Date: 2026-08-09
-- Description:
-- 1. Updates restrict_sensitive_profile_updates trigger to block client updates to is_pro and pro_expires_at.
-- 2. Creates a secure_increment_cards_service_role RPC intended ONLY for the Service Role (webhook).

-- 1. Update the Trigger to block is_pro and pro_expires_at
CREATE OR REPLACE FUNCTION public.restrict_sensitive_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If the user is authenticated (client side via anon key)
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
    -- NEW: Prevent altering Pro status
    IF NEW.is_pro IS DISTINCT FROM OLD.is_pro THEN
      RAISE EXCEPTION 'Not allowed to modify is_pro directly. Use the official payment flow.';
    END IF;
    IF NEW.pro_expires_at IS DISTINCT FROM OLD.pro_expires_at THEN
      RAISE EXCEPTION 'Not allowed to modify pro_expires_at directly. Use the official payment flow.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: We don't need to DROP/CREATE the trigger again, replacing the function is enough.

-- 2. Create the Service Role RPC for webhooks
CREATE OR REPLACE FUNCTION public.secure_increment_cards_service_role(
  p_user_id uuid,
  p_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Strict Check: Only allow Service Role to execute this function
  IF NULLIF(current_setting('request.jwt.claim.role', true), '') != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only Service Role can call this RPC.';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;

  UPDATE public.profiles
  SET 
    card_count = card_count + p_amount,
    updated_at = now()
  WHERE id = p_user_id;

END;
$$;
