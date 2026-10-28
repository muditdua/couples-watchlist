const KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export const geminiEnabled = Boolean(KEY);

export async function suggestWithGemini(movies, { minutes, vibe }) {
  const list = movies.map((m) => ({
    id: m.id, title: m.title, year: m.year,
    runtimeMinutes: m.runtime, genres: m.genres, rating: m.rating,
  }));
  const prompt = `You are helping a couple choose a movie for tonight.
Their unwatched watchlist (JSON): ${JSON.stringify(list)}
Time available: ${minutes ? `${minutes} minutes (never suggest a longer movie)` : 'no limit'}.
Mood they want: ${vibe || 'no preference'}.
Pick up to 3 movies from the list that best fit. Use only ids from the list.
Reply with only a JSON array: [{"id": "<id>", "reason": "<one short, warm sentence>"}]`;

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } },
    }),
  });
  if (!res.ok) throw new Error(`Gemini request failed (${res.status})`);
  const data = await res.json();
  const picks = JSON.parse(data.candidates[0].content.parts[0].text);
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
