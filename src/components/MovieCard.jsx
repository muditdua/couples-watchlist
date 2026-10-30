import { CalendarDays, Check, Heart, MessageSquare, Star, Trash2 } from 'lucide-react';
import { posterUrl } from '../lib/tmdb';
import { fmtRuntime } from '../lib/format';
import { useProviders } from '../hooks/useProviders';
import { ProviderRow } from './Providers';
import { AddedBy } from './Person';
import { FEATURES } from '../config';
import { epsWatched as epsWatchedCount, hasCounts, isWatching, nextUpFromCounts } from '../lib/status';
import { fmtTime, planLabel } from '../lib/plan';

const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

export default function MovieCard({ movie, meId, addedBy, mine, onToggle, onLike, onRemove, onOpen, onOpenProfile }) {
  const poster = posterUrl(movie.poster_path);
  const isSeries = movie.media_type === 'tv';
  const providers = useProviders(movie.media_type, movie.tmdb_id, movie.tmdb_id > 0); // hand-added titles have no TMDB id
  const likes = Object.keys(movie.likes ?? {});
  const iWant = likes.includes(meId);
  const bothWant = likes.length >= 2;
  const eps = epsWatchedCount(movie);
  const watching = isWatching(movie);
  const next = FEATURES.episodeTracking && isSeries && eps > 0 ? nextUpFromCounts(movie.season_counts, movie.episodes_watched) : null;
  const watchingLine = FEATURES.episodeTracking && isSeries && eps > 0 && !movie.watched
    ? (next ? `Next up: S${next.season} E${next.episode}`
      : hasCounts(movie.season_counts) ? 'All episodes watched'
      : `${eps} ${eps === 1 ? 'episode' : 'episodes'} watched`)
    : null;
  const plan = !movie.watched ? planLabel(movie.planned_on) : null;
  const notes = movie.notes?.length ?? 0;
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
          <span className="absolute bottom-2 left-2 rounded-full bg-blush px-2.5 py-1 text-xs font-semibold text-night">
            Watched{movie.watched_at ? ` ${shortDate(movie.watched_at)}` : ''}
          </span>
        )}
        {watching && (
          <span className="absolute bottom-2 left-2 rounded-full bg-ember px-2.5 py-1 text-xs font-semibold text-night">Watching</span>
        )}
        {bothWant && !movie.watched && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-blush px-2.5 py-1 text-xs font-semibold text-night">
            <Heart size={12} fill="currentColor" /> Both want
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {/* The title button stretches over the whole card, so tapping anywhere opens the details */}
        <h3 className="break-words font-display text-base font-semibold leading-snug sm:text-lg">
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
        {watchingLine && <p className="text-xs font-semibold text-ember">{watchingLine}</p>}
        {plan && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ember">
            <CalendarDays size={13} /> {plan}{movie.planned_time ? `, ${fmtTime(movie.planned_time)}` : ''}
          </p>
        )}
        {notes > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-mist"><MessageSquare size={13} /> {notes} {notes === 1 ? 'note' : 'notes'}</p>
        )}
        {movie.tmdb_id > 0 && <div className="pt-1"><ProviderRow data={providers} mine={mine} /></div>}
        {addedBy && <div className="mt-auto pt-2"><AddedBy person={addedBy} onOpen={onOpenProfile ? () => onOpenProfile(addedBy.id) : undefined} /></div>}
        {/* Phones: "Mark watched" gets its own full-width row, with the heart and bin side by side under it */}
        <div className={`relative z-10 grid grid-cols-2 gap-2 pt-3 sm:flex ${addedBy ? '' : 'mt-auto'}`}>
          <button onClick={() => onToggle(movie)} className="btn btn-ghost col-span-2 min-w-0 !px-2 !py-2.5 !text-xs sm:flex-1">
            <Check size={14} className="shrink-0" />
            <span className="truncate">{movie.watched ? 'Watch again' : 'Mark watched'}</span>
          </button>
          <button
            onClick={() => onLike(movie)} aria-pressed={iWant}
            aria-label={iWant ? 'Remove my vote' : 'I want to watch this'}
            className={`btn shrink-0 !gap-1 !px-3 !py-2.5 !text-xs ${iWant ? 'bg-blush text-night' : 'btn-ghost text-mist'}`}
          >
            <Heart size={14} fill={iWant ? 'currentColor' : 'none'} />
            {likes.length > 0 && likes.length}
          </button>
          <button
            onClick={() => onRemove(movie)}
            aria-label={`Remove ${movie.title}`} className="btn btn-ghost shrink-0 !px-3 !py-2.5 text-mist"
          ><Trash2 size={14} /></button>
        </div>
      </div>
    </article>
  );
}
