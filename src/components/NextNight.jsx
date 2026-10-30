import { CalendarDays } from 'lucide-react';
import { posterUrl } from '../lib/tmdb';
import { countdown, daysUntil, fmtPlanDate, fmtTime } from '../lib/plan';

// A banner for the soonest planned night
export default function NextNight({ movies, onOpen }) {
  const next = movies
    .filter((m) => !m.watched && m.planned_on && daysUntil(m.planned_on) >= 0)
    .sort((a, b) => a.planned_on.localeCompare(b.planned_on) || (a.planned_time || '').localeCompare(b.planned_time || ''))[0];
  if (!next) return null;
  const poster = posterUrl(next.poster_path, 'w92');
  return (
    <button onClick={() => onOpen(next)} className="flex w-full items-center gap-3 rounded-2xl bg-plum p-3 text-left transition hover:bg-velvet">
      <div className="h-[60px] w-10 shrink-0 overflow-hidden rounded-lg bg-velvet">
        {poster && <img src={poster} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ember"><CalendarDays size={13} /> Next movie night</p>
        <p className="truncate font-display text-lg font-semibold leading-snug">{next.title}</p>
        <p className="text-sm text-mist">
          {fmtPlanDate(next.planned_on)}{next.planned_time ? ` at ${fmtTime(next.planned_time)}` : ''}. {countdown(next.planned_on)}
        </p>
      </div>
    </button>
  );
}
