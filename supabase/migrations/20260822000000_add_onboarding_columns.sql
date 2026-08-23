-- Migration: Persist onboarding questionnaire answers on profiles
-- Date: 2026-08-22
-- Description:
--   The onboarding questionnaire (gender, relationship status, main goal) was
--   only ever stored in local device storage and in auth.users.raw_user_meta_data.
--   It was NOT queryable on public.profiles, so the admin panel and any analytics
--   over `profiles` could never see it. This adds first-class columns so the
--   answers are saved per-user in the profiles table.
--
--   These columns are plain preference strings. They are intentionally NOT
--   covered by restrict_sensitive_profile_updates (which guards card_count /
--   is_pro / pro_expires_at / claim timers), so the client may write its own
--   values under the existing profiles_update_own RLS policy.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS relationship_status text,
  ADD COLUMN IF NOT EXISTS app_purpose text;

-- Optional: backfill from existing auth metadata for users who already onboarded.
-- Safe to run once; no-op if metadata keys are absent.
UPDATE public.profiles p
SET
  gender             = COALESCE(p.gender,             u.raw_user_meta_data ->> 'gender'),
  relationship_status = COALESCE(p.relationship_status, u.raw_user_meta_data ->> 'relationship_status'),
  app_purpose        = COALESCE(p.app_purpose,        u.raw_user_meta_data ->> 'app_purpose')
FROM auth.users u
WHERE u.id = p.id
  AND (
        (p.gender IS NULL             AND u.raw_user_meta_data ? 'gender')
     OR (p.relationship_status IS NULL AND u.raw_user_meta_data ? 'relationship_status')
     OR (p.app_purpose IS NULL        AND u.raw_user_meta_data ? 'app_purpose')
  );
