import { useState } from 'react';
import Modal from './Modal';
import { supabase } from '../lib/supabase';

// Asked once, so "Added by" and "Wanted by" show your name instead of an email
export default function NamePrompt({ initial = '', onClose }) {
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setError('');
    const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } });
    setBusy(false);
    if (error) setError(error.message); else onClose();
  };

  return (
    <Modal title="What should we call you?" onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <p className="text-sm text-mist">Your name shows on the titles you add and the ones you want to watch.</p>
        <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={30} />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Not now</button>
          <button className="btn btn-primary flex-1" disabled={busy || !name.trim()}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
