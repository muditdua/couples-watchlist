import { CalendarDays, Settings } from 'lucide-react';
import { Avatar } from './Person';

export default function Header({ total, toWatch, watching, thisYear, people, onOpenProfile, onOpenCalendar, onOpenSettings }) {
  const watched = total - toWatch - watching;
  return (
    <header className="flex items-start justify-between gap-4 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div>
        <h1 className="font-display text-3xl font-semibold leading-none sm:text-5xl">Our Movie Nights</h1>
        <p className="mt-2 text-mist">
          {toWatch} to watch{watching > 0 ? `, ${watching} watching` : ''}, {watched} watched{thisYear > 0 ? ` (${thisYear} this year)` : ''}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex -space-x-2">
          {people.slice(0, 3).map((p) => (
            <button
              key={p.id} onClick={() => onOpenProfile(p.id)} aria-label={`${p.name}'s profile`} title={p.name}
              className="rounded-full ring-2 ring-night transition hover:z-10 hover:ring-blush"
            ><Avatar person={p} size={36} /></button>
          ))}
        </div>
        <button onClick={onOpenCalendar} aria-label="Plans calendar" title="Plans calendar" className="btn btn-ghost !h-11 !w-11 !px-0">
          <CalendarDays size={18} />
        </button>
        <button onClick={onOpenSettings} aria-label="Settings" title="Settings" className="btn btn-ghost !h-11 !w-11 !px-0">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
