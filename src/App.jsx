import { useEffect, useMemo, useRef, useState } from 'react';
import Login from './components/Login';
import { Plus, Sparkles } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useWatchlist } from './hooks/useWatchlist';
import { useAllProviders } from './hooks/useAllProviders';
import { useProfiles } from './hooks/useProfiles';
import { applyAccent } from './lib/customize';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/Header';
import Filters from './components/Filters';
import ServiceChips from './components/ServiceChips';
import MovieCard from './components/MovieCard';
import SearchModal from './components/SearchModal';
import DecisionModal from './components/DecisionModal';
import ConfirmDialog from './components/ConfirmDialog';
import DetailModal from './components/DetailModal';
import NamePrompt from './components/NamePrompt';
import ResetPassword from './components/ResetPassword';
import SettingsPage from './components/SettingsPage';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [recovering, setRecovering] = useState(false); // opened a "reset password" email link

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!supabase) {
    return (
      <main className="mx-auto max-w-md px-6 py-20">
        <h1 className="font-display text-3xl font-semibold">Almost ready</h1>
        <p className="mt-3 text-mist">
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code>, then restart the dev server.
        </p>
      </main>
    );
  }
  if (session === undefined) return null;
  return (
    <>
      {!session ? <Login />
        : recovering ? <ResetPassword onDone={() => setRecovering(false)} />
        : <Watchlist user={session.user} onSignOut={() => supabase.auth.signOut()} />}
      <Analytics />
    </>
  );
}

const loadServices = () => {
  try { return new Set(JSON.parse(localStorage.getItem('services') || '[]')); } catch { return new Set(); }
};
const loadPrefs = () => {
  try { return { status: 'to-watch', sort: 'shortest', ...JSON.parse(localStorage.getItem('prefs') || '{}') }; }
  catch { return { status: 'to-watch', sort: 'shortest' }; }
};

