import { useState } from 'react';
import { supabase } from '../lib/supabase';

// Shown after someone opens the "reset password" link from their email
export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('Use at least 6 characters.'); return; }
    if (password !== again) { setError("Those two don't match."); return; }
    setBusy(true); setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message); else onDone();
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Set a new password</h1>
      <p className="mt-3 text-mist">Pick something you'll remember. You'll stay signed in afterwards.</p>
      <form onSubmit={submit} className="mt-8 space-y-3">
        <input className="input" type="password" autoComplete="new-password" placeholder="New password"
          value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input className="input" type="password" autoComplete="new-password" placeholder="Type it again"
          value={again} onChange={(e) => setAgain(e.target.value)} required />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button className="btn btn-primary w-full !py-3.5" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
      </form>
    </main>
  );
}
