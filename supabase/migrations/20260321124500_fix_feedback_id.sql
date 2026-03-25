-- Fix feedback ID default to use gen_random_uuid instead of uuid_generate_v4
-- Migration Date: 2026-03-21

ALTER TABLE public.feedback 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Ensure RLS allows insert for everyone
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
CREATE POLICY "Anyone can insert feedback" ON public.feedback
    FOR INSERT WITH CHECK (true);
