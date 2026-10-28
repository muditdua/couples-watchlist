import { useState } from 'react';

export default function RoomGate({ onEnter }) {
  const [code, setCode] = useState('');
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <h1 className="font-display text-5xl font-semibold leading-tight">Our Movie Nights</h1>
      <p className="mt-3 text-mist">
        Pick a private room code and use the same one on both phones. Your list stays in sync.
      </p>
      <form onSubmit={(e) => { e.preventDefault(); onEnter(code); }} className="mt-8 space-y-3">
        <input
          className="input" value={code} onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. sam-and-alex-2026" aria-label="Room code" autoFocus
        />
        <button className="btn btn-primary w-full" disabled={!code.trim()}>Open our list</button>
      </form>
      <p className="mt-4 text-sm text-mist/70">Choose something hard to guess. Anyone with the code can edit the list.</p>
    </main>
  );
}