function Watchlist({ user, onSignOut }) {
  const profiles = useProfiles(user);

  // Name shown on "Added by" / "Wanted by": the profile name, else the older saved name, else the start of the email
  const emailName = (user.email || 'Someone').split('@')[0];
  const savedName = (user.user_metadata?.name || '').trim();
  const who = {
    id: user.id,
    name: (profiles.me?.name || savedName).trim() || emailName.charAt(0).toUpperCase() + emailName.slice(1),
  };
  const mePerson = { ...(profiles.me ?? {}), name: who.name };

  const {
    movies, loading, error, add, toggleWatched, setWatchedDate, toggleLike, toggleEpisode, markSeason, remove,
  } = useWatchlist(who);
  const providersMap = useAllProviders(movies);

  const [prefs, setPrefs] = useState(loadPrefs);
  const [status, setStatus] = useState(prefs.status);
  const [type, setType] = useState('all');
  const [genre, setGenre] = useState('all');
  const [sort, setSort] = useState(prefs.sort);
  const [services, setServices] = useState(loadServices);
  const [modal, setModal] = useState(null); // 'search' | 'decide' | null
  const [pendingRemove, setPendingRemove] = useState(null);
  const [query, setQuery] = useState('');
  const [detailId, setDetailId] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'settings'
  const [nameDismissed, setNameDismissed] = useState(() => Boolean(localStorage.getItem('name-prompt-skipped')));
  const detailMovie = movies.find((m) => m.id === detailId); // looked up live so changes show instantly
  const askName = profiles.ready && !profiles.me?.name && !savedName && !nameDismissed;

  // Settings is a full page, but the phone's back button should still return to the list
  const listScroll = useRef(0);
  useEffect(() => {
    const onPop = () => setView('list');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => { if (view === 'list') window.scrollTo(0, listScroll.current); }, [view]);
  const openSettings = () => {
    listScroll.current = window.scrollY;
    window.history.pushState({ settings: true }, '');
    setView('settings');
    window.scrollTo(0, 0);
  };

  // Your accent colour (each person has their own)
  useEffect(() => {
    const id = profiles.me?.accent || localStorage.getItem('accent') || 'rose';
    applyAccent(id);
    if (profiles.me?.accent) { try { localStorage.setItem('accent', profiles.me.accent); } catch { /* ignore */ } }
  }, [profiles.me?.accent]);

  // Titles added before profiles existed: tie them to you so they follow your name and photo
  const claimed = useRef(false);
  useEffect(() => {
    if (claimed.current || !profiles.ready) return;
    claimed.current = true;
    supabase.from('movies').update({ added_by_id: who.id }).eq('added_by', who.name).is('added_by_id', null)
      .then(() => {}, () => {});
  }, [profiles.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveProfile = async (fields) => {
    const oldName = who.name;
    await profiles.save(fields);
    if (fields.name && fields.name !== oldName) {
      await supabase.from('movies').update({ added_by_id: who.id, added_by: fields.name })
        .eq('added_by', oldName).is('added_by_id', null);
    }
  };

  const savePrefs = (next) => {
    setPrefs(next);
    try { localStorage.setItem('prefs', JSON.stringify(next)); } catch { /* ignore */ }
  };

  useEffect(() => {
    try { localStorage.setItem('services', JSON.stringify([...services])); } catch { /* ignore */ }
  }, [services]);

  const toggleService = (id) => setServices((s) => {
    const c = new Set(s);
    if (c.has(id)) c.delete(id); else c.add(id);
    return c;
  });

  // Who added a title / who wants it, with their name style, colour and photo
  const personOf = (m) => {
    const p = profiles.byId[m.added_by_id] ?? profiles.byName[m.added_by];
    if (p) return { ...p, name: p.name || m.added_by };
    return m.added_by ? { name: m.added_by } : null;
  };
  const likersOf = (m) => Object.entries(m.likes ?? {}).map(([id, name]) => {
    const p = profiles.byId[id];
    return p ? { ...p, name: p.name || name } : { id, name };
  });

  const genres = useMemo(() => [...new Set(movies.flatMap((m) => m.genres))].sort(), [movies]);
  const wants = (m) => Object.keys(m.likes ?? {}).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const onService = (m) => {
      const d = providersMap[`${m.media_type}-${m.tmdb_id}`];
      return Boolean(d) && [...d.stream, ...d.free].some((p) => services.has(p.id));
    };
    const list = movies.filter((m) =>
      (status === 'all' || (status === 'watched') === m.watched) &&
      (type === 'all' || m.media_type === type) &&
      (genre === 'all' || m.genres.includes(genre)) &&
      (!services.size || onService(m)) &&
      (!q || [m.title, m.director, m.added_by, ...(m.cast_names ?? [])]
        .filter(Boolean).some((s) => s.toLowerCase().includes(q))));
    const byNewest = (a, b) => new Date(b.created_at) - new Date(a.created_at);
    const by = {
      shortest: (a, b) => (a.runtime ?? 9999) - (b.runtime ?? 9999),
      rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
      alpha: (a, b) => a.title.localeCompare(b.title),
      newest: byNewest,
      likes: (a, b) => wants(b) - wants(a) || byNewest(a, b),
      watched: (a, b) => new Date(b.watched_at || 0) - new Date(a.watched_at || 0),
    }[sort];
    return [...list].sort(by);
  }, [movies, query, status, type, genre, sort, services, providersMap]);

  const toWatch = movies.filter((m) => !m.watched).length;
  const thisYear = movies.filter(
    (m) => m.watched && m.watched_at && new Date(m.watched_at).getFullYear() === new Date().getFullYear()
  ).length;

  const actions = { add, toggleWatched, toggleLike, setWatchedDate, toggleEpisode, markSeason };
  const filtered = Boolean(query || services.size || genre !== 'all' || type !== 'all');

  if (view === 'settings') {
    return (
      <SettingsPage
        user={user} me={mePerson} profile={profiles.me} prefs={prefs}
        onSavePrefs={savePrefs} onSave={saveProfile}
        onBack={() => window.history.back()} onSignOut={onSignOut}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 pb-32">
      <Header total={movies.length} toWatch={toWatch} thisYear={thisYear} me={mePerson} onOpenSettings={openSettings} />
      <Filters {...{ query, setQuery, status, setStatus, type, setType, genre, setGenre, genres, sort, setSort }} />
      <ServiceChips providersMap={providersMap} selected={services} onToggle={toggleService} onClear={() => setServices(new Set())} />
      {error && <p className="rounded-xl bg-red-950/60 p-3 text-sm text-red-200">Couldn't sync: {error}</p>}

      {loading ? (
        <p className="py-16 text-center text-mist">Loading your list…</p>
      ) : visible.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {visible.map((m) => (
            <MovieCard
              key={m.id} movie={m} meId={who.id} addedBy={personOf(m)}
              onToggle={toggleWatched} onLike={toggleLike} onRemove={setPendingRemove} onOpen={(x) => setDetailId(x.id)}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="font-display text-2xl">
            {query ? `No matches for "${query}"` : movies.length ? 'Nothing matches those filters' : 'Your list is empty'}
          </p>
          <p className="mt-2 text-mist">
            {query ? 'Try another spelling, or check the To watch / Watched / All tabs.'
              : filtered ? 'Try another genre, type, service or status.'
              : movies.length ? 'Try another status tab.' : 'Add the first movie or series for your next night in.'}
          </p>
        </div>
      )}

      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center gap-3 bg-gradient-to-t from-night via-night/90 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
        <button onClick={() => setModal('decide')} className="btn btn-ghost pointer-events-auto flex-1 !px-4 !py-3.5 shadow-xl shadow-black/40 sm:flex-none sm:!px-5">
          <Sparkles size={18} /> Help us decide
        </button>
        <button onClick={() => setModal('search')} className="btn btn-primary pointer-events-auto flex-1 !px-4 !py-3.5 shadow-xl shadow-black/40 sm:flex-none sm:!px-5">
          <Plus size={18} /> Add title
        </button>
      </nav>

      {modal === 'search' && (
        <SearchModal existingKeys={new Set(movies.map((m) => `${m.media_type}-${m.tmdb_id}`))} onAdd={add} onClose={() => setModal(null)} />
      )}
      {detailMovie && (
        <DetailModal
          movie={detailMovie} meId={who.id} actions={actions} onRemove={setPendingRemove}
          people={{ adder: personOf, likers: likersOf }}
          existingKeys={new Set(movies.map((m) => `${m.media_type}-${m.tmdb_id}`))}
          onClose={() => setDetailId(null)}
        />
      )}
      {modal === 'decide' && (
        <DecisionModal movies={movies} onClose={() => setModal(null)} onOpen={(m) => { setModal(null); setDetailId(m.id); }} />
      )}
      {askName && (
        <NamePrompt
          onSave={(name) => saveProfile({ name })}
          onClose={() => { setNameDismissed(true); try { localStorage.setItem('name-prompt-skipped', '1'); } catch { /* ignore */ } }}
        />
      )}
      {pendingRemove && (
        <ConfirmDialog
          movie={pendingRemove}
          onCancel={() => setPendingRemove(null)}
          onConfirm={() => { remove(pendingRemove); setPendingRemove(null); }}
        />
      )}
    </div>
  );
}
