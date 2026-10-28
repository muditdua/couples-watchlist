-- ONLY if you already ran the OLD supabase.sql (movies only). Skip this for a fresh setup.
alter table public.movies add column if not exists media_type text not null default 'movie';
alter table public.movies add column if not exists seasons integer;
alter table public.movies drop constraint if exists movies_room_tmdb_id_key;
alter table public.movies add constraint movies_room_type_tmdb_key unique (room, media_type, tmdb_id);
