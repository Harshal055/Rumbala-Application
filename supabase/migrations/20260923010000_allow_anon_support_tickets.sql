-- Migration: Allow public/guest creation of support tickets (e.g. account deletion portal, pre-login support)
-- Date: 2026-09-23
-- Description: Enables anonymous web visitors and non-authenticated users to submit account deletion and support requests.

-- Add message column if missing for flat message storage
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS message text;

-- Allow anyone (guest, anonymous web visitor, or authenticated user) to submit support tickets
DROP POLICY IF EXISTS "support_tickets_insert_all" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create support tickets" ON public.support_tickets;

CREATE POLICY "support_tickets_insert_all"
ON public.support_tickets
FOR INSERT
WITH CHECK (true);
