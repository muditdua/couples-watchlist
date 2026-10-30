import { CalendarDays, Settings } from 'lucide-react';
import { Avatar } from './Person';

export default function Header({ total, toWatch, watching, thisYear, people, onOpenProfile, onOpenCalendar, onOpenSettings }) {
  const watched = total - toWatch - watching;
  const iconBtn = 'btn btn-ghost !h-10 !w-10 !px-0 sm:!h-11 sm:!w-11';
  return (
    <header className="pt-[max(1.25rem,env(safe-area-inset-top))]">
      {/* Row 1: the title always stays on one line, with the two tools beside it */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="whitespace-nowrap font-display text-2xl font-semibold leading-none sm:text-5xl">Our Movie Nights</h1>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={onOpenCalendar} aria-label="Plans calendar" title="Plans calendar" className={iconBtn}><CalendarDays size={18} /></button>
          <button onClick={onOpenSettings} aria-label="Settings" title="Settings" className={iconBtn}><Settings size={18} /></button>
        </div>
      </div>

      {/* Row 2: counts on the left, the two of you on the right */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm text-mist sm:text-base">
          {toWatch} to watch{watching > 0 ? `, ${watching} watching` : ''}, {watched} watched
          {thisYear > 0 && <span className="hidden sm:inline">{` (${thisYear} this year)`}</span>}
        </p>
        <div className="flex shrink-0 -space-x-2">
          {people.slice(0, 3).map((p) => (
            <button
              key={p.id} onClick={() => onOpenProfile(p.id)} aria-label={`${p.name}'s profile`} title={p.name}
              className="rounded-full ring-2 ring-night transition hover:z-10 hover:ring-blush"
            ><Avatar person={p} size={34} /></button>
          ))}
        </div>
      </div>
    </header>
  );
}
