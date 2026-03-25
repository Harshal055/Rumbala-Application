-- CONSOLIDATED ADMIN SCHEMA FIX
-- Date: 2026-03-21
-- Purpose: Ensures all Admin V2 tables and policies exist to resolve "missing table" errors.

-- 1. Enable UUID Extension (Optional but recommended)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CMS: Cards Table
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fun', 'romantic', 'spicy', 'ldr')),
    points INTEGER NOT NULL DEFAULT 1,
    timer INTEGER, -- in seconds
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Support: Bug Reports Table
CREATE TABLE IF NOT EXISTS public.bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- No strict foreign key to auth.users for robustness
    user_email TEXT,
    message TEXT NOT NULL,
    device_info JSONB NOT NULL DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'ignored')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Support: Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- No strict foreign key for robustness
    user_email TEXT,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 6. Helper Function for Admin Detection
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email' = 'adminhr@andx.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS Policies (Standard Users)
-- Cards: Read only active
DROP POLICY IF EXISTS "cards_read_all" ON public.cards;
CREATE POLICY "cards_read_all" ON public.cards FOR SELECT USING (is_active = true);

-- Bug Reports: Insert allowed for everyone
DROP POLICY IF EXISTS "bug_reports_insert_all" ON public.bug_reports;
CREATE POLICY "bug_reports_insert_all" ON public.bug_reports FOR INSERT WITH CHECK (true);

-- Feedback: Insert allowed for everyone
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
CREATE POLICY "Anyone can insert feedback" ON public.feedback FOR INSERT WITH CHECK (true);

-- 8. Admin Global Bypass Policies
-- Admin can do EVERYTHING on these tables
DROP POLICY IF EXISTS "admin_all_cards" ON public.cards;
CREATE POLICY "admin_all_cards" ON public.cards FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin_all_bug_reports" ON public.bug_reports;
CREATE POLICY "admin_all_bug_reports" ON public.bug_reports FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin_all_feedback" ON public.feedback;
CREATE POLICY "admin_all_feedback" ON public.feedback FOR ALL USING (public.is_admin());

-- Also add admin bypass for existing tables
DROP POLICY IF EXISTS "admin_all_profiles" ON public.profiles;
CREATE POLICY "admin_all_profiles" ON public.profiles FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin_all_purchases" ON public.purchases;
CREATE POLICY "admin_all_purchases" ON public.purchases FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin_all_rooms" ON public.rooms;
CREATE POLICY "admin_all_rooms" ON public.rooms FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin_all_messages" ON public.room_messages;
CREATE POLICY "admin_all_messages" ON public.room_messages FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin_all_scores" ON public.game_scores;
CREATE POLICY "admin_all_scores" ON public.game_scores FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin_all_history" ON public.game_history;
CREATE POLICY "admin_all_history" ON public.game_history FOR ALL USING (public.is_admin());
