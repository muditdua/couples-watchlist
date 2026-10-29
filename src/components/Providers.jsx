import { REGION_NAME, logoUrl } from '../lib/tmdb';

function Logo({ p, small }) {
  const url = logoUrl(p.logo);
  const size = small ? 'h-6 w-6' : 'h-7 w-7';
  return url
    ? <img src={url} alt={p.name} title={p.name} loading="lazy" className={`${size} shrink-0 rounded-md object-cover`} />
    : <span title={p.name} className={`${size} flex shrink-0 items-center justify-center rounded-md bg-velvet text-[10px] text-mist`}>{p.name.slice(0, 2)}</span>;
}

// Compact one-line version used on cards and in search results
export function ProviderRow({ data, small = false }) {
  if (data === undefined) return <div className={small ? 'h-6' : 'h-7'} aria-hidden="true" />;
  if (!data) return null;
  const main = data.stream.length ? data.stream : data.free;
  if (main.length) {
    return (
      <div className="flex items-center gap-1.5" aria-label={`Available on ${main.map((p) => p.name).join(', ')}`}>
        {main.slice(0, 4).map((p) => <Logo key={p.id} p={p} small={small} />)}
        {main.length > 4 && <span className="text-xs text-mist">+{main.length - 4}</span>}
        {!data.stream.length && <span className="text-xs font-semibold text-ember">Free</span>}
      </div>
    );
  }
  return (
    <p className="text-xs text-mist/80">
      {data.rent.length ? 'Rent or buy only' : `Not streaming in ${REGION_NAME}`}
    </p>
  );
}

// Full version with names, used in the detail pane
export function ProviderGroups({ data }) {
  if (data === undefined) return <p className="text-sm text-mist">Checking where to watch…</p>;
  if (!data) return <p className="text-sm text-mist">Couldn't load availability right now.</p>;
  const groups = [['Stream', data.stream], ['Free with ads', data.free], ['Rent or buy', data.rent]].filter(([, l]) => l.length);
  if (!groups.length) return <p className="text-sm text-mist">Not available in {REGION_NAME} right now.</p>;
  return (
    <div className="space-y-3">
      {groups.map(([label, list]) => (
        <div key={label}>
          <p className="mb-1.5 text-xs text-mist">{label}</p>
          <ul className="flex flex-wrap gap-2">
            {list.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-full bg-plum py-1 pl-1 pr-3">
                <Logo p={p} small />
                <span className="text-sm">{p.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {data.link && (
        <a href={data.link} target="_blank" rel="noreferrer" className="inline-block text-sm text-blush underline-offset-4 hover:underline">
          See all options
        </a>
      )}
    </div>
  );
}
