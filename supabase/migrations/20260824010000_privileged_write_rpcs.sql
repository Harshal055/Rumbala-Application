-- Migration: Deterministic privileged-write path for cards & Pro
-- Date: 2026-08-24
-- Fixes security/LOGIC_FLOW_REVIEW_2026-08-24.md (CRITICAL).
--
-- Problem: the anti-cheat trigger keyed off current_setting('request.jwt.claim.role'),
-- which is unreliable on current Supabase. If unset, the trigger was a no-op and a
-- user could UPDATE their own profile to is_pro=true / card_count=99999. If set, it
-- also blocked the legitimate client writes (card spend, promo, admin), which then
-- silently failed.
--
-- Fix:
--   1. Rewrite the trigger to key off `current_user` — a reliable Postgres value.
--      PostgREST runs client requests as role 'authenticated'; SECURITY DEFINER
--      functions run as the function owner (not 'authenticated'); the webhook runs
--      as 'service_role'. So: direct client writes to guarded columns are always
--      blocked, while vetted RPCs and the webhook are always allowed. (Transaction-
--      local guard GUCs remain as an explicit override for defense in depth.)
--   2. Add SECURITY DEFINER RPCs for every legitimate write: spend_card,
--      redeem_promo_code (with per-user idempotency), admin_set_cards, admin_set_pro.
--   3. Lock promo_codes so only admins can read them.

-- ── 1. Hardened trigger ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.restrict_sensitive_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_allow_cards boolean := coalesce(nullif(current_setting('app.allow_card_mutation', true), ''), 'off') = 'on';
  v_allow_pro   boolean := coalesce(nullif(current_setting('app.allow_pro_mutation', true), ''), 'off') = 'on';
BEGIN
  -- Only restrict DIRECT client writes (role 'authenticated'). SECURITY DEFINER
  -- RPCs run as the owner and the webhook runs as service_role, so both bypass.
  IF current_user = 'authenticated' THEN
    IF NEW.card_count IS DISTINCT FROM OLD.card_count AND NOT v_allow_cards THEN
      RAISE EXCEPTION 'Not allowed to modify card_count directly';
    END IF;
    IF NEW.last_card_update IS DISTINCT FROM OLD.last_card_update AND NOT v_allow_cards THEN
      RAISE EXCEPTION 'Not allowed to modify last_card_update directly';
    END IF;
    IF NEW.last_weekly_claim_at IS DISTINCT FROM OLD.last_weekly_claim_at AND NOT v_allow_cards THEN
      RAISE EXCEPTION 'Not allowed to modify last_weekly_claim_at directly';
    END IF;
    IF NEW.is_pro IS DISTINCT FROM OLD.is_pro AND NOT v_allow_pro THEN
      RAISE EXCEPTION 'Not allowed to modify is_pro directly. Use the official payment flow.';
    END IF;
    IF NEW.pro_expires_at IS DISTINCT FROM OLD.pro_expires_at AND NOT v_allow_pro THEN
      RAISE EXCEPTION 'Not allowed to modify pro_expires_at directly. Use the official payment flow.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 2a. spend_card: decrement a caller's own balance ─────────────────────────
