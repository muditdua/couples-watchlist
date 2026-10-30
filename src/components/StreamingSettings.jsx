import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import RegionPicker from './RegionPicker';
import { REGION_NAME, getProviderCatalog, logoUrl } from '../lib/tmdb';

export default function StreamingSettings({ myServices, onSave }) {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    let on = true;
    getProviderCatalog().then((v) => on && setCatalog(v)).catch((e) => on && setError(e.message));
    return () => { on = false; };
  }, []);

  const mine = new Set(myServices);
  const toggle = (id) => {
    const next = new Set(mine);
    if (next.has(id)) next.delete(id); else next.add(id);
    onSave([...next]);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-mist">Country for "where to watch" (this device)</p>
          <p className="font-semibold">{REGION_NAME}</p>
        </div>
        <button onClick={() => setPicking(true)} className="btn btn-ghost !py-2.5">Change country</button>
      </div>

      <p className="mb-2 mt-5 text-sm text-mist">My services</p>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {!catalog && !error && <p className="text-sm text-mist">Loading services…</p>}
      <div className="flex flex-wrap gap-2">
        {catalog?.map((p) => {
          const on = mine.has(p.id);
          return (
            <button
              key={p.id} onClick={() => toggle(p.id)} aria-pressed={on}
              className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition ${on ? 'border-blush bg-blush/10 text-blush' : 'border-velvet text-mist'}`}
            >
              {logoUrl(p.logo) && <img src={logoUrl(p.logo)} alt="" className="h-7 w-7 rounded-full object-cover" />}
              {p.name}
              {on && <Check size={14} />}
            </button>
          );
        })}
      </div>
      {picking && <RegionPicker onClose={() => setPicking(false)} />}
    </>
  );
}
