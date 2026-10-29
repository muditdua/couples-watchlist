import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import Modal from './Modal';
import { getDetails, posterUrl, searchTitles } from '../lib/tmdb';
import { storeProviders } from '../lib/providers';
import { ProviderRow } from './Providers';

export default function SearchModal({ existingKeys, onAdd, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(null);
  const [added, setAdded] = useState(new Set());
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('all');

  const keyOf = (r) => `${r.media_type}-${r.tmdb_id}`;

  // Live search, debounced so we don't call TMDB on every keystroke
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try { setResults(await searchTitles(query.trim(), searchType)); setError(''); }
      catch (e) { setError(e.message); }
    }, 350);
    return () => clearTimeout(t);
  }, [query, searchType]);

  const add = async (r) => {
    setBusy(keyOf(r));
    try {
      await onAdd(await getDetails(r.media_type, r.tmdb_id));
      if (r.providers) storeProviders(r.media_type, r.tmdb_id, r.providers);
      setAdded((s) => new Set(s).add(keyOf(r)));
    } catch (e) { setError(e.message); }
    setBusy(null);
  };

  return (
    <Modal title="Add a movie or series" onClose={onClose}>
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
        <input
          autoFocus className="input !pl-11" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title" aria-label="Search movies and series"
        />
      </div>
      <div className="mt-3 flex rounded-full bg-plum p-1" role="tablist" aria-label="Search in">
        {[['all', 'Everything'], ['movie', 'Movies'], ['tv', 'Series']].map(([v, label]) => (
          <button
            key={v} role="tab" aria-selected={searchType === v} onClick={() => setSearchType(v)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${searchType === v ? 'bg-velvet text-blush' : 'text-mist'}`}
          >{label}</button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      <ul className="mt-4 space-y-2">
        {results.map((r) => {
          const k = keyOf(r);
          const have = existingKeys.has(k) || added.has(k);
          return (
            <li key={k} className="flex items-center gap-3 rounded-xl bg-plum p-2">
              <div className="h-16 w-11 shrink-0 overflow-hidden rounded-md bg-velvet">
                {r.poster_path && <img src={posterUrl(r.poster_path, 'w92')} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{r.title}</p>
                <p className="text-sm text-mist">
                  {[r.media_type === 'tv' ? 'Series' : 'Movie', r.year, r.language].filter(Boolean).join(', ')}
                </p>
                {r.director && (
                  <p className="truncate text-xs text-blush">
                    {r.media_type === 'tv' ? 'Created by' : 'Dir.'} {r.director}
                  </p>
                )}
                {r.cast?.length > 0 && (
                  <p className="truncate text-xs text-mist/80">With {r.cast.join(', ')}</p>
                )}
                {r.providers && <div className="mt-1.5"><ProviderRow data={r.providers} small /></div>}
              </div>
              <button className="btn btn-primary shrink-0 !px-3.5 !py-2.5" disabled={have || busy === k} onClick={() => add(r)}>
                {have ? 'On the list' : busy === k ? 'Adding…' : <><Plus size={16} /> Add</>}
              </button>
            </li>
          );
        })}
      </ul>
      {query.trim().length >= 2 && !results.length && !error && (
        <p className="mt-6 text-center text-mist">No matches yet. Try another spelling.</p>
      )}
    </Modal>
  );
}
