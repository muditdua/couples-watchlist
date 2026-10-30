import { autoColor, fontOf } from '../lib/customize';

// person = { name, avatar?, name_color?, name_font? }
export function Avatar({ person, size = 20 }) {
  const name = person?.name || '?';
  if (person?.avatar) {
    return <img src={person.avatar} alt="" style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover" />;
  }
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: person?.name_color || autoColor(name), width: size, height: size, fontSize: size * 0.5 }}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-night"
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

// The name in the person's chosen font and colour
export function PersonName({ person, className = '' }) {
  const font = fontOf(person?.name_font);
  return (
    <span
      style={{ fontFamily: font.css, fontWeight: font.weight, color: person?.name_color || undefined }}
      className={className}
    >
      {person?.name}
    </span>
  );
}

// Tap the name to open that person's profile (needs person.id and onOpen)
export function AddedBy({ person, onOpen }) {
  if (!person?.name) return null;
  const inner = (
    <>
      <Avatar person={person} />
      <span className="min-w-0 truncate">
        Added by <PersonName person={person} className={person.name_color ? '' : 'text-stone-200'} />
      </span>
    </>
  );
  return (
    <div className="border-t border-velvet pt-2.5 text-xs text-mist">
      {onOpen && person.id ? (
        <button onClick={onOpen} className="relative z-10 flex max-w-full items-center gap-2 rounded-full text-left hover:underline">{inner}</button>
      ) : <p className="flex items-center gap-2">{inner}</p>}
    </div>
  );
}
