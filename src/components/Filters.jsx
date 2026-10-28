const STATUS = [['to-watch', 'To watch'], ['watched', 'Watched'], ['all', 'All']];
const TYPES = [['all', 'Everything'], ['movie', 'Movies'], ['tv', 'Series']];

export default function Filters({ status, setStatus, type, setType, genre, setGenre, genres, sort, setSort }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-full bg-plum p-1" role="tablist">
          {STATUS.map(([v, label]) => (
            <button
              key={v} role="tab" aria-selected={status === v} onClick={() => setStatus(v)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${status === v ? 'bg-blush text-night' : 'text-mist'}`}
            >{label}</button>
          ))}
        </div>
        <select
          value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort"
          className="rounded-full border border-velvet bg-plum px-3 py-2.5 text-sm text-stone-100"
        >
          <option value="shortest">Shortest first</option>
          <option value="rating">Highest rated</option>
          <option value="newest">Recently added</option>
        </select>
      </div>
      <div className="flex rounded-full bg-plum p-1 sm:w-fit" role="tablist">
        {TYPES.map(([v, label]) => (
          <button
            key={v} role="tab" aria-selected={type === v} onClick={() => setType(v)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none ${type === v ? 'bg-velvet text-blush' : 'text-mist'}`}
          >{label}</button>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {['All', ...genres].map((g) => {
          const active = (g === 'All' && genre === 'all') || g === genre;
          return (
            <button
              key={g} onClick={() => setGenre(g === 'All' ? 'all' : g)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition ${active ? 'border-blush text-blush' : 'border-velvet text-mist'}`}
            >{g}</button>
          );
        })}
      </div>
    </div>
  );
}
