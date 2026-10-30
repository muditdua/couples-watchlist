import { useEffect, useState } from 'react';
import Modal from './Modal';
import { supabase } from '../lib/supabase';

// Shows a profile photo large. The small version appears at once; the sharper one loads in behind it.
export default function PhotoViewer({ person, large = null, onClose }) {
  const [sharp, setSharp] = useState(large);

  useEffect(() => {
    if (large || !person?.id) return undefined;
    let on = true;
    supabase.from('profiles').select('avatar_large').eq('id', person.id).maybeSingle()
      .then(({ data }) => { if (on && data?.avatar_large) setSharp(data.avatar_large); }, () => {});
    return () => { on = false; };
  }, [person?.id, large]);

  const src = sharp || person.avatar;
  if (!src) return null;
  return (
    <Modal title={person.name || 'Photo'} onClose={onClose}>
      <img src={src} alt={`${person.name || 'Profile'} photo`} className="mx-auto aspect-square w-full max-w-sm rounded-full object-cover" />
    </Modal>
  );
}
