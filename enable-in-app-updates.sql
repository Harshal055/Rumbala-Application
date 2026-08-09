-- Rumbala — In-App Update System
-- Run this once in your Supabase SQL Editor (Dashboard > SQL Editor).
-- Safe to re-run: everything is idempotent.

-- 1. Remote config table (shared by feature flags, maintenance mode, and updates).
CREATE TABLE IF NOT EXISTS public.app_remote_configs (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_remote_configs ENABLE ROW LEVEL SECURITY;

-- 2. Everyone (even signed-out users on app launch) can READ configs.
DROP POLICY IF EXISTS "Public can read remote configs" ON public.app_remote_configs;
CREATE POLICY "Public can read remote configs"
    ON public.app_remote_configs
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 3. Only admins can WRITE configs (from the Admin Portal).
DROP POLICY IF EXISTS "Admins can write remote configs" ON public.app_remote_configs;
CREATE POLICY "Admins can write remote configs"
    ON public.app_remote_configs
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM public.admin_roles))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_roles));

-- 4. Seed / update the in-app update config row.
--    IMPORTANT: these numbers are versionCode / build numbers, NOT "1.0.5".
--    Your current Android versionCode is 7 (see app.config.js).
--      latest_*  = newest build on the store   -> below this shows an OPTIONAL prompt
--      min_*     = oldest still-allowed build   -> below this FORCE-updates (blocks app)
INSERT INTO public.app_remote_configs (key, value)
VALUES (
    'app_update',
    jsonb_build_object(
        'enabled',        false,   -- flip to true in the Admin Portal when ready
        'latest_android', 7,
        'latest_ios',     7,
        'min_android',    0,       -- 0 = never force-update
        'min_ios',        0,
        'message',        'A new version of Rumbala is here — with fresh dares and improvements. Update now to keep the sparks flying! ✨',
        'force_message',  'Please update Rumbala to the latest version to continue. This update is required to keep playing. 💕',
        'android_url',    '',
        'ios_url',        ''
    )
)
ON CONFLICT (key) DO NOTHING;  -- don't clobber values you've already set in the portal
