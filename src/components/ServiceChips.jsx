import { logoUrl } from '../lib/tmdb';

// "Streaming on" filter: only services that at least one title in your list is on
export default function ServiceChips({ providersMap, selected, onToggle, onClear }) {
  const counts = new Map();
  Object.values(providersMap).forEach((d) => {
    if (!d) return;
    [...d.stream, ...d.free].forEach((p) => {
      const cur = counts.get(p.id) ?? { ...p, n: 0 };
      cur.n += 1;
      counts.set(p.id, cur);
    });
  });
  const list = [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 14);
  if (!list.length) return null;

  return (
    <div>
      <p className="mb-2 text-sm text-mist">Streaming on</p>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {selected.size > 0 && (
          <button onClick={onClear} className="shrink-0 rounded-full border border-velvet px-3.5 py-1.5 text-sm text-mist">Clear</button>
        )}
        {list.map((p) => {
          const on = selected.has(p.id);
          return (
            <button
              key={p.id} onClick={() => onToggle(p.id)} aria-pressed={on}
              className={`flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition ${on ? 'border-blush bg-blush/10 text-blush' : 'border-velvet text-mist'}`}
            >
              {logoUrl(p.logo) && <img src={logoUrl(p.logo)} alt="" className="h-6 w-6 rounded-full object-cover" />}
              {p.name}
              <span className="text-xs opacity-70">{p.n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
