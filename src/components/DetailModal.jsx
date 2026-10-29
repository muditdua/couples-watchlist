import { useEffect, useState } from 'react';
import { Check, ChevronDown, Star } from 'lucide-react';
import Modal from './Modal';
import { ProviderGroups } from './Providers';
import { REGION_NAME, getFullDetails, getSeason, posterUrl } from '../lib/tmdb';
import { fmtRuntime } from '../lib/format';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

function Season({ tvId, season }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ loading: false, list: null, error: '' });

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !state.list && !state.loading) {
      setState({ loading: true, list: null, error: '' });
      try { setState({ loading: false, list: await getSeason(tvId, season.number), error: '' }); }
      catch (e) { setState({ loading: false, list: null, error: e.message }); }
    }
  };

  return (
    <li className="overflow-hidden rounded-2xl bg-plum">
      <button
        onClick={toggle} aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span>
          <span className="block font-semibold">{season.name}</span>
          <span className="text-sm text-mist">
            {season.episodes} {season.episodes === 1 ? 'episode' : 'episodes'}{season.year ? `, ${season.year}` : ''}
          </span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-mist transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-velvet">
          {state.loading && <p className="p-4 text-sm text-mist">Loading episodes…</p>}
          {state.error && <p className="p-4 text-sm text-red-300">{state.error}</p>}
          <ol>
            {state.list?.map((e) => {
              const upcoming = e.airDate && new Date(e.airDate) > new Date();
              const still = posterUrl(e.still, 'w300');
              return (
                <li key={e.id} className="flex gap-3 border-b border-velvet/60 p-3 last:border-0">
                  <div className="h-[54px] w-24 shrink-0 overflow-hidden rounded-lg bg-velvet">
                    {still && <img src={still} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-semibold">{e.number}. {e.name}</p>
                      <span className="shrink-0 text-xs text-mist">{e.runtime ? fmtRuntime(e.runtime) : ''}</span>
                    </div>
                    {upcoming && <p className="text-xs text-ember">Airs {fmtDate(e.airDate)}</p>}
                    {e.overview && <p className="mt-0.5 line-clamp-2 text-xs text-mist">{e.overview}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </li>
  );
}

export default function DetailModal({ movie, onToggle, onClose }) {
  const isSeries = movie.media_type === 'tv';
  const byHand = movie.tmdb_id < 0; // added manually, so nothing to look up on TMDB
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (byHand) return undefined;
    let on = true;
    setD(null); setError('');
    getFullDetails(movie.media_type, movie.tmdb_id)
      .then((v) => on && setD(v))
      .catch((e) => on && setError(e.message));
    return () => { on = false; };
  }, [movie.media_type, movie.tmdb_id, byHand]);

  const poster = posterUrl(movie.poster_path, 'w342');
  const director = d?.director || movie.director;
  const cast = d?.cast?.length ? d.cast : movie.cast_names ?? [];

  return (
    <Modal title={movie.title} onClose={onClose} wide>
      <div className="flex gap-4">
        <div className="aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-xl bg-velvet sm:w-36">
          {poster && <img src={poster} alt={`${movie.title} poster`} className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-sm text-mist">
            {[isSeries ? 'Series' : 'Movie', movie.year].filter(Boolean).join(', ')}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {movie.rating > 0 && (
              <span className="flex items-center gap-1 font-semibold text-ember"><Star size={14} fill="currentColor" /> {movie.rating}</span>
            )}
            <span className="font-semibold">{fmtRuntime(movie.runtime)}{isSeries && movie.runtime ? ' per episode' : ''}</span>
            {isSeries && movie.seasons > 0 && <span className="text-mist">{movie.seasons} {movie.seasons === 1 ? 'season' : 'seasons'}</span>}
          </p>
          {movie.genres?.length > 0 && <p className="text-sm text-blush">{movie.genres.join(', ')}</p>}
          {d?.tagline && <p className="font-display text-sm italic text-mist">{d.tagline}</p>}
          <button onClick={() => onToggle(movie)} className="btn btn-ghost !py-2 !text-xs">
            <Check size={14} /> {movie.watched ? 'Watched. Watch again?' : 'Mark watched'}
          </button>
        </div>
      </div>

      {byHand ? (
        <p className="mt-6 rounded-xl bg-plum p-4 text-sm text-mist">
          You added this one yourself, so there's no summary or streaming info to show.
        </p>
      ) : (
        <>
          <section className="mt-6">
            <h3 className="mb-1.5 font-display text-lg font-semibold">Summary</h3>
            {error ? <p className="text-sm text-red-300">Couldn't load details: {error}</p>
              : !d ? <p className="text-sm text-mist">Loading…</p>
              : <p className="text-sm leading-relaxed text-stone-200">{d.overview || 'TMDB has no summary for this one yet.'}</p>}
          </section>

          {(director || cast.length > 0) && (
            <section className="mt-5 space-y-1 text-sm">
              {director && <p><span className="text-mist">{isSeries ? 'Created by' : 'Directed by'}</span> {director}</p>}
              {cast.length > 0 && <p><span className="text-mist">Starring</span> {cast.join(', ')}</p>}
            </section>
          )}

          <section className="mt-6">
            <h3 className="mb-2 font-display text-lg font-semibold">Where to watch in {REGION_NAME}</h3>
            <ProviderGroups data={error ? null : d ? d.providers : undefined} />
          </section>

          {isSeries && d && d.seasons.length > 0 && (
            <section className="mt-6">
              <h3 className="mb-2 font-display text-lg font-semibold">Seasons and episodes</h3>
              <ul className="space-y-2">
                {d.seasons.map((s) => <Season key={s.number} tvId={movie.tmdb_id} season={s} />)}
              </ul>
            </section>
          )}

          <p className="mt-8 text-xs text-mist/70">Details from TMDB. Streaming availability from JustWatch.</p>
        </>
      )}
    </Modal>
  );
}
