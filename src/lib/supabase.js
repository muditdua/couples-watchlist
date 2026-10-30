import { createClient } from '@supabase/supabase-js';

const clean = (v) => (v || '').trim().replace(/^["']|["']$/g, '');
const rawUrl = clean(import.meta.env.VITE_SUPABASE_URL);
const key = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

// Keep only https://xxxx.supabase.co, even if extra path text was pasted by mistake
let url = '';
try { url = rawUrl ? new URL(rawUrl).origin : ''; } catch { /* invalid URL */ }

// The login is kept in this browser's storage and renewed automatically, so you stay signed in
// until you sign out or clear this site's data.
export const supabase = url && key
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    })
  : null;

// Asks the browser not to throw this site's saved data away when it needs space
if (supabase && navigator.storage?.persist) navigator.storage.persist().catch(() => {});
