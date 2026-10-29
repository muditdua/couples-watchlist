import { Search, X } from 'lucide-react';
import SortMenu from './SortMenu';

const STATUS = [['to-watch', 'To watch'], ['watched', 'Watched'], ['all', 'All']];
const TYPES = [['all', 'Everything', 'All'], ['movie', 'Movies', 'Movies'], ['tv', 'Series', 'Series']];

export default function Filters({
  query, setQuery, status, setStatus, type, setType, genre, setGenre, genres, sort, setSort,
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
        <input
          className="input !pl-11 !pr-11" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search our list" aria-label="Search our list"
        />
        {query && (
          <button
            onClick={() => setQuery('')} aria-label="Clear search"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-3 text-mist hover:bg-velvet"
          ><X size={16} /></button>
        )}
      </div>

      {/* Full-width tabs on phones so nothing overflows; compact from sm up */}
      <div className="grid grid-cols-3 rounded-full bg-plum p-1 sm:w-fit" role="tablist" aria-label="Status">
        {STATUS.map(([v, label]) => (
          <button
            key={v} role="tab" aria-selected={status === v} onClick={() => setStatus(v)}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${status === v ? 'bg-blush text-night' : 'text-mist'}`}
          >{label}</button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-3 rounded-full bg-plum p-1 sm:w-fit sm:flex-none" role="tablist" aria-label="Type">
          {TYPES.map(([v, label, short]) => (
            <button
              key={v} role="tab" aria-selected={type === v} onClick={() => setType(v)}
              className={`rounded-full px-3 py-2.5 text-sm font-semibold transition sm:px-4 ${type === v ? 'bg-velvet text-blush' : 'text-mist'}`}
            >
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        <div className="sm:ml-auto"><SortMenu value={sort} onChange={setSort} /></div>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {['All', ...genres].map((g) => {
          const active = (g === 'All' && genre === 'all') || g === genre;
          return (
            <button
              key={g} onClick={() => setGenre(g === 'All' ? 'all' : g)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${active ? 'border-blush text-blush' : 'border-velvet text-mist'}`}
            >{g}</button>
          );
        })}
      </div>
    </div>
  );
}