CREATE OR REPLACE FUNCTION public.spend_card(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles
     SET card_count = GREATEST(coalesce(card_count, 0) - 1, 0),
         last_card_update = now(),
         updated_at = now()
   WHERE id = p_user_id
   RETURNING card_count INTO v_count;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found for user %', p_user_id; END IF;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.spend_card(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.spend_card(uuid) TO authenticated;

-- ── 2b. Per-user promo redemption ledger ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code        text NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_redemptions_select_own" ON public.promo_redemptions;
CREATE POLICY "promo_redemptions_select_own" ON public.promo_redemptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
-- No client INSERT policy: only the SECURITY DEFINER RPC writes here.

-- ── 2c. redeem_promo_code: server-side, atomic, idempotent per user ──────────
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_code      text := upper(trim(coalesce(p_code, '')));
  v_promo     public.promo_codes;
  v_profile   public.profiles;
  v_expiry    timestamptz;
  v_lifetime  boolean := false;
  v_new_cards integer;
  v_grant_pro integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF v_code = '' THEN RETURN json_build_object('success', false, 'message', 'Please enter a valid promo code.'); END IF;

  SELECT * INTO v_promo FROM public.promo_codes WHERE upper(code) = v_code FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'message', 'Invalid promo code. Please check and try again.'); END IF;
  IF NOT v_promo.is_active THEN RETURN json_build_object('success', false, 'message', 'This promo code is no longer active.'); END IF;
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RETURN json_build_object('success', false, 'message', 'This promo code has expired.');
  END IF;
  IF v_promo.max_uses IS NOT NULL AND coalesce(v_promo.used_count, 0) >= v_promo.max_uses THEN
    RETURN json_build_object('success', false, 'message', 'This promo code has reached its maximum redemptions limit.');
  END IF;

  -- One redemption per user (atomic).
  BEGIN
    INSERT INTO public.promo_redemptions (user_id, code) VALUES (v_uid, v_promo.code);
  EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'message', 'You have already redeemed this code.');
  END;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User profile not found.'; END IF;

  v_grant_pro := coalesce(v_promo.grant_pro_days, 0);
  v_expiry := v_profile.pro_expires_at;

  IF v_grant_pro > 0 THEN
    IF v_grant_pro >= 9999 OR (v_profile.is_pro AND v_profile.pro_expires_at IS NULL) THEN
      v_lifetime := true; v_expiry := NULL;
    ELSE
      v_expiry := GREATEST(coalesce(v_profile.pro_expires_at, now()), now()) + make_interval(days => v_grant_pro);
    END IF;
  END IF;

  v_new_cards := coalesce(v_profile.card_count, 0) + coalesce(v_promo.bonus_cards, 0);

  PERFORM set_config('app.allow_card_mutation', 'on', true);
  PERFORM set_config('app.allow_pro_mutation', 'on', true);

  UPDATE public.profiles SET
    is_pro         = CASE WHEN v_grant_pro > 0 THEN true ELSE is_pro END,
    pro_expires_at = CASE WHEN v_grant_pro > 0 THEN v_expiry ELSE pro_expires_at END,
    card_count     = v_new_cards,
    updated_at     = now()
  WHERE id = v_uid;

  UPDATE public.promo_codes SET used_count = coalesce(used_count, 0) + 1 WHERE code = v_promo.code;

  RETURN json_build_object(
    'success', true,
    'message', CASE
      WHEN v_lifetime THEN '👑 You received Lifetime Rumbala Pro!'
      WHEN v_grant_pro > 0 AND coalesce(v_promo.bonus_cards,0) > 0 THEN 'You unlocked Pro access + bonus cards!'
      WHEN v_grant_pro > 0 THEN 'You unlocked Rumbala Pro!'
      ELSE '🎁 Bonus cards added!'
    END,
    'grantProDays', v_grant_pro,
    'bonusCards', coalesce(v_promo.bonus_cards, 0),
    'isLifetime', v_lifetime,
    'expiresAt', v_expiry,
    'newCardCount', v_new_cards
  );
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_promo_code(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO authenticated;

-- ── 2d. Admin RPCs ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_set_cards(p_user_id uuid, p_count integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_count < 0 THEN RAISE EXCEPTION 'Card count cannot be negative'; END IF;
  UPDATE public.profiles
     SET card_count = p_count, last_card_update = now(), updated_at = now()
   WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found for user %', p_user_id; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_cards(uuid, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_cards(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_pro(p_user_id uuid, p_is_pro boolean, p_expires_at timestamptz DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE public.profiles
     SET is_pro = p_is_pro,
         pro_expires_at = CASE WHEN p_is_pro THEN p_expires_at ELSE NULL END,
         updated_at = now()
   WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found for user %', p_user_id; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_pro(uuid, boolean, timestamptz) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_pro(uuid, boolean, timestamptz) TO authenticated;

-- ── 3. Lock down promo_codes reads to admins only ────────────────────────────
DROP POLICY IF EXISTS "Promo codes readable by authenticated" ON public.promo_codes;
DROP POLICY IF EXISTS "Promo codes readable by admins only" ON public.promo_codes;
CREATE POLICY "Promo codes readable by admins only" ON public.promo_codes
  FOR SELECT TO authenticated
  USING (public.is_admin());
