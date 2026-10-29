import { useState } from 'react';
import Modal from './Modal';

// Asked once, so "Added by" and "Wanted by" show your name instead of an email
export default function NamePrompt({ initial = '', onSave, onClose }) {
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setError('');
    try { await onSave(name.trim()); onClose(); }
    catch { setError("Couldn't save. Run supabase-upgrade-v3.sql in Supabase first, or tap Not now."); }
    setBusy(false);
  };

  return (
    <Modal title="What should we call you?" onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <p className="text-sm text-mist">Your name shows on the titles you add and the ones you want to watch. You can add a photo and style it later in Settings.</p>
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
