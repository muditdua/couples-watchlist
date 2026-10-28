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

export const posterUrl = (path, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

export async function searchMovies(query) {
  const data = await get('/search/movie', { query, include_adult: 'false' });
  return data.results.slice(0, 8).map((m) => ({
    tmdb_id: m.id,
    title: m.title,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
    poster_path: m.poster_path,
  }));
}

// Full details (runtime, genres, director, cast) fetched once, then stored in the database
export async function getMovieDetails(tmdbId) {
  const d = await get(`/movie/${tmdbId}`, { append_to_response: 'credits' });
  return {
    tmdb_id: d.id,
    title: d.title,
    year: d.release_date ? Number(d.release_date.slice(0, 4)) : null,
    poster_path: d.poster_path,
    runtime: d.runtime || null,
    genres: d.genres.map((g) => g.name),
    rating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : null,
    director: d.credits?.crew?.find((c) => c.job === 'Director')?.name ?? null,
    cast_names: (d.credits?.cast ?? []).slice(0, 3).map((c) => c.name),
  };
}
