import { useEffect, useState } from 'react';
import { CalendarPlus, Check, ChevronDown, Heart, Play, Plus, Star, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { ProviderGroups } from './Providers';
import { REGION_NAME, getDetails, getFullDetails, getSeason, posterUrl } from '../lib/tmdb';
import { fmtRuntime } from '../lib/format';
import { Avatar, PersonName } from './Person';
import { FEATURES } from '../config';
import { EpisodeSkeleton, Lines } from './Skeleton';
import { countdown, fmtPlanDate, fmtTime } from '../lib/plan';
import { downloadCalendarEvent } from '../lib/calendar';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

// First episode (outside Specials) that isn't ticked yet
function nextUp(seasons, watched) {
  for (const s of seasons) {
    if (s.number === 0) continue;
    const have = new Set(watched?.[s.number] ?? []);
    for (let e = 1; e <= s.episodes; e += 1) if (!have.has(e)) return { season: s.number, episode: e };
  }
  return null;
}

function Season({ tvId, season, open, onToggle, tracking, watched, onEpisode, onMarkAll }) {
  const [state, setState] = useState({ loading: false, list: null, error: '' });

  // Episodes are fetched the first time a season is opened
  useEffect(() => {
    if (!open || state.list || state.loading) return;
    setState({ loading: true, list: null, error: '' });
    getSeason(tvId, season.number)
      .then((list) => setState({ loading: false, list, error: '' }))
      .catch((e) => setState({ loading: false, list: null, error: e.message }));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const done = watched.length;
  const allDone = done >= season.episodes;

  return (
    <li className="overflow-hidden rounded-2xl bg-plum">
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
        <span>
          <span className="block font-semibold">{season.name}</span>
          <span className="text-sm text-mist">
            {season.episodes} {season.episodes === 1 ? 'episode' : 'episodes'}{season.year ? `, ${season.year}` : ''}
            {tracking && done > 0 && <span className="text-ember">{`, ${done} watched`}</span>}
          </span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-mist transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-velvet">
          {tracking && (
            <div className="flex justify-end px-3 pt-3">
              <button onClick={() => onMarkAll(!allDone)} className="btn btn-ghost !px-3 !py-1.5 !text-xs">
                <Check size={13} /> {allDone ? 'Clear this season' : 'Mark season watched'}
              </button>
            </div>
          )}
          {state.loading && <EpisodeSkeleton />}
          {state.error && <p className="p-4 text-sm text-red-300">{state.error}</p>}
          <ol>
            {state.list?.map((e) => {
              const upcoming = e.airDate && new Date(e.airDate) > new Date();
              const still = posterUrl(e.still, 'w300');
              const seen = watched.includes(e.number);
              return (
                <li key={e.id} className="flex gap-3 border-b border-velvet/60 p-3 last:border-0">
                  <div className="h-[54px] w-24 shrink-0 overflow-hidden rounded-lg bg-velvet">
                    {still && <img src={still} alt="" loading="lazy" className={`h-full w-full object-cover ${seen ? 'opacity-50' : ''}`} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="break-words text-sm font-semibold">{e.number}. {e.name}</p>
                      <span className="shrink-0 text-xs text-mist">{e.runtime ? fmtRuntime(e.runtime) : ''}</span>
                    </div>
                    {upcoming && <p className="text-xs text-ember">Airs {fmtDate(e.airDate)}</p>}
                    {e.overview && <p className="mt-0.5 text-xs leading-relaxed text-mist">{e.overview}</p>}
                  </div>
                  {tracking && (
                    <button
                      onClick={() => onEpisode(e.number)} disabled={upcoming}
                      aria-pressed={seen} aria-label={`${seen ? 'Unmark' : 'Mark'} episode ${e.number} as watched`}
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition disabled:opacity-30 ${seen ? 'border-blush bg-blush text-night' : 'border-velvet text-mist'}`}
                    ><Check size={15} /></button>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </li>
  );
}

function PersonLink({ person, onOpen, children }) {
  if (!person.id) return <span className="inline-flex items-center gap-2">{children}</span>;
  return (
    <button onClick={() => onOpen(person)} className="inline-flex items-center gap-2 rounded-full hover:underline">
      {children}
    </button>
  );
}

function Notes({ notes, people, meId, onAdd, onRemove }) {
  const [text, setText] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text);
    setText('');
  };
  return (
    <section className="mt-6">
      <h3 className="mb-2 font-display text-lg font-semibold">Notes</h3>
      {notes.length > 0 && (
        <ul className="mb-3 space-y-2">
          {notes.map((n) => {
            const p = people.byId(n.by_id, n.by);
            return (
              <li key={n.id} className="flex gap-3 rounded-2xl bg-plum p-3">
                <Avatar person={p} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-mist"><PersonName person={p} />, {fmtDate(n.at)}</p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{n.text}</p>
                </div>
                {n.by_id === meId && (
                  <button onClick={() => onRemove(n.id)} aria-label="Delete note" className="self-start rounded-full p-2 text-mist hover:bg-velvet">
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={submit} className="flex gap-2">
        <input
          className="input !py-2.5" value={text} onChange={(e) => setText(e.target.value)} maxLength={280}
          placeholder="Add a note, like who recommended it" aria-label="Add a note"
        />
        <button className="btn btn-primary shrink-0 !py-2.5" disabled={!text.trim()}>Add</button>
      </form>
    </section>
  );
}

function SimilarCard({ item, have, onAdd }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const add = async () => {
    setBusy(true);
    try { await onAdd(await getDetails(item.media_type, item.tmdb_id)); setDone(true); } catch { /* shown as unchanged */ }
    setBusy(false);
  };
  const on = have || done;
  return (
    <li className="w-28 shrink-0">
      <div className="aspect-[2/3] overflow-hidden rounded-xl bg-velvet">
        <img src={posterUrl(item.poster_path, 'w185')} alt={`${item.title} poster`} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-snug">{item.title}</p>
      {item.year && <p className="text-xs text-mist">{item.year}</p>}
      <button onClick={add} disabled={on || busy} className="btn btn-ghost mt-1.5 w-full !px-2 !py-1.5 !text-xs">
        {on ? 'On the list' : busy ? 'Adding…' : <><Plus size={13} /> Add</>}
      </button>
    </li>
  );
}

export default function DetailModal({ movie, meId, people, existingKeys, actions, onRemove, onClose }) {
  const isSeries = movie.media_type === 'tv';
  const byHand = movie.tmdb_id < 0; // added manually, so nothing to look up on TMDB
  const tracking = FEATURES.episodeTracking && isSeries;
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [openSeasons, setOpenSeasons] = useState(new Set());
  const [showTrailer, setShowTrailer] = useState(false);
  const [planDate, setPlanDate] = useState(movie.planned_on ?? '');
  const [planTime, setPlanTime] = useState(movie.planned_time ?? '');
  useEffect(() => { setPlanDate(movie.planned_on ?? ''); setPlanTime(movie.planned_time ?? ''); }, [movie.planned_on, movie.planned_time]);

  useEffect(() => {
    if (byHand) return undefined;
    let on = true;
    setD(null); setError(''); setOpenSeasons(new Set());
    getFullDetails(movie.media_type, movie.tmdb_id)
      .then((v) => on && setD(v))
      .catch((e) => on && setError(e.message));
    return () => { on = false; };
  }, [movie.media_type, movie.tmdb_id, byHand]);

  useEffect(() => {
    if (!tracking || !d?.seasons?.length) return;
    const counts = Object.fromEntries(d.seasons.filter((s) => s.number > 0).map((s) => [s.number, s.episodes]));
    const have = movie.season_counts ?? {};
    const same = Object.keys(counts).length === Object.keys(have).length && Object.entries(counts).every(([k, v]) => have[k] === v);
    if (!same) actions.patch(movie, { season_counts: counts });
  }, [d]); // eslint-disable-line react-hooks/exhaustive-deps

  const poster = posterUrl(movie.poster_path, 'w342');
  const director = d?.director || movie.director;
  const cast = d?.cast?.length ? d.cast : movie.cast_names ?? [];
  const adder = people.adder(movie);
  const likers = people.likers(movie);
  const iWant = Object.keys(movie.likes ?? {}).includes(meId);
  const watchedMap = movie.episodes_watched ?? {};
  const epsDone = Object.values(watchedMap).reduce((n, a) => n + a.length, 0);
  const next = tracking && d ? nextUp(d.seasons, watchedMap) : null;
  const today = new Date().toLocaleDateString('en-CA');

  const openTrailer = () => {
    if (d?.trailer) { setShowTrailer(true); return; }
    const q = encodeURIComponent(`${movie.title} ${movie.year ?? ''} trailer`);
    window.open(`https://www.youtube.com/results?search_query=${q}`, '_blank', 'noopener');
  };
  const savePlan = () => actions.patch(movie, { planned_on: planDate || null, planned_time: planDate ? planTime || null : null });
  const clearPlan = () => { setPlanDate(''); setPlanTime(''); actions.patch(movie, { planned_on: null, planned_time: null }); };

  const toggleSeason = (n) => setOpenSeasons((s) => {
    const c = new Set(s);
    if (c.has(n)) c.delete(n); else c.add(n);
    return c;
  });

  return (
    <>
    <Modal title={movie.title} onClose={onClose} wide>
      <div className="flex gap-4">
        <button
          onClick={openTrailer} aria-label={`Watch the trailer for ${movie.title}`}
          className="group relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-xl bg-velvet sm:w-36"
        >
          {poster && <img src={poster} alt={`${movie.title} poster`} className="h-full w-full object-cover" />}
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-night/85 py-2 text-xs font-semibold text-stone-100 transition group-hover:bg-blush group-hover:text-night">
            <Play size={13} fill="currentColor" /> Trailer
          </span>
        </button>
        <div className="min-w-0 space-y-2">
          <p className="text-sm text-mist">{[isSeries ? 'Series' : 'Movie', movie.year].filter(Boolean).join(', ')}</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {movie.rating > 0 && (
              <span className="flex items-center gap-1 font-semibold text-ember"><Star size={14} fill="currentColor" /> {movie.rating}</span>
            )}
            <span className="font-semibold">{fmtRuntime(movie.runtime)}{isSeries && movie.runtime ? ' per episode' : ''}</span>
            {isSeries && movie.seasons > 0 && <span className="text-mist">{movie.seasons} {movie.seasons === 1 ? 'season' : 'seasons'}</span>}
          </p>
          {movie.genres?.length > 0 && <p className="text-sm text-blush">{movie.genres.join(', ')}</p>}
          {d?.tagline && <p className="font-display text-sm italic text-mist">{d.tagline}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={() => actions.toggleWatched(movie)} className="btn btn-ghost !py-2 !text-xs">
              <Check size={14} /> {movie.watched ? 'Watched. Watch again?' : 'Mark watched'}
            </button>
            <button
              onClick={() => actions.toggleLike(movie)} aria-pressed={iWant}
              className={`btn !py-2 !text-xs ${iWant ? 'bg-blush text-night' : 'btn-ghost'}`}
            >
              <Heart size={14} fill={iWant ? 'currentColor' : 'none'} /> {iWant ? 'You want this' : 'I want this'}
            </button>
          </div>
          <div className="space-y-0.5 text-xs text-mist">
            {adder && (
              <p>
                <PersonLink person={adder} onOpen={people.open}>
                  <Avatar person={adder} size={18} /> <span>Added by <PersonName person={adder} /></span>
                </PersonLink>
              </p>
            )}
            {likers.length > 0 && (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {likers.map((p) => (
                  <PersonLink key={p.id ?? p.name} person={p} onOpen={people.open}><Avatar person={p} size={18} /></PersonLink>
                ))}
                Wanted by
                {likers.map((p, i) => (
                  <span key={p.id ?? p.name}>
                    <PersonLink person={p} onOpen={people.open}><PersonName person={p} /></PersonLink>
                    {i < likers.length - 2 ? ',' : i === likers.length - 2 ? ' and' : ''}
                  </span>
                ))}
              </p>
            )}
          </div>
          {movie.watched && (
            <label className="flex flex-wrap items-center gap-2 text-xs text-mist">
              Watched on
              <input
                type="date" max={today}
                value={movie.watched_at ? new Date(movie.watched_at).toLocaleDateString('en-CA') : ''}
                onChange={(e) => actions.setWatchedDate(movie, e.target.value)}
                className="rounded-lg border border-velvet bg-plum px-2 py-1 text-stone-100"
              />
            </label>
          )}
        </div>
      </div>

      {!movie.watched && (
        <section className="mt-6 rounded-2xl bg-plum p-4">
          <h3 className="mb-1 font-display text-lg font-semibold">Plan a night</h3>
          {movie.planned_on && (
            <p className="mb-3 text-sm text-ember">
              {fmtPlanDate(movie.planned_on)}{movie.planned_time ? ` at ${fmtTime(movie.planned_time)}` : ''}. {countdown(movie.planned_on)}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date" min={today} value={planDate} onChange={(e) => setPlanDate(e.target.value)} aria-label="Date"
              className="rounded-xl border border-velvet bg-night px-3 py-2 text-sm text-stone-100"
            />
            <input
              type="time" value={planTime} onChange={(e) => setPlanTime(e.target.value)} aria-label="Time (optional)"
              className="rounded-xl border border-velvet bg-night px-3 py-2 text-sm text-stone-100"
            />
            <button
              onClick={savePlan} className="btn btn-primary !py-2 !text-xs"
              disabled={!planDate || (planDate === (movie.planned_on ?? '') && planTime === (movie.planned_time ?? ''))}
            >Save plan</button>
          </div>
          {movie.planned_on && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => downloadCalendarEvent(movie)} className="btn btn-ghost !py-2 !text-xs">
                <CalendarPlus size={14} /> Add to calendar
              </button>
              <button onClick={clearPlan} className="btn btn-ghost !py-2 !text-xs text-mist">Clear plan</button>
            </div>
          )}
        </section>
      )}

      <Notes
        notes={movie.notes ?? []} people={people} meId={meId}
        onAdd={(t) => actions.addNote(movie, t)} onRemove={(id) => actions.removeNote(movie, id)}
      />

      {byHand ? (
        <p className="mt-6 rounded-xl bg-plum p-4 text-sm text-mist">
          You added this one yourself, so there's no summary or streaming info to show.
        </p>
      ) : (
        <>
          <section className="mt-6">
            <h3 className="mb-1.5 font-display text-lg font-semibold">Summary</h3>
            {error ? <p className="text-sm text-red-300">Couldn't load details: {error}</p>
              : !d ? <Lines rows={4} />
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
              {tracking && epsDone > 0 && (
                <p className="mb-3 text-sm">
                  {next ? (
                    <button
                      onClick={() => setOpenSeasons((s) => new Set(s).add(next.season))}
                      className="text-ember underline-offset-4 hover:underline"
                    >Next up: Season {next.season}, Episode {next.episode}</button>
                  ) : <span className="text-ember">You've watched every episode.</span>}
                  <span className="text-mist">{`  (${epsDone} watched)`}</span>
                </p>
              )}
              <ul className="space-y-2">
                {d.seasons.map((s) => (
                  <Season
                    key={s.number} tvId={movie.tmdb_id} season={s}
                    open={openSeasons.has(s.number)} onToggle={() => toggleSeason(s.number)}
                    tracking={tracking} watched={watchedMap[s.number] ?? []}
                    onEpisode={(e) => actions.toggleEpisode(movie, s.number, e)}
                    onMarkAll={(on) => actions.markSeason(movie, s.number, s.episodes, on)}
                  />
                ))}
              </ul>
            </section>
          )}

          {d?.similar?.length > 0 && (
            <section className="mt-6">
              <h3 className="mb-2 font-display text-lg font-semibold">More like this</h3>
              <ul className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
                {d.similar.map((s) => (
                  <SimilarCard
                    key={`${s.media_type}-${s.tmdb_id}`} item={s}
                    have={existingKeys.has(`${s.media_type}-${s.tmdb_id}`)} onAdd={actions.add}
                  />
                ))}
              </ul>
            </section>
          )}

          <p className="mt-8 text-xs text-mist/70">Details from TMDB. Streaming availability from JustWatch.</p>
        </>
      )}

      <button onClick={() => onRemove(movie)} className="btn btn-ghost mt-6 w-full !py-3 text-mist">
        <Trash2 size={15} /> Remove from our list
      </button>
    </Modal>

    {showTrailer && d?.trailer && (
      <Modal title={`${movie.title}: trailer`} onClose={() => setShowTrailer(false)} wide>
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${d.trailer.key}?autoplay=1&rel=0`}
            title={`${movie.title} trailer`} className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
          />
        </div>
        <a
          href={`https://www.youtube.com/watch?v=${d.trailer.key}`} target="_blank" rel="noreferrer"
          className="mt-3 inline-block text-sm text-blush underline-offset-4 hover:underline"
        >Open on YouTube</a>
      </Modal>
    )}
    </>
  );
}
