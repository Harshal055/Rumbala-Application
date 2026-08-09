-- Rumbala Secure Admin Provisioning
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Create the admin_roles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.admin_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on admin_roles
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Only existing admins can read the admin list
CREATE POLICY "Admins can view admin list"
    ON public.admin_roles
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (SELECT user_id FROM public.admin_roles)
    );

-- 2. Promote adminhr@andx.com to admin role:
INSERT INTO public.admin_roles (user_id)
VALUES ('c888071a-edc0-4ce7-9622-4ad3f4759d0e')
ON CONFLICT (user_id) DO NOTHING;

-- Or promote dynamically by email:
INSERT INTO public.admin_roles (user_id)
SELECT id FROM auth.users WHERE lower(email) = lower('adminhr@andx.com')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Drop legacy insecure functions if any
DROP FUNCTION IF EXISTS public.grant_admin_with_pin(text, text);

