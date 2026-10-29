import { LogOut } from 'lucide-react';

export default function Header({ total, toWatch, onSignOut }) {
  return (
    <header className="flex items-start justify-between gap-4 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div>
        <h1 className="font-display text-4xl font-semibold leading-none sm:text-5xl">Our Movie Nights</h1>
        <p className="mt-2 text-mist">{toWatch} to watch, {total - toWatch} watched</p>
      </div>
      <button onClick={onSignOut} className="btn btn-ghost !px-3" aria-label="Sign out"><LogOut size={16} /></button>
    </header>
  );
}