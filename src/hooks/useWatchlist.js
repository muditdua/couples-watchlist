import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useWatchlist(room) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('movies').select('*').eq('room', room)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else { setMovies(data); setError(''); }
    setLoading(false);
  }, [room]);

  // Initial load + live updates from the other device
  useEffect(() => {
    setLoading(true);
    load();
    const channel = supabase
      .channel(`movies-${room}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movies' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room, load]);

  const add = async (details) => {
    const { error } = await supabase.from('movies').insert({ ...details, room });
    if (error && error.code !== '23505') throw error; // 23505 = already on the list
    await load();
  };

  const toggleWatched = async (movie) => {
    const watched = !movie.watched;
    setMovies((ms) => ms.map((m) => (m.id === movie.id ? { ...m, watched } : m)));
    const { error } = await supabase.from('movies')
      .update({ watched, watched_at: watched ? new Date().toISOString() : null })
      .eq('id', movie.id);
    if (error) load();
  };

  const remove = async (movie) => {
    setMovies((ms) => ms.filter((m) => m.id !== movie.id));
    const { error } = await supabase.from('movies').delete().eq('id', movie.id);
    if (error) load();
  };

  return { movies, loading, error, add, toggleWatched, remove };
}
