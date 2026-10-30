import { useMemo, useState } from 'react';
import { ArrowLeft, CalendarPlus, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import Modal from './Modal';
import { posterUrl } from '../lib/tmdb';
import { fmtPlanDate, fmtTime, todayYmd } from '../lib/plan';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ymd = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function PlanPicker({ day, movies, onPick, onClose }) {
  const [q, setQ] = useState('');
  const list = movies
    .filter((m) => !m.watched && m.planned_on !== day && m.title.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => Object.keys(b.likes ?? {}).length - Object.keys(a.likes ?? {}).length || new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50);
  return (
    <Modal title={`Plan ${fmtPlanDate(day)}`} onClose={onClose}>
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
        <input className="input !pl-11" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your list" aria-label="Search your list" autoFocus />
      </div>
      <ul className="mt-3 space-y-2 pb-2">
        {list.map((m) => (
          <li key={m.id}>
            <button onClick={() => onPick(m)} className="flex w-full items-center gap-3 rounded-xl bg-plum p-2 text-left transition hover:bg-velvet">
              <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-velvet">
                {m.poster_path && <img src={posterUrl(m.poster_path, 'w92')} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="font-semibold leading-snug">{m.title}</p>
                <p className="text-xs text-mist">{m.media_type === 'tv' ? 'Series' : 'Movie'}{m.year ? `, ${m.year}` : ''}{m.planned_on ? `, planned ${fmtPlanDate(m.planned_on)}` : ''}</p>
              </div>
            </button>
          </li>
        ))}
        {!list.length && <li className="p-3 text-sm text-mist">Nothing left on your list to plan.</li>}
      </ul>
    </Modal>
  );
}

export default function CalendarPage({ movies, onBack, onOpenTitle, onSetDate }) {
  const today = todayYmd();
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(today);
  const [picking, setPicking] = useState(false);

  const byDay = useMemo(() => {
    const map = {};
    movies.filter((m) => m.planned_on).forEach((m) => { map[m.planned_on] = [...(map[m.planned_on] ?? []), m]; });
    Object.values(map).forEach((l) => l.sort((a, b) => (a.planned_time || '').localeCompare(b.planned_time || '')));
    return map;
  }, [movies]);

  const first = new Date(cursor.y, cursor.m, 1);
  const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const shift = (n) => setCursor(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const dayList = byDay[selected] ?? [];

  // Moving a plan follows it to the new date
  const move = (movie, to) => {
    onSetDate(movie, to);
    if (to) {
      setSelected(to);
      const d = new Date(`${to}T12:00:00`);
      setCursor({ y: d.getFullYear(), m: d.getMonth() });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pb-20 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3 pt-2">
        <button onClick={onBack} aria-label="Back to the list" className="btn btn-ghost !h-11 !w-11 !px-0"><ArrowLeft size={18} /></button>
        <h1 className="font-display text-3xl font-semibold">Plans</h1>
      </header>

      <div className="flex items-center justify-between">
        <button onClick={() => shift(-1)} aria-label="Previous month" className="btn btn-ghost !h-11 !w-11 !px-0"><ChevronLeft size={18} /></button>
        <h2 className="font-display text-xl font-semibold">{first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
        <button onClick={() => shift(1)} aria-label="Next month" className="btn btn-ghost !h-11 !w-11 !px-0"><ChevronRight size={18} /></button>
      </div>

      <div>
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-mist">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`blank-${i}`} />;
            const key = ymd(cursor.y, cursor.m, d);
            const plans = byDay[key] ?? [];
            const lead = plans[0];
            const poster = lead && posterUrl(lead.poster_path, 'w185');
            return (
              <button
                key={key} onClick={() => setSelected(key)} aria-pressed={key === selected}
                aria-label={`${fmtPlanDate(key)}${plans.length ? `, ${plans.length} planned` : ''}`}
                className={`relative aspect-square overflow-hidden rounded-xl bg-plum text-left transition ${key === selected ? 'ring-2 ring-blush' : ''}`}
              >
                {poster && <img src={poster} alt="" className={`absolute inset-0 h-full w-full object-cover ${lead.watched ? 'opacity-40' : 'opacity-80'}`} />}
                <span className={`relative m-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold ${key === today ? 'bg-blush text-night' : poster ? 'bg-night/70 text-stone-100' : 'text-stone-100'}`}>{d}</span>
                {plans.length > 1 && <span className="absolute bottom-1 right-1 rounded-full bg-night/85 px-1.5 text-[10px] font-semibold text-ember">+{plans.length - 1}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold">{fmtPlanDate(selected)}</h2>
        {dayList.length ? (
          <ul className="mt-3 space-y-2">
            {dayList.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-plum p-3">
                <button onClick={() => onOpenTitle(m)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-velvet">
                    {m.poster_path && <img src={posterUrl(m.poster_path, 'w92')} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <span className="min-w-0">
                    <span className="block font-semibold leading-snug">{m.title}</span>
                    <span className="text-xs text-mist">{m.watched ? 'Watched' : m.planned_time ? `At ${fmtTime(m.planned_time)}` : 'Any time'}</span>
                  </span>
                </button>
                <input
                  type="date" value={m.planned_on} aria-label={`Move ${m.title} to another day`}
                  onChange={(e) => e.target.value && move(m, e.target.value)}
                  className="w-[9.5rem] shrink-0 rounded-xl border border-velvet bg-night px-2 py-2 text-xs text-stone-100"
                />
                <button onClick={() => onSetDate(m, null)} aria-label={`Clear the plan for ${m.title}`} className="shrink-0 rounded-full p-2 text-mist hover:bg-velvet"><X size={16} /></button>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-mist">Nothing planned for this day.</p>}
        <button onClick={() => setPicking(true)} className="btn btn-primary mt-4"><CalendarPlus size={16} /> Plan something</button>
      </section>

      {picking && <PlanPicker day={selected} movies={movies} onPick={(m) => { onSetDate(m, selected); setPicking(false); }} onClose={() => setPicking(false)} />}
    </div>
  );
}
