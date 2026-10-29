const KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE = 'https://api.themoviedb.org/3';

async function get(path, params = {}) {
  if (!KEY) throw new Error('Missing VITE_TMDB_API_KEY');
  const url = new URL(BASE + path);
  url.searchParams.set('api_key', KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB request failed (${res.status})`);
  return res.json();
}

const yearOf = (date) => (date ? Number(date.slice(0, 4)) : null);

export const posterUrl = (path, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

// ---------- Where to watch (data from JustWatch, via TMDB) ----------
export const REGION = (import.meta.env.VITE_WATCH_REGION || 'IN').toUpperCase();
export const REGION_NAME = (() => {
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(REGION) || REGION; }
  catch { return REGION; }
})();

const tidy = (list = [], skip = new Set()) => {
  const seen = new Set();
  return [...list]
    .sort((a, b) => (a.display_priority ?? 99) - (b.display_priority ?? 99))
    .filter((p) => !skip.has(p.provider_id) && !seen.has(p.provider_id) && seen.add(p.provider_id))
    .map((p) => ({ id: p.provider_id, name: p.provider_name, logo: p.logo_path }));
};

// Turns TMDB's per-country response into { link, stream, free, rent } for our region
export function pickProviders(wp) {
  const r = wp?.results?.[REGION] ?? {};
  const stream = tidy(r.flatrate);
  const taken = new Set(stream.map((p) => p.id));
  const free = tidy([...(r.free ?? []), ...(r.ads ?? [])], taken);
  free.forEach((p) => taken.add(p.id));
  const rent = tidy([...(r.rent ?? []), ...(r.buy ?? [])], taken);
  return { link: r.link ?? null, stream, free, rent };
}

export async function getProviders(mediaType, tmdbId) {
  return pickProviders(await get(`/${mediaType}/${tmdbId}/watch/providers`));
}

export const logoUrl = (path) => (path ? `https://image.tmdb.org/t/p/w92${path}` : null);

// ---------- Detail pane ----------
export async function getFullDetails(mediaType, tmdbId) {
  const d = await get(`/${mediaType}/${tmdbId}`, { append_to_response: 'credits,watch/providers' });
  return {
    overview: d.overview || '',
    tagline: d.tagline || '',
    cast: (d.credits?.cast ?? []).slice(0, 6).map((c) => c.name),
    director: mediaType === 'tv'
      ? (d.created_by ?? []).map((c) => c.name).join(', ') || null
      : d.credits?.crew?.find((c) => c.job === 'Director')?.name ?? null,
    providers: pickProviders(d['watch/providers']),
    status: d.status || '',
    seasons: mediaType === 'tv'
      ? (d.seasons ?? [])
          .filter((x) => x.episode_count > 0)
          .map((x) => ({
            number: x.season_number, name: x.name, episodes: x.episode_count,
            year: yearOf(x.air_date), overview: x.overview || '',
          }))
          .sort((a, b) => (a.number === 0) - (b.number === 0) || a.number - b.number) // Specials last
      : [],
  };
}

export async function getSeason(tvId, seasonNumber) {
  const d = await get(`/tv/${tvId}/season/${seasonNumber}`);
  return (d.episodes ?? []).map((e) => ({
    id: e.id, number: e.episode_number, name: e.name,
    overview: e.overview || '', runtime: e.runtime || null,
    airDate: e.air_date || null, still: e.still_path || null,
  }));
}

// Searches movies and series together
const langName = (code) => {
  try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(code); }
  catch { return null; }
};

// Searches movies and series together, then looks up the director and cast for each result
export async function searchTitles(query, type = 'all') {
  // "Players 2012" or "Players (2012)" -> title + year
  const m = query.match(/^(.*?)[\s(]*((?:19|20)\d{2})\)?\s*$/);
  const text = m && m[1].trim() ? m[1].trim() : query;
  const year = m && m[1].trim() ? m[2] : null;

  const none = { results: [] };
  const [movies, shows] = await Promise.all([
    type === 'tv' ? none : get('/search/movie', { query: text, include_adult: 'false', ...(year && { year }) }),
    type === 'movie' ? none : get('/search/tv', { query: text, include_adult: 'false', ...(year && { first_air_date_year: year }) }),
  ]);

  const items = [
    ...movies.results.map((r) => ({ ...r, media_type: 'movie' })),
    ...shows.results.map((r) => ({ ...r, media_type: 'tv' })),
  ]
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 10)
    .map((r) => ({
      media_type: r.media_type,
      tmdb_id: r.id,
      title: r.title || r.name,
      year: yearOf(r.release_date || r.first_air_date),
      poster_path: r.poster_path,
      language: r.original_language ? langName(r.original_language) : null,
    }));

  // Director and cast for each result, so same-named titles are easy to tell apart
  const credits = await Promise.allSettled(
    items.map((i) => get(`/${i.media_type}/${i.tmdb_id}`, { append_to_response: 'credits,watch/providers' }))
  );

  return items.map((item, idx) => {
    const d = credits[idx].status === 'fulfilled' ? credits[idx].value : null;
    if (!d) return item;
    const director = item.media_type === 'tv'
      ? d.created_by?.[0]?.name
      : d.credits?.crew?.find((c) => c.job === 'Director')?.name;
    return {
      ...item,
      director: director ?? null,
      cast: (d.credits?.cast ?? []).slice(0, 2).map((c) => c.name),
      providers: pickProviders(d['watch/providers']),
    };
  });
}

export async function getDetails(mediaType, tmdbId) {
  const d = await get(`/${mediaType}/${tmdbId}`, { append_to_response: 'credits' });
  const base = {
    media_type: mediaType,
    tmdb_id: d.id,
    poster_path: d.poster_path,
    genres: d.genres.map((g) => g.name),
    rating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : null,
    cast_names: (d.credits?.cast ?? []).slice(0, 3).map((c) => c.name),
  };
  if (mediaType === 'tv') {
    return {
      ...base,
      title: d.name,
      year: yearOf(d.first_air_date),
      runtime: d.episode_run_time?.[0] || d.last_episode_to_air?.runtime || null, // minutes per episode
      seasons: d.number_of_seasons ?? null,
      director: d.created_by?.[0]?.name ?? null, // shown as "Created by"
    };
  }
  return {
    ...base,
    title: d.title,
    year: yearOf(d.release_date),
    runtime: d.runtime || null,
    seasons: null,
    director: d.credits?.crew?.find((c) => c.job === 'Director')?.name ?? null,
  };
}
