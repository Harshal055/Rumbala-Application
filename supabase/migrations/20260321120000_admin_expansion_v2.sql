-- Admin Expansion V2: CMS, Support, and Global Admin Access
-- Migration Date: 2026-03-21

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CMS: Cards Table
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  type text not null check (type in ('fun', 'romantic', 'spicy', 'ldr')),
  points integer not null default 1,
  timer integer, -- in seconds
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast filtering by type/vibe
create index if not exists idx_cards_type_active on public.cards(type, is_active);

-- Enable RLS
alter table public.cards enable row level security;

-- standard users can only read active cards
create policy "cards_read_all" on public.cards
  for select using (is_active = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Support: Bug Reports Table
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  message text not null,
  device_info jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'ignored')),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.bug_reports enable row level security;

-- users can insert their own reports
create policy "bug_reports_insert_own" on public.bug_reports
  for insert with check (auth.uid() = user_id or user_id is null);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Global Admin Access (RLS Bypass)
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper function to check if current user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return (auth.jwt() ->> 'email' = 'adminhr@andx.com');
end;
$$ language plpgsql security definer;

-- Add admin overwrite policies to ALL relevant tables
-- Note: Using 'true' for admin access

-- Cards Admin
create policy "admin_all_cards" on public.cards
  for all using (public.is_admin());

-- Bug Reports Admin
create policy "admin_all_bug_reports" on public.bug_reports
  for all using (public.is_admin());

-- Profiles Admin
create policy "admin_all_profiles" on public.profiles
  for all using (public.is_admin());

-- Purchases Admin
create policy "admin_all_purchases" on public.purchases
  for all using (public.is_admin());

-- Rooms Admin
create policy "admin_all_rooms" on public.rooms
  for all using (public.is_admin());

-- Room Messages Admin
create policy "admin_all_messages" on public.room_messages
  for all using (public.is_admin());

-- Game Scores Admin
create policy "admin_all_scores" on public.game_scores
  for all using (public.is_admin());

-- Game History Admin
create policy "admin_all_history" on public.game_history
  for all using (public.is_admin());

-- Feedback Admin
create policy "admin_all_feedback" on public.feedback
  for all using (public.is_admin());
