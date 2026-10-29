import { REGION, getProviders } from './tmdb';

// Streaming availability changes slowly, so cache it for a day (memory + localStorage)
// and fetch a few at a time instead of all at once.
const TTL = 24 * 60 * 60 * 1000;
const mem = new Map();
const pending = new Map();
const queue = [];
let active = 0;

const keyOf = (type, id) => `wp2:${REGION}:${type}:${id}`;

function pump() {
  while (active < 4 && queue.length) {
    active += 1;
    queue.shift()();
  }
}
const limited = (fn) =>
  new Promise((resolve, reject) => {
    queue.push(() => fn().then(resolve, reject).finally(() => { active -= 1; pump(); }));
    pump();
  });

export function cachedProviders(type, id) {
  const k = keyOf(type, id);
  if (mem.has(k)) return mem.get(k);
  try {
    const raw = localStorage.getItem(k);
    if (raw) {
      const { t, v } = JSON.parse(raw);
      if (Date.now() - t < TTL) { mem.set(k, v); return v; }
    }
  } catch { /* storage unavailable */ }
  return undefined;
}

export function storeProviders(type, id, value) {
  const k = keyOf(type, id);
  mem.set(k, value);
  try { localStorage.setItem(k, JSON.stringify({ t: Date.now(), v: value })); } catch { /* ignore */ }
}

export function loadProviders(type, id) {
  const hit = cachedProviders(type, id);
  if (hit !== undefined) return Promise.resolve(hit);
  const k = keyOf(type, id);
  if (pending.has(k)) return pending.get(k);
  const p = limited(() => getProviders(type, id))
    .then((v) => { storeProviders(type, id, v); return v; })
    .finally(() => pending.delete(k));
  pending.set(k, p);
  return p;
}
