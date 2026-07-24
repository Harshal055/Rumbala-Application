-- Run this in your Supabase SQL Editor
-- This allows anyone to promote an Admin IF they know the hardcoded PIN

-- 1. Create the admin_roles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.admin_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create the secure RPC function to grant admin access via PIN
CREATE OR REPLACE FUNCTION public.grant_admin_with_pin(secret_pin text, target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser privileges so it bypasses RLS
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- 1. Verify the hardcoded PIN
  IF secret_pin != '3012' THEN
    RAISE EXCEPTION 'Invalid PIN.';
  END IF;

  -- 2. Find the user ID from the profiles table using their email
  SELECT id INTO target_user_id
  FROM public.profiles
  WHERE lower(email) = lower(target_email);

  -- 3. If user doesn't exist in profiles yet, throw an error
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  -- 4. Insert them into admin_roles (if not already there)
  INSERT INTO public.admin_roles (user_id)
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN true;
END;
$$;
