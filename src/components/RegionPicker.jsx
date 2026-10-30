import { useEffect, useState } from 'react';
import { Check, Search } from 'lucide-react';
import Modal from './Modal';
import { REGION, getRegions } from '../lib/tmdb';

// Picks the country used for "where to watch". Saved on this device, then the page reloads to refresh the logos.
export default function RegionPicker({ onClose }) {
  const [regions, setRegions] = useState(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let on = true;
    getRegions().then((r) => on && setRegions(r)).catch((e) => on && setError(e.message));
    return () => { on = false; };
  }, []);

  const choose = (code) => {
    if (code === REGION) { onClose(); return; }
    try { localStorage.setItem('region', code); } catch { /* ignore */ }
    setSwitching(true);
    window.location.reload();
  };

  const shown = (regions ?? []).filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Modal title="Streaming country" onClose={onClose}>
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
        <input className="input !pl-11" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search countries" aria-label="Search countries" autoFocus />
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {switching && <p className="mt-3 text-sm text-mist">Switching…</p>}
      <ul className="mt-3 space-y-1 pb-2">
        {!regions && !error && <li className="p-3 text-sm text-mist">Loading countries…</li>}
        {shown.map((r) => (
          <li key={r.code}>
            <button
              onClick={() => choose(r.code)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition hover:bg-velvet ${r.code === REGION ? 'font-semibold text-blush' : ''}`}
            >
              {r.name}
              {r.code === REGION && <Check size={16} />}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
