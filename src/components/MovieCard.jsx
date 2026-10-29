import { Check, Star, Trash2 } from 'lucide-react';
import { posterUrl } from '../lib/tmdb';
import { fmtRuntime } from '../lib/format';
import { useProviders } from '../hooks/useProviders';
import { ProviderRow } from './Providers';

export default function MovieCard({ movie, onToggle, onRemove, onOpen }) {
  const poster = posterUrl(movie.poster_path);
  const isSeries = movie.media_type === 'tv';
  const providers = useProviders(movie.media_type, movie.tmdb_id, movie.tmdb_id > 0); // hand-added titles have no TMDB id
  const people = [
    movie.director && `${isSeries ? 'Created by' : 'Dir.'} ${movie.director}`,
    movie.cast_names?.slice(0, 2).join(', '),
  ].filter(Boolean);

  return (
    <article className={`relative flex flex-col overflow-hidden rounded-2xl bg-plum ${movie.watched ? 'opacity-70' : ''}`}>
      <div className="relative aspect-[2/3] bg-velvet">
        {poster
          ? <img src={poster} alt={`${movie.title} poster`} loading="lazy" className="h-full w-full object-cover" />
          : <div className="flex h-full items-center justify-center p-4 text-center font-display text-lg text-mist">{movie.title}</div>}
        {movie.rating > 0 && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-night/85 px-2.5 py-1 text-sm font-semibold text-ember">
            <Star size={13} fill="currentColor" /> {movie.rating}
          </span>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-night/85 px-2.5 py-1 text-xs font-semibold text-blush">
          {isSeries ? 'Series' : 'Movie'}
        </span>
        {movie.watched && (
          <span className="absolute bottom-2 left-2 rounded-full bg-blush px-2.5 py-1 text-xs font-semibold text-night">Watched</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {/* The title button stretches over the whole card, so tapping anywhere opens the details */}
        <h3 className="font-display text-lg font-semibold leading-snug">
          <button
            onClick={() => onOpen(movie)}
            className="text-left after:absolute after:inset-0 after:content-['']"
            aria-label={`Open details for ${movie.title}`}
          >{movie.title}</button>
        </h3>
        <div className="flex flex-wrap gap-x-3 text-sm text-mist">
          <span className="font-semibold text-stone-100">
            {fmtRuntime(movie.runtime)}{isSeries && movie.runtime ? ' per episode' : ''}
          </span>
          {movie.year && <span>{movie.year}</span>}
          {isSeries && movie.seasons > 0 && <span>{movie.seasons} {movie.seasons === 1 ? 'season' : 'seasons'}</span>}
        </div>
        {movie.genres?.length > 0 && <p className="text-sm text-blush">{movie.genres.slice(0, 3).join(', ')}</p>}
        {people.map((p) => <p key={p} className="text-xs text-mist">{p}</p>)}
        {movie.tmdb_id > 0 && <div className="pt-1"><ProviderRow data={providers} /></div>}
        <div className="relative z-10 mt-auto flex gap-2 pt-3">
          <button onClick={() => onToggle(movie)} className="btn btn-ghost flex-1 !py-2 !text-xs">
            <Check size={14} /> {movie.watched ? 'Watch again' : 'Mark watched'}
          </button>
          <button
            onClick={() => onRemove(movie)}
            aria-label={`Remove ${movie.title}`} className="btn btn-ghost !px-3 !py-2 text-mist"
          ><Trash2 size={14} /></button>
        </div>
      </div>
    </article>
  );
}
