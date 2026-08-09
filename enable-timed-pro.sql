-- ==============================================================================
-- RUMBALA: Limited-Time (Auto-Expiring) Pro Memberships Migration
-- ==============================================================================
-- Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Add pro_expires_at column to public.profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create index for high performance queries on active Pro users
CREATE INDEX IF NOT EXISTS idx_profiles_pro_status 
ON public.profiles(is_pro, pro_expires_at);

-- 3. Ensure profiles table is published in Supabase Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
END $$;

COMMENT ON COLUMN public.profiles.pro_expires_at IS 'Null means permanent/lifetime Pro; ISO timestamp means limited-time Pro that auto-expires.';
