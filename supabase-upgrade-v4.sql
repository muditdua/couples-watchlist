-- Run once in Supabase > SQL Editor (after supabase-upgrade-v3.sql). Safe to run more than once.
-- Adds: Watching status ("next up"), Plan a night, Notes, profile bio and the re-adjustable profile photo.
alter table public.movies add column if not exists season_counts jsonb;                        -- episodes per season, for "Next up"
alter table public.movies add column if not exists planned_on date;                            -- Plan a night: date
alter table public.movies add column if not exists planned_time text;                          -- Plan a night: time (optional)
alter table public.movies add column if not exists notes jsonb not null default '[]'::jsonb;   -- notes on a title
alter table if exists public.profiles add column if not exists bio text;
alter table if exists public.profiles add column if not exists avatar_src text;                -- bigger original, so the photo can be re-adjusted
