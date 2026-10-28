import { useState } from 'react';
import { Link2, LogOut } from 'lucide-react';

export default function Header({ room, total, toWatch, onLeave }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(room)}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt('Copy this link:', url); }
  };
  return (
    <header className="pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-none sm:text-5xl">Our Movie Nights</h1>
          <p className="mt-2 text-mist">{toWatch} to watch, {total - toWatch} watched</p>
        </div>
        <div className="flex gap-2">
          <button onClick={share} className="btn btn-ghost !px-3" aria-label="Copy invite link">
            <Link2 size={16} /> {copied ? 'Copied' : 'Invite'}
          </button>
          <button onClick={onLeave} className="btn btn-ghost !px-3" aria-label="Switch room"><LogOut size={16} /></button>
        </div>
      </div>
    </header>
  );
}
