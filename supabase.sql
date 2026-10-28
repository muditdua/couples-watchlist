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
  created_at timestamptz not null default now(),
  unique (room, media_type, tmdb_id)
);

create index movies_room_idx on public.movies (room);

alter table public.movies enable row level security;
create policy "open access for now"
  on public.movies for all to anon using (true) with check (true);

-- Turn on live sync
alter publication supabase_realtime add table public.movies;
