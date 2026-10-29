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
