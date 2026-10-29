import { useEffect, useRef, useState } from 'react';
import { Shuffle, Sparkles } from 'lucide-react';
import Modal from './Modal';
import { fmtRuntime } from '../lib/format';
import { posterUrl } from '../lib/tmdb';
import { geminiEnabled, suggestLocally, suggestWithGemini } from '../lib/gemini';

const TIMES = [[60, '1 hour'], [90, '90 min'], [120, '2 hours'], [0, 'No limit']];
const VIBES = ['Lighthearted', 'Romantic', 'Exciting', 'Scary', 'Thoughtful'];

export default function DecisionModal({ movies, onClose, onOpen }) {
  const [minutes, setMinutes] = useState(0);
  const [vibe, setVibe] = useState('');
  const [picks, setPicks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [type, setType] = useState('all');
  const [spin, setSpin] = useState(null); // { movie, running } for "Surprise us"
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const pool = movies.filter((m) => !m.watched && (type === 'all' || m.media_type === type));

  const decide = async () => {
  setLoading(true); setNote(''); setSpin(null);
  const input = { minutes, vibe };
  try {
    if (!geminiEnabled) throw new Error('no-key');
    const result = await suggestWithGemini(pool, input);
    setPicks(result.length ? result : suggestLocally(pool, input));
  } catch (e) {
    if (e.message !== 'no-key') {
      console.error('Gemini error:', e);
      setNote(
        /^(429|5\d\d)/.test(e.message)
          ? 'Gemini is busy right now, so these come from a simple filter. Try again in a minute for smarter picks.'
          : `Gemini failed (${e.message.slice(0, 140)}). Showing simple filter results instead.`
      );
    }
    setPicks(suggestLocally(pool, input));
  } finally {
    setLoading(false);
  }
};

  // Tonight's pick: a quick shuffle that lands on one title. Honours type and time,
  // and titles you both marked as wanted are more likely to come up.
  const surprise = () => {
    const eligible = pool.filter((m) => !minutes || (m.runtime && m.runtime <= minutes));
    clearTimeout(timer.current);
    setPicks(null); setNote('');
    if (!eligible.length) { setSpin({ movie: null, running: false }); return; }
    const weights = eligible.map((m) => 1 + 2 * Object.keys(m.likes ?? {}).length);
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    let winner = eligible[eligible.length - 1];
    for (let i = 0; i < eligible.length; i += 1) { r -= weights[i]; if (r <= 0) { winner = eligible[i]; break; } }
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (calm || eligible.length === 1) { setSpin({ movie: winner, running: false }); return; }
    const steps = 16;
    const tick = (n) => {
      if (n >= steps) { setSpin({ movie: winner, running: false }); return; }
      setSpin({ movie: eligible[Math.floor(Math.random() * eligible.length)], running: true });
      timer.current = setTimeout(() => tick(n + 1), 70 + n * n * 1.6);
    };
    tick(0);
  };

  return (
    <Modal title="What should we watch?" onClose={onClose}>
      <p className="mb-2 text-sm text-mist">What are you in the mood to watch?</p>
      <div className="mb-5 flex rounded-full bg-plum p-1" role="tablist">
        {[['all', 'Everything'], ['movie', 'Movies'], ['tv', 'Series']].map(([v, label]) => (
          <button
            key={v} role="tab" aria-selected={type === v}
            onClick={() => { setType(v); setPicks(null); setSpin(null); }}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${type === v ? 'bg-velvet text-blush' : 'text-mist'}`}
          >{label}</button>
        ))}
      </div>
      <p className="mb-2 text-sm text-mist">How much time do you have?</p>
      <div className="flex flex-wrap gap-2">
        {TIMES.map(([v, label]) => (
          <button key={v} onClick={() => setMinutes(v)}
            className={`rounded-full border px-4 py-2 text-sm ${minutes === v ? 'border-blush bg-blush text-night' : 'border-velvet text-mist'}`}>{label}</button>
        ))}
      </div>

      <p className="mb-2 mt-5 text-sm text-mist">What are you in the mood for?</p>
      <input className="input" value={vibe} onChange={(e) => setVibe(e.target.value)} placeholder="Something cozy and funny" />
      <div className="mt-2 flex flex-wrap gap-2">
        {VIBES.map((v) => (
          <button key={v} onClick={() => setVibe(v)} className="rounded-full border border-velvet px-3 py-1.5 text-sm text-mist hover:border-blush">{v}</button>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button className="btn btn-primary flex-1" onClick={decide} disabled={loading || spin?.running || !pool.length}>
          <Sparkles size={16} /> {loading ? 'Picking…' : 'Pick our top 3'}
        </button>
        <button className="btn btn-ghost" onClick={surprise} disabled={loading || spin?.running || !pool.length}>
          <Shuffle size={16} /> Surprise us
        </button>
      </div>
      {!pool.length && (
        <p className="mt-3 text-sm text-mist">
          {type === 'all'
            ? 'Add a few movies or series to your "To watch" list first.'
            : `You have no ${type === 'tv' ? 'series' : 'movies'} left in "To watch".`}
        </p>
      )}
      {note && <p className="mt-3 text-sm text-mist">{note}</p>}

      {spin && (
        <div className="mt-6 rounded-2xl bg-plum p-4 text-center" aria-live="polite">
          {!spin.movie ? (
            <p className="text-mist">Nothing fits that time limit. Try a longer window.</p>
          ) : (
            <>
              <p className="text-sm text-mist">{spin.running ? 'Spinning…' : "Tonight's pick"}</p>
              <div className={`mx-auto mt-2 aspect-[2/3] w-32 overflow-hidden rounded-xl bg-velvet transition ${spin.running ? 'opacity-70' : ''}`}>
                {spin.movie.poster_path && <img src={posterUrl(spin.movie.poster_path, 'w342')} alt="" className="h-full w-full object-cover" />}
              </div>
              <p className="mt-3 font-display text-xl font-semibold leading-snug">{spin.movie.title}</p>
              <p className="text-sm text-ember">
                {fmtRuntime(spin.movie.runtime)}{spin.movie.media_type === 'tv' ? ' per episode, series' : ''}
              </p>
              {!spin.running && (
                <div className="mt-4 flex gap-2">
                  <button onClick={surprise} className="btn btn-ghost flex-1"><Shuffle size={15} /> Spin again</button>
                  <button onClick={() => onOpen(spin.movie)} className="btn btn-primary flex-1">See details</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {picks && (
        <ol className="mt-6 space-y-3">
          {picks.length === 0 && <p className="text-mist">Nothing fits that time limit. Try a longer window.</p>}
          {picks.map(({ movie, reason }) => (
            <li key={movie.id} className="flex gap-3 rounded-2xl bg-plum p-3">
              <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-velvet">
                {movie.poster_path && <img src={posterUrl(movie.poster_path, 'w185')} alt="" className="h-full w-full object-cover" />}
              </div>
              <div>
                <p className="font-display text-lg font-semibold leading-snug">{movie.title}</p>
                <p className="text-sm text-ember">
                  {fmtRuntime(movie.runtime)}{movie.media_type === 'tv' ? ' per episode, series' : ''}
                </p>
                <p className="mt-1 text-sm text-mist">{reason}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
