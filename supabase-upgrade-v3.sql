-- Run once in Supabase > SQL Editor. Adds profiles (photo, name style, accent colour).
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
