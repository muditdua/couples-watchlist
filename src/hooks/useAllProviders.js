import { useEffect, useMemo, useState } from 'react';
import { cachedProviders, loadProviders } from '../lib/providers';

// Streaming availability for every title in the list, keyed "movie-123" / "tv-456".
// Powers the "Streaming on" filter. Uses the same 24h cache as the cards.
export function useAllProviders(movies) {
  const [map, setMap] = useState({});
  const ids = useMemo(
    () => movies.filter((m) => m.tmdb_id > 0).map((m) => `${m.media_type}:${m.tmdb_id}`).join(','),
    [movies]
  );

  useEffect(() => {
    let on = true;
    ids.split(',').filter(Boolean).forEach((pair) => {
      const [type, id] = pair.split(':');
      const key = `${type}-${id}`;
      const hit = cachedProviders(type, id);
      if (hit !== undefined) { setMap((p) => (p[key] === hit ? p : { ...p, [key]: hit })); return; }
      loadProviders(type, id).then((v) => on && setMap((p) => ({ ...p, [key]: v }))).catch(() => {});
    });
    return () => { on = false; };
  }, [ids]);

  return map;
}
