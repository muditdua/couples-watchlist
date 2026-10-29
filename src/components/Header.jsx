import { Avatar } from './Person';

export default function Header({ total, toWatch, thisYear, me, onOpenSettings }) {
  const watched = total - toWatch;
  return (
    <header className="flex items-start justify-between gap-4 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div>
        <h1 className="font-display text-3xl font-semibold leading-none sm:text-5xl">Our Movie Nights</h1>
        <p className="mt-2 text-mist">
          {toWatch} to watch, {watched} watched{thisYear > 0 ? ` (${thisYear} this year)` : ''}
        </p>
      </div>
      <button
        onClick={onOpenSettings} aria-label="Open settings" title="Settings"
        className="shrink-0 rounded-full ring-2 ring-velvet transition hover:ring-blush"
      >
        <Avatar person={me} size={44} />
      </button>
    </header>
  );
}
