-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Anyone can insert feedback (if authenticated, we'll store their ID)
CREATE POLICY "Anyone can insert feedback" ON public.feedback
    FOR INSERT WITH CHECK (true);

-- 2. Only admin can view all feedback
-- For this simple implementation, we'll use the email check if possible, 
-- or just allow the service role / our specific admin logic to handle it.
-- In a real app, you'd use a 'role' column in profiles.
CREATE POLICY "Admins can view all feedback" ON public.feedback
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'adminhr@andx.com'
    );

-- Also add feedback count to profiles or just query count directly.
