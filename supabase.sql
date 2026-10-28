-- Run this once in Supabase: SQL Editor > New query > Run
create table public.movies (
  id uuid primary key default gen_random_uuid(),
  room text not null,                -- your private shared "room code"
  tmdb_id integer not null,
  title text not null,
  year integer,
  poster_path text,
  runtime integer,                   -- minutes
  genres text[] not null default '{}',
  rating numeric(3,1),
  director text,
  cast_names text[] not null default '{}',
  watched boolean not null default false,
  watched_at timestamptz,
  created_at timestamptz not null default now(),
  unique (room, tmdb_id)
);

create index movies_room_idx on public.movies (room);

alter table public.movies enable row level security;
create policy "anyone with the app can read and write"
  on public.movies for all to anon using (true) with check (true);

-- Turn on live sync
alter publication supabase_realtime add table public.movies;
