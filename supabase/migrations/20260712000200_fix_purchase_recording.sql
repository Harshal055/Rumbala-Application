-- Migration: Fix broken purchase audit trail
-- Date: 2026-07-12
-- Description:
--   src/services/api.ts's recordPurchase() has been silently failing on
--   every single purchase, two different ways:
--     1. secure_rls_policies.sql (2026-03-17) intentionally dropped
--        "purchases_insert_own" so only the backend can write to
--        `purchases` — but recordPurchase() still does a plain client-side
--        INSERT, which RLS has been rejecting ever since.
--     2. Even if RLS allowed it, the INSERT writes columns that don't
--        exist on the table (`card_count`, `amount_paise` instead of the
--        real `cards_added`, `amount`), and omits `amount`/`cards_added`
--        which are NOT NULL with no default — so it would fail regardless.
--   Both failures are swallowed (console.error, not throw), so this has
--   been invisible: adminGetRevenueStats has been reading an empty table.
--   Fix: fold the purchase record into add_purchased_cards(), which
--   already runs SECURITY DEFINER for the card-count increment — one
--   atomic, authorized write instead of a second insecure client insert.

-- Postgres treats a different parameter list as a distinct overload, not a
-- replacement — without this DROP, calls with just (p_user_id, p_count)
-- would become ambiguous between the old 2-arg and new 4-arg versions.
DROP FUNCTION IF EXISTS public.add_purchased_cards(uuid, integer);

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
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

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

COMMENT ON FUNCTION public.add_purchased_cards IS 'Grants purchased cards and records the purchase atomically. p_sku/p_amount are optional so this still works for the plain card-grant path with no purchase record.';
