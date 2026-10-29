import { useEffect, useState } from 'react';
import { cachedProviders, loadProviders } from '../lib/providers';

// undefined = loading, null = failed, object = { link, stream, free, rent }
export function useProviders(type, id, enabled = true) {
  const [data, setData] = useState(() => (enabled ? cachedProviders(type, id) : null));

  useEffect(() => {
    if (!enabled) { setData(null); return undefined; }
    const hit = cachedProviders(type, id);
    if (hit !== undefined) { setData(hit); return undefined; }
    let on = true;
    setData(undefined);
    loadProviders(type, id).then((v) => on && setData(v)).catch(() => on && setData(null));
    return () => { on = false; };
  }, [type, id, enabled]);

  return data;
}
