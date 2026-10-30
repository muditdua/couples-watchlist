import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// Profiles (name, photo, name style, accent) for you and your partner.
// If the table doesn't exist yet the app keeps working with plain names.
export function useProfiles(user) {
  const [profiles, setProfiles] = useState([]);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const cols = 'id,name,avatar,name_font,name_color,accent,bio,updated_at';
    let { data, error } = await supabase.from('profiles').select(`${cols},my_services`);
    if (error) ({ data, error } = await supabase.from('profiles').select(cols)); // before the v5 SQL has been run
    if (!error) setProfiles(data);
    setReady(true);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('profiles-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const byId = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p])), [profiles]);
  const byName = useMemo(() => Object.fromEntries(profiles.filter((p) => p.name).map((p) => [p.name, p])), [profiles]);
  const me = byId[user.id] ?? null;

  // Only the fields you pass are changed
  const save = async (fields) => {
    const row = { id: user.id, ...fields, updated_at: new Date().toISOString() };
    setProfiles((ps) => (ps.some((p) => p.id === user.id)
      ? ps.map((p) => (p.id === user.id ? { ...p, ...row } : p))
      : [...ps, row]));
    const { error } = await supabase.from('profiles').upsert(row);
    if (error) { load(); throw error; }
  };

  return { profiles, byId, byName, me, ready, save };
}
