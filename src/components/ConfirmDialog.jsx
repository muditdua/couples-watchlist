import { useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { posterUrl } from '../lib/tmdb';

export default function ConfirmDialog({ movie, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const poster = posterUrl(movie.poster_path, 'w185');

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={onCancel}
    >
      <div
        role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-velvet bg-night p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex gap-4">
          <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-velvet">
            {poster && <img src={poster} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0">
            <h2 id="confirm-title" className="font-display text-xl font-semibold leading-snug">
              Remove {movie.title}?
            </h2>
            <p className="mt-1 text-sm text-mist">
              It will disappear from your shared list on both phones.
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button autoFocus onClick={onCancel} className="btn btn-ghost flex-1">Keep it</button>
          <button onClick={onConfirm} className="btn flex-1 bg-rose-300 text-night hover:bg-rose-200">
            <Trash2 size={16} /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}