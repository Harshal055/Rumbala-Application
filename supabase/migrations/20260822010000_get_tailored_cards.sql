-- Migration: Server-side deck tailoring based on onboarding answers
-- Date: 2026-08-22
-- Depends on: 20260822000000_add_onboarding_columns.sql (profiles.app_purpose / relationship_status)
--
-- Returns an active card deck personalized to the caller's onboarding answers,
-- read server-side from public.profiles (auth.uid()). The preferred vibe and an
-- intensity ceiling mirror the client recommendation logic in
-- app/(tabs)/index.tsx (getRecommendation):
--   app_purpose = 'spice'      -> spicy,   intensity <= 2
--   app_purpose = 'fantasies'  -> spicy,   intensity <= 3
--   app_purpose = 'deep'       -> romantic,intensity <= 1
--   app_purpose = 'ldr' OR relationship_status = 'ldr' -> ldr, intensity <= 1
--   else (fun / unset)         -> fun,     intensity <= 1
-- Preferred-vibe cards are returned first, then the rest, shuffled within.
-- Callers may override the vibe and/or the intensity ceiling (e.g. pass
-- p_max_intensity = 3 to disable capping when the user explicitly picks a vibe).

CREATE OR REPLACE FUNCTION public.get_tailored_cards(
  p_limit integer DEFAULT 200,
  p_vibe_override text DEFAULT NULL,
  p_max_intensity integer DEFAULT NULL
)
RETURNS SETOF public.cards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_purpose text;
  v_rel text;
  v_pref_type text;
  v_max_intensity integer;
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT app_purpose, relationship_status
    INTO v_purpose, v_rel
  FROM public.profiles
  WHERE id = v_uid;

  -- Preferred vibe
  IF p_vibe_override IS NOT NULL AND p_vibe_override <> 'all' THEN
    v_pref_type := p_vibe_override;
  ELSIF v_purpose IN ('spice', 'fantasies') THEN
    v_pref_type := 'spicy';
  ELSIF v_purpose = 'deep' THEN
    v_pref_type := 'romantic';
  ELSIF v_purpose = 'ldr' OR v_rel = 'ldr' THEN
    v_pref_type := 'ldr';
  ELSE
    v_pref_type := 'fun';
  END IF;

  -- Intensity ceiling (override wins; otherwise derived from purpose)
  v_max_intensity := COALESCE(
    p_max_intensity,
    CASE
      WHEN v_purpose = 'fantasies' THEN 3
      WHEN v_purpose = 'spice' THEN 2
      ELSE 1
    END
  );
  v_max_intensity := LEAST(GREATEST(v_max_intensity, 1), 3);

  RETURN QUERY
  SELECT c.*
  FROM public.cards c
  WHERE c.is_active = true
    AND COALESCE(c.intensity, 1) <= v_max_intensity
  ORDER BY (c.type = v_pref_type) DESC, random()
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_tailored_cards(integer, text, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_tailored_cards(integer, text, integer) TO authenticated;

COMMENT ON FUNCTION public.get_tailored_cards IS
  'Returns an active, personalized card deck based on the caller''s onboarding answers (profiles.app_purpose / relationship_status). Preferred vibe first, intensity-capped. Override with p_vibe_override / p_max_intensity.';
