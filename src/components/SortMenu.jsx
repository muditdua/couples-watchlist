import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const OPTIONS = [
  ['shortest', 'Shortest first'],
  ['rating', 'Highest rated'],
  ['alpha', 'A to Z'],
  ['newest', 'Recently added'],
];

export default function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when tapping outside or pressing Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = OPTIONS.find(([v]) => v === value)?.[1];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox" aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-velvet bg-plum py-2.5 pl-4 pr-3 text-sm font-semibold text-stone-100 transition hover:border-blush/60"
      >
        {current}
        <ChevronDown size={16} className={`text-mist transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox" aria-label="Sort by"
          className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-velvet bg-plum p-1.5 shadow-2xl shadow-black/60"
        >
          {OPTIONS.map(([v, label]) => (
            <li key={v} role="option" aria-selected={value === v}>
              <button
                onClick={() => { onChange(v); setOpen(false); }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-velvet ${
                  value === v ? 'font-semibold text-blush' : 'text-stone-100'
                }`}
              >
                {label}
                {value === v && <Check size={16} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}