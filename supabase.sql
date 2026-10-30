-- FRESH SETUP: run once in Supabase > SQL Editor > New query > Run
create table public.movies (
  id uuid primary key default gen_random_uuid(),
  room text not null,                -- fixed value, keeps the single shared list
  media_type text not null default 'movie',  -- 'movie' or 'tv'
  tmdb_id integer not null,
  title text not null,
  year integer,
  poster_path text,
  runtime integer,                   -- minutes (per episode for series)
  seasons integer,
  genres text[] not null default '{}',
  rating numeric(3,1),
  director text,
  cast_names text[] not null default '{}',
  watched boolean not null default false,
  watched_at timestamptz,
  added_by text,                     -- display name of who added it
  likes jsonb not null default '{}'::jsonb,            -- { userId: name } of who wants it
  episodes_watched jsonb not null default '{}'::jsonb, -- { "1": [1,2,3] } episode tracking
  created_at timestamptz not null default now(),
  unique (room, media_type, tmdb_id)
);

create index movies_room_idx on public.movies (room);

alter table public.movies enable row level security;
-- Only signed-in users (your two accounts) can read or write.
-- Create them under Authentication > Users, and turn off sign-ups.
create policy "signed-in users only"
  on public.movies for all to authenticated using (true) with check (true);

-- Turn on live sync
alter publication supabase_realtime add table public.movies;

-- ===== Profiles (photo, name style, accent colour) =====
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar text,        -- small square photo stored as a data URL
  name_font text,
  name_color text,
  accent text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "signed-in users can read profiles" on public.profiles;
drop policy if exists "users add their own profile" on public.profiles;
drop policy if exists "users edit their own profile" on public.profiles;

create policy "signed-in users can read profiles"
  on public.profiles for select to authenticated using (true);
create policy "users add their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "users edit their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Live updates, so your partner sees your changes right away
do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null; end $$;

-- Lets "Added by" follow your current name and photo
alter table public.movies add column if not exists added_by_id uuid;

-- ===== Watching status, Plan a night, Notes, bio =====
alter table public.movies add column if not exists season_counts jsonb;                        -- episodes per season, for "Next up"
alter table public.movies add column if not exists planned_on date;                            -- Plan a night: date
alter table public.movies add column if not exists planned_time text;                          -- Plan a night: time (optional)
alter table public.movies add column if not exists notes jsonb not null default '[]'::jsonb;   -- notes on a title
alter table if exists public.profiles add column if not exists bio text;
alter table if exists public.profiles add column if not exists avatar_src text;                -- bigger original, so the photo can be re-adjusted

-- ===== Added by, wants, episode progress (also in supabase-upgrade-v2.sql) =====
alter table public.movies add column if not exists added_by text;
alter table public.movies add column if not exists likes jsonb not null default '{}'::jsonb;
alter table public.movies add column if not exists episodes_watched jsonb not null default '{}'::jsonb;

alter table if exists public.profiles add column if not exists avatar_large text;
