-- Rumbala Supabase Phase 1
-- Schema + RLS policies for auth, profiles, cards, purchases, rooms, chat, and game history.
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  partner1 text default '',
  partner2 text default '',
  card_count integer not null default 5,
  last_card_update timestamptz default now(),
  last_weekly_claim_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text not null,
  order_id text,
  payment_id text,
  amount integer not null,
  cards_added integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  code text primary key,
  host_user_id uuid not null references auth.users(id) on delete cascade,
  guest_user_id uuid references auth.users(id) on delete set null,
  host_name text not null,
  guest_name text,
  current_card jsonb,
  host_score integer not null default 0,
  guest_score integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_code_len check (char_length(code) between 4 and 12)
);

create table if not exists public.room_messages (
  id bigint generated always as identity primary key,
  room_code text not null references public.rooms(code) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  sender text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.game_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  partner1 integer not null default 0,
  partner2 integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.game_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card jsonb not null,
  winner text not null,
  proof_uri text,
  created_at timestamptz not null default now(),
  constraint game_history_winner_check check (winner in ('partner1', 'partner2', 'both'))
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

create index if not exists idx_profiles_created_at on public.profiles(created_at desc);
create index if not exists idx_purchases_user_created on public.purchases(user_id, created_at desc);
create index if not exists idx_rooms_active_updated on public.rooms(is_active, updated_at desc);
create index if not exists idx_room_messages_room_created on public.room_messages(room_code, created_at asc);
create index if not exists idx_game_history_user_created on public.game_history(user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Updated-at trigger helper
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_rooms_set_updated_at on public.rooms;
create trigger trg_rooms_set_updated_at
before update on public.rooms
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_scores_set_updated_at on public.game_scores;
create trigger trg_scores_set_updated_at
before update on public.game_scores
for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- New user bootstrap trigger
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;

  insert into public.game_scores (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- Realtime publication
-- ─────────────────────────────────────────────────────────────────────────────

do $$
begin
  begin
    alter publication supabase_realtime add table public.rooms;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.room_messages;
  exception when duplicate_object then
    null;
  end;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Enable
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.purchases enable row level security;
alter table public.rooms enable row level security;
alter table public.room_messages enable row level security;
alter table public.game_scores enable row level security;
alter table public.game_history enable row level security;

-- Remove old policies if re-running script

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

drop policy if exists "purchases_select_own" on public.purchases;
drop policy if exists "purchases_insert_own" on public.purchases;

drop policy if exists "scores_select_own" on public.game_scores;
drop policy if exists "scores_insert_own" on public.game_scores;
drop policy if exists "scores_update_own" on public.game_scores;

drop policy if exists "history_select_own" on public.game_history;
drop policy if exists "history_insert_own" on public.game_history;
drop policy if exists "history_delete_own" on public.game_history;

drop policy if exists "rooms_select_participants" on public.rooms;
drop policy if exists "rooms_insert_host" on public.rooms;
drop policy if exists "rooms_update_participants" on public.rooms;
drop policy if exists "rooms_delete_host" on public.rooms;

drop policy if exists "messages_select_participants" on public.room_messages;
drop policy if exists "messages_insert_participants" on public.room_messages;

-- Profiles
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Purchases
create policy "purchases_select_own"
on public.purchases
for select
using (auth.uid() = user_id);

create policy "purchases_insert_own"
on public.purchases
for insert
with check (auth.uid() = user_id);

-- Game scores
create policy "scores_select_own"
on public.game_scores
for select
using (auth.uid() = user_id);

create policy "scores_insert_own"
on public.game_scores
for insert
with check (auth.uid() = user_id);

create policy "scores_update_own"
on public.game_scores
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Game history
create policy "history_select_own"
on public.game_history
for select
using (auth.uid() = user_id);

create policy "history_insert_own"
on public.game_history
for insert
with check (auth.uid() = user_id);

create policy "history_delete_own"
on public.game_history
for delete
using (auth.uid() = user_id);

-- Rooms
create policy "rooms_select_participants"
on public.rooms
for select
using (auth.uid() = host_user_id or auth.uid() = guest_user_id);

create policy "rooms_insert_host"
on public.rooms
for insert
with check (auth.uid() = host_user_id);

create policy "rooms_update_participants"
on public.rooms
for update
using (auth.uid() = host_user_id or auth.uid() = guest_user_id)
with check (auth.uid() = host_user_id or auth.uid() = guest_user_id);

create policy "rooms_delete_host"
on public.rooms
for delete
using (auth.uid() = host_user_id);

-- Room messages
create policy "messages_select_participants"
on public.room_messages
for select
using (
  exists (
    select 1
    from public.rooms r
    where r.code = room_messages.room_code
      and (auth.uid() = r.host_user_id or auth.uid() = r.guest_user_id)
  )
);

create policy "messages_insert_participants"
on public.room_messages
for insert
with check (
  auth.uid() = sender_user_id
  and exists (
    select 1
    from public.rooms r
    where r.code = room_messages.room_code
      and (auth.uid() = r.host_user_id or auth.uid() = r.guest_user_id)
  )
);

-- Final sanity check (optional)
-- select * from public.profiles limit 5;
