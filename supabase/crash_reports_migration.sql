-- ============================================================
-- Supabase Migration: crash_reports table
-- Run this SQL in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS crash_reports (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    error_message   TEXT NOT NULL,
    stack_trace     TEXT,
    component_stack TEXT,
    is_fatal        BOOLEAN DEFAULT false,
    source          TEXT CHECK (source IN ('error_boundary', 'global_handler', 'promise_rejection', 'manual')),
    screen          TEXT,
    platform        TEXT DEFAULT 'android',
    app_version     TEXT,
    device_info     JSONB DEFAULT '{}'::jsonb,
    status          TEXT DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'wont_fix')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE crash_reports ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to INSERT their own crash reports
CREATE POLICY "Users can insert their own crash reports"
    ON crash_reports FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow anonymous crash reports (when user is not logged in)
CREATE POLICY "Anon can insert crash reports"
    ON crash_reports FOR INSERT
    TO anon
    WITH CHECK (true);

-- Only admin can SELECT (read) crash reports
-- Adjust the admin email to match your admin account
CREATE POLICY "Admin can read all crash reports"
    ON crash_reports FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'adminhr@andx.com'
    );

-- Only admin can UPDATE crash report status
CREATE POLICY "Admin can update crash reports"
    ON crash_reports FOR UPDATE
    TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'adminhr@andx.com'
    );

-- Index for faster admin queries
CREATE INDEX idx_crash_reports_created_at ON crash_reports(created_at DESC);
CREATE INDEX idx_crash_reports_status ON crash_reports(status);
CREATE INDEX idx_crash_reports_source ON crash_reports(source);
