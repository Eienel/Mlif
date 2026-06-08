-- Premise schema. Run in the Supabase SQL editor.
--
-- Premise has no accounts. Supabase is optional infrastructure used only as a
-- server-side store for the provider cache and the per-IP fair-use counter. The
-- watchlist lives in the browser (localStorage), so there are no user tables.

-- provider cache: avoid re-hitting TMDB and Watchmode
create table if not exists provider_cache (
  tmdb_id int not null,
  country text not null,
  payload jsonb not null,
  fetched_at timestamptz default now(),
  primary key (tmdb_id, country)
);

-- per-IP daily usage counter, keyed by "<ip>:<date>"
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

-- Row Level Security ---------------------------------------------------------
-- Both tables are server-write only. With RLS on and no policies, the anon and
-- authenticated roles get no access; the service role (used by server routes)
-- bypasses RLS entirely.

alter table provider_cache enable row level security;
alter table anon_usage enable row level security;
