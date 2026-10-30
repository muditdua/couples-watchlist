import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';

// Bottom sheet on phones, centered dialog on larger screens
const stack = []; // open pop-ups, so Escape only closes the one on top

export default function Modal({ title, onClose, children, wide = false }) {
  useScrollLock();
  const id = useRef({});
  useEffect(() => {
    stack.push(id.current);
    return () => { stack.splice(stack.indexOf(id.current), 1); };
  }, []);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && stack[stack.length - 1] === id.current && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[92dvh] w-full ${wide ? 'max-w-2xl' : 'max-w-xl'} flex-col rounded-t-3xl bg-night border border-velvet sm:rounded-3xl`}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h2 className="font-display text-2xl font-semibold leading-tight">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="shrink-0 rounded-full p-3 text-mist hover:bg-velvet">
            <X size={20} />
          </button>
        </div>
        <div className="no-scrollbar overscroll-contain overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}
