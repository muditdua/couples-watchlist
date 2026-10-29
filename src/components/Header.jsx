import { LogOut } from 'lucide-react';

export default function Header({ total, toWatch, thisYear, name, onEditName, onSignOut }) {
  const watched = total - toWatch;
  return (
    <header className="flex items-start justify-between gap-4 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div>
        <h1 className="font-display text-3xl font-semibold leading-none sm:text-5xl">Our Movie Nights</h1>
        <p className="mt-2 text-mist">
          {toWatch} to watch, {watched} watched{thisYear > 0 ? ` (${thisYear} this year)` : ''}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <button onClick={onSignOut} className="btn btn-ghost !h-11 !w-11 !px-0" aria-label="Sign out"><LogOut size={16} /></button>
        <button onClick={onEditName} className="max-w-[8rem] truncate text-xs text-mist underline-offset-4 hover:underline" title="Change your name">{name}</button>
      </div>
    </header>
  );
}
