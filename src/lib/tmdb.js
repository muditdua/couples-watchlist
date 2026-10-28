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

// Searches movies and series together
const langName = (code) => {
  try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(code); }
  catch { return null; }
};

// Searches movies and series together, then looks up the director and cast for each result
export async function searchTitles(query) {
  const data = await get('/search/multi', { query, include_adult: 'false' });
  const items = data.results
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 8)
    .map((r) => ({
      media_type: r.media_type,
      tmdb_id: r.id,
      title: r.title || r.name,
      year: yearOf(r.release_date || r.first_air_date),
      poster_path: r.poster_path,
      language: r.original_language ? langName(r.original_language) : null,
    }));

  // Fetch credits for every result in parallel; a failed lookup just shows less detail
  const credits = await Promise.allSettled(
    items.map((i) => get(`/${i.media_type}/${i.tmdb_id}`, { append_to_response: 'credits' }))
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
