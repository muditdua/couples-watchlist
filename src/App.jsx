import { useMemo, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useWatchlist } from './hooks/useWatchlist';
import Header from './components/Header';
import Filters from './components/Filters';
import MovieCard from './components/MovieCard';
import SearchModal from './components/SearchModal';
import DecisionModal from './components/DecisionModal';
import ConfirmDialog from './components/ConfirmDialog';

export default function App() {
  if (!supabase) {
    return (
      <main className="mx-auto max-w-md px-6 py-20">
        <h1 className="font-display text-3xl font-semibold">Almost ready</h1>
        <p className="mt-3 text-mist">
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code>, then restart the dev server. See the README.
        </p>
      </main>
    );
  }
  return <Watchlist />;
}

function Watchlist() {
  const { movies, loading, error, add, toggleWatched, remove } = useWatchlist();
  const [status, setStatus] = useState('to-watch');
  const [type, setType] = useState('all');
  const [genre, setGenre] = useState('all');
  const [sort, setSort] = useState('shortest');
  const [modal, setModal] = useState(null); // 'search' | 'decide' | null
  const [pendingRemove, setPendingRemove] = useState(null);

  const genres = useMemo(() => [...new Set(movies.flatMap((m) => m.genres))].sort(), [movies]);

  const visible = useMemo(() => {
    const list = movies.filter((m) =>
      (status === 'all' || (status === 'watched') === m.watched) &&
      (type === 'all' || m.media_type === type) &&
      (genre === 'all' || m.genres.includes(genre)));
    const by = {
      shortest: (a, b) => (a.runtime ?? 9999) - (b.runtime ?? 9999),
      rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
      alpha: (a, b) => a.title.localeCompare(b.title),
      newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    }[sort];
    return [...list].sort(by);
  }, [movies, status, type, genre, sort]);

  const toWatch = movies.filter((m) => !m.watched).length;

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 pb-32">
      <Header total={movies.length} toWatch={toWatch} />
      <Filters {...{ status, setStatus, type, setType, genre, setGenre, genres, sort, setSort }} />
      {error && <p className="rounded-xl bg-red-950/60 p-3 text-sm text-red-200">Couldn't sync: {error}</p>}

      {loading ? (
        <p className="py-16 text-center text-mist">Loading your list…</p>
      ) : visible.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {visible.map((m) => <MovieCard key={m.id} movie={m} onToggle={toggleWatched} onRemove={setPendingRemove} />)}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="font-display text-2xl">{movies.length ? 'Nothing matches those filters' : 'Your list is empty'}</p>
          <p className="mt-2 text-mist">{movies.length ? 'Try another genre, type or status.' : 'Add the first movie or series for your next night in.'}</p>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 flex justify-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button onClick={() => setModal('decide')} className="btn btn-ghost !px-5 !py-3.5 shadow-xl shadow-black/40">
          <Sparkles size={18} /> Help us decide
        </button>
        <button onClick={() => setModal('search')} className="btn btn-primary !px-5 !py-3.5 shadow-xl shadow-black/40">
          <Plus size={18} /> Add title
        </button>
      </nav>

      {modal === 'search' && (
        <SearchModal existingKeys={new Set(movies.map((m) => `${m.media_type}-${m.tmdb_id}`))} onAdd={add} onClose={() => setModal(null)} />
      )}
      {modal === 'decide' && <DecisionModal movies={movies} onClose={() => setModal(null)} />}
      {pendingRemove && (
          <ConfirmDialog
            movie={pendingRemove}
            onCancel={() => setPendingRemove(null)}
            onConfirm={() => { remove(pendingRemove); setPendingRemove(null); }}
          />
        )}
    </div>
  );
}
