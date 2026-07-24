-- Migration: Resolve column-name collision between profiles and game_scores
-- Date: 2026-07-12
-- Description:
--   public.profiles.partner1 / partner2 are TEXT — the couple's display
--   names, set once during welcome/onboarding.
--   public.game_scores.partner1 / partner2 are INTEGER — a running point
--   tally, unrelated to names.
--   Reusing the same identifiers for two unrelated concepts across tables is
--   confusing and error-prone (e.g. `scores.partner1` reads exactly like
--   `profile.partner1`, a name, when it's actually a score). Renaming the
--   score columns to make their type/purpose obvious from the name alone.

ALTER TABLE public.game_scores RENAME COLUMN partner1 TO partner1_score;
ALTER TABLE public.game_scores RENAME COLUMN partner2 TO partner2_score;

COMMENT ON COLUMN public.game_scores.partner1_score IS 'Point tally for partner 1 (see profiles.partner1 for their display name).';
COMMENT ON COLUMN public.game_scores.partner2_score IS 'Point tally for partner 2 (see profiles.partner2 for their display name).';

-- Note on 20260316162434_add_dynamic_state_to_profiles.sql:
-- That migration file is empty (0 bytes) in the repo history. Whatever
-- "dynamic state" it was meant to add to `profiles` was never written down;
-- the profile columns that were likely intended (streak_count,
-- last_active_at, milestones, vibe) ended up being added instead by
-- 20260319131500_retention_all_things.sql three days later. If Supabase's
-- remote migration history shows 20260316162434 as already applied, it is
-- safe to leave as a no-op — do not delete or renumber it, since Supabase
-- tracks applied migrations by filename/timestamp and removing it would
-- desync local migration history from what's actually been run remotely.
