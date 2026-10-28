import { createClient } from '@supabase/supabase-js';

const clean = (v) => (v || '').trim().replace(/^["']|["']$/g, '');
const rawUrl = clean(import.meta.env.VITE_SUPABASE_URL);
const key = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

// Keep only https://xxxx.supabase.co, even if extra path text was pasted by mistake
let url = '';
try { url = rawUrl ? new URL(rawUrl).origin : ''; } catch { /* invalid URL */ }

export const supabase = url && key ? createClient(url, key) : null;
