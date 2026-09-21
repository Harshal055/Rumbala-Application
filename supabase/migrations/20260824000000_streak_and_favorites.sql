-- Migration: Persist streaks + real favorites
-- Date: 2026-08-24
-- Description:
--   1. Streak was device-only (AsyncStorage). Add streak_count / last_active to
--      profiles so it survives reinstall and syncs across devices. These columns
--      are NOT guarded by restrict_sensitive_profile_updates, so the client may
--      write them under the own-row RLS policy.
--   2. "Save to Favorites" previously did nothing. Add a favorite_dares table so
--      any generated dare (AI or local template) can be saved per-user.

-- 1. Streak columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS streak_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active  date;

-- 2. Favorites table
CREATE TABLE IF NOT EXISTS public.favorite_dares (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text       text NOT NULL,
  type       text,
  vibe       text,
  intensity  integer,
  source     text NOT NULL DEFAULT 'ai',   -- 'ai' | 'local'
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_favorite_dares_user_created
  ON public.favorite_dares(user_id, created_at DESC);

ALTER TABLE public.favorite_dares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorite_dares_select_own" ON public.favorite_dares;
CREATE POLICY "favorite_dares_select_own" ON public.favorite_dares
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "favorite_dares_insert_own" ON public.favorite_dares;
CREATE POLICY "favorite_dares_insert_own" ON public.favorite_dares
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorite_dares_delete_own" ON public.favorite_dares;
CREATE POLICY "favorite_dares_delete_own" ON public.favorite_dares
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
