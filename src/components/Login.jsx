import { useState } from 'react';
import { supabase } from '../lib/supabase';

const COPY = {
  password: { lead: 'Sign in to see your list.', button: 'Sign in', busy: 'Signing in…' },
  magic: { lead: "We'll email you a link that signs you in. No password needed.", button: 'Email me a magic link', busy: 'Sending…' },
  forgot: { lead: "Enter your email and we'll send a link to set a new password.", button: 'Send reset link', busy: 'Sending…' },
};

export default function Login() {
  const [mode, setMode] = useState('password'); // 'password' | 'magic' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  const [busy, setBusy] = useState(false);

  const switchTo = (m) => { setMode(m); setError(''); setSent(''); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setSent('');
    const address = email.trim();
    let result;
    if (mode === 'password') {
      result = await supabase.auth.signInWithPassword({ email: address, password });
    } else if (mode === 'magic') {
      // shouldCreateUser: false keeps strangers from making accounts, even with sign-ups off
      result = await supabase.auth.signInWithOtp({
        email: address, options: { emailRedirectTo: window.location.origin, shouldCreateUser: false },
      });
    } else {
      result = await supabase.auth.resetPasswordForEmail(address, { redirectTo: window.location.origin });
    }
    if (result.error) setError(result.error.message);
    else if (mode === 'magic') setSent('Check your email and open the link on this device.');
    else if (mode === 'forgot') setSent('If that email has an account, a reset link is on its way.');
    setBusy(false);
  };

  const copy = COPY[mode];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Our Movie Nights</h1>
      <p className="mt-3 text-mist">{copy.lead}</p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        <input
          className="input" type="email" autoComplete="email" inputMode="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} required
        />
        {mode === 'password' && (
          <input
            className="input" type="password" autoComplete="current-password" placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)} required
          />
        )}
        {error && <p className="text-sm text-red-300">{error}</p>}
        {sent && <p className="rounded-xl bg-plum p-3 text-sm text-stone-200">{sent}</p>}
        <button className="btn btn-primary w-full !py-3.5" disabled={busy || !email.trim()}>
          {busy ? copy.busy : copy.button}
        </button>
      </form>

      <div className="mt-5 flex flex-col items-center gap-3 text-sm">
        {mode === 'password' ? (
          <>
            <button onClick={() => switchTo('magic')} className="text-blush underline-offset-4 hover:underline">
              Email me a magic link instead
            </button>
            <button onClick={() => switchTo('forgot')} className="text-mist underline-offset-4 hover:underline">
              Forgot password?
            </button>
          </>
        ) : (
          <button onClick={() => switchTo('password')} className="text-mist underline-offset-4 hover:underline">
            Back to sign in with a password
          </button>
        )}
      </div>
    </main>
  );
}
