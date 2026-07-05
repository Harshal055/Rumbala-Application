-- Migration: Security Audit Fixes
-- Date: 2026-03-22

-- 1. Create admin_roles table and update is_admin() function
CREATE TABLE IF NOT EXISTS public.admin_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_roles_select_own" ON public.admin_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Fix BOLA in add_purchased_cards and claim_weekly_cards RPCs
CREATE OR REPLACE FUNCTION public.add_purchased_cards(p_user_id uuid, p_count integer)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  -- BOLA Fix: Ensure user can only add cards to themselves (or rely on admin/service_role)
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id AND NOT public.is_admin() THEN
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

  RETURN v_profile;
END;
$$;

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
  -- BOLA Fix: Ensure user can only claim for themselves
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id AND NOT public.is_admin() THEN
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


-- 3. Drop insecure public insert policy on purchases
DROP POLICY IF EXISTS "purchases_insert_own" ON public.purchases;


-- 4. Secure bug_reports and feedback insert policies
DROP POLICY IF EXISTS "bug_reports_insert_all" ON public.bug_reports;
CREATE POLICY "bug_reports_insert_own" ON public.bug_reports 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
CREATE POLICY "feedback_insert_own" ON public.feedback 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
