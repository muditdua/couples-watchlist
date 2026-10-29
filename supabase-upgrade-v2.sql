-- Run once in Supabase > SQL Editor if your table was created before these features.
-- Safe to run more than once.
alter table public.movies add column if not exists media_type text not null default 'movie';
alter table public.movies add column if not exists seasons integer;
alter table public.movies add column if not exists added_by text;                                  -- who added it
alter table public.movies add column if not exists likes jsonb not null default '{}'::jsonb;       -- who wants it
alter table public.movies add column if not exists episodes_watched jsonb not null default '{}'::jsonb; -- episode tracking
