-- Run once in Supabase > SQL Editor. Safe to run more than once.
-- Adds "My services" (the streaming services you pay for) to your profile.
alter table if exists public.profiles add column if not exists my_services jsonb;
