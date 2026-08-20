-- Migration: Harden card grants and reconcile with the payment trigger
-- Date: 2026-08-12
-- Depends on: 20260809120000_secure_payments.sql (restrict_sensitive_profile_updates trigger)
--
-- Problem this fixes
-- ------------------
-- 1. add_purchased_cards trusted the client for the card count and amount, so a
--    signed-in user could call the RPC directly (no real purchase) with an
--    arbitrary p_count and self-grant unlimited cards, plus record fake
--    purchase rows with an arbitrary p_amount/p_sku.
-- 2. secure_payments added a trigger that blocks the `authenticated` role from
--    changing card_count / last_weekly_claim_at / is_pro / pro_expires_at. But
--    add_purchased_cards and claim_weekly_cards are SECURITY DEFINER functions
--    that still run under the caller's `request.jwt.claim.role = authenticated`,
--    so that trigger ALSO blocks the legitimate card RPCs — breaking purchases
--    and weekly claims.
--
-- Approach
-- --------
-- Keep the trigger's client lockdown, but let ONLY the vetted card RPCs mutate
-- card counts, via a transaction-local guard GUC (`app.allow_card_mutation`).
-- Clients cannot set this GUC: PostgREST exposes only table CRUD and RPCs, and
-- no RPC sets it except the trusted functions below, so it is unreachable from
-- the client. is_pro / pro_expires_at stay blocked for authenticated entirely —
-- those must only ever change via the service-role webhook
-- (secure_increment_cards_service_role and the Pro-grant path).

-- 0. Server-side source of truth for how many cards a SKU is worth.
--    Mirrors getCardsForProduct() / PRODUCT_CARD_MAP in
--    src/services/revenueCatService.ts.
CREATE OR REPLACE FUNCTION public.expected_cards_for_sku(p_sku text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  s text := lower(coalesce(p_sku, ''));
BEGIN
  IF s = '' THEN
    RETURN 0;
  END IF;
  IF s LIKE '%card_25%' OR s LIKE '%25_pack%' OR s LIKE '%25pack%' OR s LIKE '%25_cards%' THEN
    RETURN 25;
  ELSIF s LIKE '%card_10%' OR s LIKE '%10_pack%' OR s LIKE '%10pack%' OR s LIKE '%10_cards%' THEN
    RETURN 10;
  ELSIF s LIKE '%card_5%' OR s LIKE '%5_pack%' OR s LIKE '%5pack%' OR s LIKE '%5_cards%'
        OR s LIKE '%consumable%' OR s = 'custom' THEN
    RETURN 5;
  ELSIF s LIKE '%card_1%' OR s LIKE '%1_pack%' OR s LIKE '%1pack%' OR s LIKE '%single%' THEN
    RETURN 1;
  END IF;
  RETURN 0; -- unknown SKU
END;
$$;

-- 1. Re-define the client lockdown trigger to honour the guard GUC for the two
--    card-mutating columns, while still blocking everything the secure_payments
--    migration blocked. is_pro / pro_expires_at remain hard-blocked.
CREATE OR REPLACE FUNCTION public.restrict_sensitive_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_allow_cards boolean :=
    COALESCE(NULLIF(current_setting('app.allow_card_mutation', true), ''), 'off') = 'on';
BEGIN
  IF NULLIF(current_setting('request.jwt.claim.role', true), '') = 'authenticated' THEN
    -- Card economy columns: only mutable when a trusted RPC has set the guard.
    IF NEW.card_count <> OLD.card_count AND NOT v_allow_cards THEN
      RAISE EXCEPTION 'Not allowed to modify card_count directly';
    END IF;
    IF NEW.last_card_update IS DISTINCT FROM OLD.last_card_update AND NOT v_allow_cards THEN
      RAISE EXCEPTION 'Not allowed to modify last_card_update directly';
    END IF;
    IF NEW.last_weekly_claim_at IS DISTINCT FROM OLD.last_weekly_claim_at AND NOT v_allow_cards THEN
      RAISE EXCEPTION 'Not allowed to modify last_weekly_claim_at directly';
    END IF;
    -- Pro status: never mutable by the client, guard or not. Webhook only.
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

-- 2. add_purchased_cards: bounded, SKU-validated, and guard-wrapped.
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
  v_expected integer;
  v_amount integer := GREATEST(coalesce(p_amount, 0), 0);
BEGIN
  -- Strict Auth & Ownership Check
  IF auth.uid() IS NULL OR (auth.uid() != p_user_id AND NOT public.is_admin()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Bounds: positive and no larger than the biggest legitimate pack.
  IF p_count <= 0 THEN
    RAISE EXCEPTION 'Card count must be greater than 0';
  END IF;
  IF p_count > 25 AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Card count % exceeds the maximum pack size', p_count;
  END IF;

  -- When a SKU is supplied, the count must match what that SKU is worth.
  IF p_sku IS NOT NULL THEN
    v_expected := public.expected_cards_for_sku(p_sku);
    IF v_expected = 0 AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unknown SKU %', p_sku;
    END IF;
    IF v_expected > 0 AND p_count <> v_expected AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Card count % does not match SKU % (expected %)', p_count, p_sku, v_expected;
    END IF;
  END IF;

  -- Open the guard for the profile UPDATE below (transaction-local).
  PERFORM set_config('app.allow_card_mutation', 'on', true);

  UPDATE public.profiles
  SET card_count = card_count + p_count,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  PERFORM set_config('app.allow_card_mutation', 'off', true);

  IF p_sku IS NOT NULL THEN
    INSERT INTO public.purchases (user_id, sku, amount, cards_added)
    VALUES (p_user_id, p_sku, v_amount, p_count);
  END IF;

  RETURN v_profile;
END;
$$;

-- 3. claim_weekly_cards: same guard so the 7-day free claim keeps working under
--    the trigger. Cooldown logic unchanged.
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

  PERFORM set_config('app.allow_card_mutation', 'on', true);

  UPDATE public.profiles
  SET card_count = card_count + 5,
      last_weekly_claim_at = now(),
      updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  PERFORM set_config('app.allow_card_mutation', 'off', true);

  RETURN json_build_object(
    'success', true,
    'message', 'Successfully claimed 5 weekly free cards!',
    'card_count', v_profile.card_count,
    'last_weekly_claim_at', v_profile.last_weekly_claim_at
  );
END;
$$;
