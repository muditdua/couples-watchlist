import { useState } from 'react';

const KEY = 'movie-room';
const clean = (s) => s.trim().toLowerCase().replace(/\s+/g, '-');

// The "room code" is the private name that links your two phones to the same list.
export function useRoom() {
  const [room, setRoomState] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('room');
    const r = clean(fromUrl || localStorage.getItem(KEY) || '');
    if (r) localStorage.setItem(KEY, r);
    return r;
  });

  const setRoom = (value) => {
    const r = clean(value);
    if (!r) return;
    localStorage.setItem(KEY, r);
    window.history.replaceState(null, '', `?room=${encodeURIComponent(r)}`);
    setRoomState(r);
  };

  const leave = () => {
    localStorage.removeItem(KEY);
    window.history.replaceState(null, '', window.location.pathname);
    setRoomState('');
  };

  return { room, setRoom, leave };
}
