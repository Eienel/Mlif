-- Premise schema. Run in the Supabase SQL editor.
-- Row Level Security is on everywhere. Users touch only their own rows.

-- profiles: one row per auth user
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  plan text not null default 'free',          -- 'free' | 'pro'
  plan_source text,                            -- 'card' | 'crypto' | null
  plan_expires_at timestamptz,                 -- set for crypto passes, null for card subs
  ls_customer_id text,                         -- Lemon Squeezy customer id (card)
  ls_subscription_id text,                     -- Lemon Squeezy subscription id (card)
  daily_searches int not null default 0,
  daily_reset_at date not null default current_date,
  created_at timestamptz default now()
);

-- If the table already exists from an earlier version, add the billing columns.
alter table profiles add column if not exists plan_source text;
alter table profiles add column if not exists plan_expires_at timestamptz;
alter table profiles add column if not exists ls_customer_id text;
alter table profiles add column if not exists ls_subscription_id text;

-- watchlist: saved titles per user
create table if not exists watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  tmdb_id int not null,
  title text not null,
  poster_path text,
  notify_when_free boolean default false,
  created_at timestamptz default now(),
  unique (user_id, tmdb_id)
);

-- provider cache: avoid re-hitting TMDB and Watchmode
create table if not exists provider_cache (
  tmdb_id int not null,
  country text not null,
  payload jsonb not null,
  fetched_at timestamptz default now(),
  primary key (tmdb_id, country)
);

-- anonymous daily usage counter, keyed by "<ip>:<date>"
create table if not exists anon_usage (
  key text primary key,
  count int not null default 0,
  created_at timestamptz default now()
);

-- phase 2 only: plot embeddings for semantic shortlist
create extension if not exists vector;
create table if not exists title_embeddings (
  tmdb_id int primary key,
  title text,
  year int,
  embedding vector(1536)
);

-- Create a profile automatically when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security ---------------------------------------------------------

alter table profiles enable row level security;
alter table watchlist enable row level security;
alter table provider_cache enable row level security;
alter table anon_usage enable row level security;

-- profiles: a user can read and update only their own row.
drop policy if exists "profiles read own" on profiles;
create policy "profiles read own" on profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles update own" on profiles;
create policy "profiles update own" on profiles
  for update using (auth.uid() = id);

-- watchlist: a user can do anything to only their own rows.
drop policy if exists "watchlist all own" on watchlist;
create policy "watchlist all own" on watchlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- provider_cache and anon_usage are server-write only. With RLS on and no
-- policies, anon and authenticated roles get no access; the service role
-- (used by server routes) bypasses RLS entirely.
