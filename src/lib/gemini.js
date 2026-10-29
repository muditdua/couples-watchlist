const KEY = import.meta.env.VITE_GEMINI_API_KEY;
const PRIMARY = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.8-flash';
// Tried in order if the first model is busy (duplicates are removed)
const MODELS = [...new Set([PRIMARY, 'gemini-flash-latest', 'gemini-flash-lite-latest'])];
const urlFor = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export const geminiEnabled = Boolean(KEY);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BUSY = new Set([429, 500, 502, 503, 504]);

async function callModel(model, body) {
  // up to 3 attempts per model, but each request gives up after 10 seconds
  for (let attempt = 0; attempt < 3; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    let res;
    try {
      res = await fetch(urlFor(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      const timedOut = e.name === 'AbortError';
      const err = new Error(timedOut ? '504 Gemini took too long to respond' : `Network error: ${e.message}`);
      err.busy = timedOut; // a timeout moves on to the next model; a network error stops here
      throw err;
    }
    clearTimeout(timer);
    if (res.ok) return res.json();

    let detail = '';
    try { detail = (await res.json()).error?.message || ''; } catch { /* no body */ }
    const err = new Error(`${res.status} ${detail}`.trim());
    err.busy = BUSY.has(res.status);
    if (!err.busy) throw err;
    if (attempt < 2) await sleep(800 * 2 ** attempt);
    else throw err;
  }
}

export async function suggestWithGemini(movies, { minutes, vibe }) {
  const list = movies.map((m) => ({
    id: m.id, title: m.title, year: m.year,
    type: m.media_type === 'tv' ? 'series' : 'movie',
    runtimeMinutes: m.runtime, // for a series this is one episode
    seasons: m.seasons, genres: m.genres, rating: m.rating,
  }));
  const prompt = `You are helping a couple choose a movie or series for tonight.
Their unwatched watchlist (JSON): ${JSON.stringify(list)}
Time available: ${minutes ? `${minutes} minutes (never suggest anything longer; for a series, one episode must fit)` : 'no limit'}.
Mood they want: ${vibe || 'no preference'}.
Pick up to 3 that best fit. Use only ids from the list.
Reply with only a JSON array: [{"id": "<id>", "reason": "<one short, warm sentence>"}]`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  };

  let data, lastError;
  for (const model of MODELS) {
    try { data = await callModel(model, body); break; }
    catch (e) { lastError = e; if (!e.busy) throw e; } // busy: move on to the next model
  }
  if (!data) throw lastError;

  const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
  const picks = JSON.parse(text);
  const byId = new Map(movies.map((m) => [m.id, m]));
  return picks
    .filter((p) => byId.has(p.id))
    .slice(0, 3)
    .map((p) => ({ movie: byId.get(p.id), reason: p.reason }));
}

// Built-in fallback when there is no Gemini key (or the call fails)
const MOODS = [
  [/light|fun|funny|laugh|cheer|happy|easy/, ['Comedy', 'Romance', 'Animation', 'Family']],
  [/scar|spook|creep|horror|thrill/, ['Horror', 'Thriller']],
  [/romant|cozy|cosy|date|love|sweet/, ['Romance', 'Drama', 'Comedy']],
  [/action|excit|adrenal|fast/, ['Action', 'Adventure', 'Science Fiction']],
  [/deep|think|serious|emotional|cry|sad/, ['Drama', 'Mystery', 'History']],
];

export function suggestLocally(movies, { minutes, vibe }) {
  const wanted = new Set();
  MOODS.forEach(([re, genres]) => re.test((vibe || '').toLowerCase()) && genres.forEach((g) => wanted.add(g)));
  return movies
    .filter((m) => !minutes || (m.runtime && m.runtime <= minutes))
    .map((m) => {
      const hits = m.genres.filter((g) => wanted.has(g));
      return { movie: m, hits, score: hits.length * 2 + (m.rating || 0) / 10 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ movie, hits }) => ({
      movie,
      reason: hits.length
        ? `Matches your mood (${hits.join(', ')})${minutes ? ` and fits in ${minutes} minutes.` : '.'}`
        : minutes ? `Fits within your ${minutes} minutes.` : 'Well rated and ready to watch.',
    }));
}
