-- LOCK THE DATABASE TO YOUR TWO EMAILS
-- Run in Supabase > SQL Editor AFTER the other upgrade files.
--
-- STEP 1: replace BOTH example addresses below with the exact emails you two sign in with.
-- If you lock yourself out, open Supabase > Table Editor > allowed_emails and fix the rows
-- (the dashboard is not affected by these rules).

create table if not exists public.allowed_emails (email text primary key);

insert into public.allowed_emails (email) values
  ('your-email@example.com'),
  ('her-email@example.com')
on conflict do nothing;

-- No policies on this table: nobody can read or change it through the app.
alter table public.allowed_emails enable row level security;

create or replace function public.is_allowed()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- The list
drop policy if exists "open access for now" on public.movies;
drop policy if exists "anyone with the app can read and write" on public.movies;
drop policy if exists "signed-in users only" on public.movies;
drop policy if exists "allowed emails only" on public.movies;
create policy "allowed emails only" on public.movies
  for all to authenticated using (public.is_allowed()) with check (public.is_allowed());

-- Profiles
drop policy if exists "signed-in users can read profiles" on public.profiles;
drop policy if exists "users add their own profile" on public.profiles;
drop policy if exists "users edit their own profile" on public.profiles;
create policy "allowed emails read profiles" on public.profiles
  for select to authenticated using (public.is_allowed());
create policy "allowed emails add own profile" on public.profiles
  for insert to authenticated with check (public.is_allowed() and auth.uid() = id);
create policy "allowed emails edit own profile" on public.profiles
  for update to authenticated using (public.is_allowed() and auth.uid() = id) with check (public.is_allowed() and auth.uid() = id);
