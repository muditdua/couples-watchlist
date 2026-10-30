import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Settings } from 'lucide-react';
import { Avatar, PersonName } from './Person';
import { posterUrl } from '../lib/tmdb';
import PhotoViewer from './PhotoViewer';

function Tile({ movie, onOpen }) {
  const poster = posterUrl(movie.poster_path, 'w342');
  return (
    <li>
      <button onClick={() => onOpen(movie)} className="group block w-full text-left" aria-label={`Open details for ${movie.title}`}>
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-velvet">
          {poster
            ? <img src={poster} alt="" loading="lazy" className={`h-full w-full object-cover transition group-hover:scale-105 ${movie.watched ? 'opacity-60' : ''}`} />
            : <span className="flex h-full items-center justify-center p-2 text-center font-display text-sm text-mist">{movie.title}</span>}
          {movie.watched && (
            <span className="absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-blush text-night"><Check size={14} /></span>
          )}
          {movie.media_type === 'tv' && (
            <span className="absolute right-1.5 top-1.5 rounded-full bg-night/85 px-2 py-0.5 text-[10px] font-semibold text-blush">Series</span>
          )}
        </div>
        <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-snug">{movie.title}</p>
      </button>
    </li>
  );
}

const byNewest = (a, b) => new Date(b.created_at) - new Date(a.created_at);

export default function ProfilePage({ person, isMe, meId, movies, onBack, onOpenTitle, onOpenSettings }) {
  const [tab, setTab] = useState('added');
  const [viewing, setViewing] = useState(false);

  const added = useMemo(
    () => movies.filter((m) => (m.added_by_id ? m.added_by_id === person.id : m.added_by === person.name)).sort(byNewest),
    [movies, person.id, person.name]
  );
  const wants = useMemo(() => movies.filter((m) => (m.likes ?? {})[person.id]).sort(byNewest), [movies, person.id]);
  const both = isMe ? 0 : wants.filter((m) => (m.likes ?? {})[meId]).length;
  const watched = added.filter((m) => m.watched).length;

  const topGenres = useMemo(() => {
    const n = {};
    added.forEach((m) => m.genres.forEach((g) => { n[g] = (n[g] || 0) + 1; }));
    return Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);
  }, [added]);

  const stats = [['Added', added.length], ['Wants', wants.length], ['Watched', watched], ...(isMe ? [] : [['Both want', both]])];
  const list = tab === 'added' ? added : wants;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 pb-20 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between pt-2">
        <button onClick={onBack} aria-label="Back to the list" className="btn btn-ghost !h-11 !w-11 !px-0"><ArrowLeft size={18} /></button>
        {isMe && <button onClick={onOpenSettings} className="btn btn-ghost !py-2.5"><Settings size={16} /> Edit profile</button>}
      </header>

      <section className="flex flex-col items-center text-center">
        {person.avatar ? (
          <button onClick={() => setViewing(true)} aria-label="View photo larger" title="View larger" className="rounded-full ring-2 ring-transparent transition hover:ring-blush">
            <Avatar person={person} size={112} />
          </button>
        ) : <Avatar person={person} size={112} />}
        <h1 className="mt-4 text-3xl leading-tight"><PersonName person={person} /></h1>
        {isMe && <p className="mt-1 text-sm text-mist">This is how your partner sees you</p>}
        {person.bio && <p className="mt-3 max-w-md whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-200">{person.bio}</p>}
        {topGenres.length > 0 && (
          <p className="mt-3 flex flex-wrap justify-center gap-2">
            {topGenres.map((g) => <span key={g} className="rounded-full border border-velvet px-3 py-1 text-xs text-blush">{g}</span>)}
          </p>
        )}
      </section>

      <section className={`grid gap-2 ${stats.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {stats.map(([label, n]) => (
          <div key={label} className="rounded-2xl bg-plum px-2 py-3 text-center">
            <p className="font-display text-2xl font-semibold">{n}</p>
            <p className="text-xs text-mist">{label}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-2 rounded-full bg-plum p-1" role="tablist">
        {[['added', `Added (${added.length})`], ['wants', `Wants (${wants.length})`]].map(([v, label]) => (
          <button
            key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${tab === v ? 'bg-blush text-night' : 'text-mist'}`}
          >{label}</button>
        ))}
      </div>

      {list.length ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {list.map((m) => <Tile key={m.id} movie={m} onOpen={onOpenTitle} />)}
        </ul>
      ) : (
        <p className="py-10 text-center text-mist">
          {tab === 'added' ? `${isMe ? 'You haven' : `${person.name} hasn`}'t added anything yet.` : 'Nothing marked as wanted yet.'}
        </p>
      )}
      {viewing && <PhotoViewer person={person} onClose={() => setViewing(false)} />}
    </div>
  );
}
