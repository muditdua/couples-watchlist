// Small "Undo" bars above the bottom buttons
export default function UndoBars({ toasts, onUndo }) {
  if (!toasts.length) return null;
  return (
    <div
      aria-live="polite"
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
      className="pointer-events-none fixed inset-x-0 z-40 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-velvet bg-plum py-2 pl-4 pr-2 shadow-2xl shadow-black/60">
          <p className="min-w-0 truncate text-sm">{t.text}</p>
          <button onClick={() => onUndo(t.id)} className="btn btn-ghost shrink-0 !py-2 !text-sm text-blush">Undo</button>
        </div>
      ))}
    </div>
  );
}
