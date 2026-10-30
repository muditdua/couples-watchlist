import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BACKUP_COLUMNS } from '../lib/backup';

const ROOM = 'our-list'; // fixed value, so you both always see the same list

// who = { id, name } of the signed-in person
export function useWatchlist(who) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('movies').select('*').eq('room', ROOM)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else { setMovies(data); setError(''); }
    setLoading(false);
  }, []);

  // Initial load + live updates from the other device
  useEffect(() => {
    load();
    const channel = supabase
      .channel('movies-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movies' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  // Update the screen immediately, then save; reload if saving fails
  const patch = async (movie, changes) => {
    setMovies((ms) => ms.map((m) => (m.id === movie.id ? { ...m, ...changes } : m)));
    const { error } = await supabase.from('movies').update(changes).eq('id', movie.id);
    if (error) { setError(error.message); load(); }
  };

  const add = async (details) => {
    const { error } = await supabase.from('movies').insert({ ...details, room: ROOM, added_by: who.name, added_by_id: who.id });
    if (error && error.code !== '23505') throw error; // 23505 = already on the list
    await load();
  };

  const toggleWatched = (movie) => {
    const watched = !movie.watched;
    return patch(movie, { watched, watched_at: watched ? new Date().toISOString() : null });
  };

  // yyyy-mm-dd from a date input
  const setWatchedDate = (movie, ymd) => {
    if (!ymd) return undefined;
    return patch(movie, { watched_at: new Date(`${ymd}T12:00:00`).toISOString() });
  };

  const toggleLike = (movie) => {
    const likes = { ...(movie.likes ?? {}) };
    if (likes[who.id]) delete likes[who.id]; else likes[who.id] = who.name;
    return patch(movie, { likes });
  };

  const toggleEpisode = (movie, season, episode) => {
    const map = { ...(movie.episodes_watched ?? {}) };
    const set = new Set(map[season] ?? []);
    if (set.has(episode)) set.delete(episode); else set.add(episode);
    if (set.size) map[season] = [...set].sort((a, b) => a - b); else delete map[season];
    return patch(movie, { episodes_watched: map });
  };

  const markSeason = (movie, season, count, on) => {
    const map = { ...(movie.episodes_watched ?? {}) };
    if (on) map[season] = Array.from({ length: count }, (_, i) => i + 1); else delete map[season];
    return patch(movie, { episodes_watched: map });
  };

  const addNote = (movie, text) => {
    const note = { id: crypto.randomUUID(), by_id: who.id, by: who.name, text: text.trim().slice(0, 280), at: new Date().toISOString() };
    return patch(movie, { notes: [...(movie.notes ?? []), note] });
  };

  const removeNote = (movie, noteId) => patch(movie, { notes: (movie.notes ?? []).filter((n) => n.id !== noteId) });

  // Adds titles from a backup file; ones already in the list are left alone. Returns how many were new.
  const importRows = async (rows) => {
    const clean = rows.map((r) => ({
      ...Object.fromEntries(BACKUP_COLUMNS.filter((c) => r[c] !== undefined && r[c] !== null).map((c) => [c, r[c]])),
      media_type: r.media_type || 'movie',
      room: ROOM,
    }));
    let added = 0;
    for (let i = 0; i < clean.length; i += 100) {
      const { data, error } = await supabase.from('movies')
        .upsert(clean.slice(i, i + 100), { onConflict: 'room,media_type,tmdb_id', ignoreDuplicates: true })
        .select('id');
      if (error) throw error;
      added += data.length;
    }
    await load();
    return added;
  };

  const remove = async (movie) => {
    setMovies((ms) => ms.filter((m) => m.id !== movie.id));
    const { error } = await supabase.from('movies').delete().eq('id', movie.id);
    if (error) load();
  };

  return {
    movies, loading, error, add, patch, toggleWatched, setWatchedDate, toggleLike, toggleEpisode, markSeason,
    addNote, removeNote, importRows, remove,
  };
}
