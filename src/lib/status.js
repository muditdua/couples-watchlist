import { FEATURES } from '../config';

export const epsWatched = (m) => Object.values(m.episodes_watched ?? {}).reduce((n, a) => n + a.length, 0);

// A series with some episodes ticked that isn't marked watched yet
export const isWatching = (m) =>
  FEATURES.episodeTracking && m.media_type === 'tv' && !m.watched && epsWatched(m) > 0;

// First unticked episode (ignoring Specials), from the saved { "1": 22, "2": 24 } season sizes
export function nextUpFromCounts(counts, watchedMap) {
  const seasons = Object.keys(counts ?? {}).map(Number).filter((n) => n > 0).sort((a, b) => a - b);
  for (const s of seasons) {
    const have = new Set(watchedMap?.[s] ?? []);
    for (let e = 1; e <= counts[s]; e += 1) if (!have.has(e)) return { season: s, episode: e };
  }
  return null;
}

export const hasCounts = (counts) => Object.keys(counts ?? {}).length > 0;
