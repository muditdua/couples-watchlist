import { useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import Modal from './Modal';

const VIEW = 260;   // px, the square area you drag inside
const CIRCLE = 224; // px, the circle that becomes your profile photo
const OUT = 160;    // small photo used in lists, in px
const OUT_LARGE = 320; // sharper copy used when a photo is enlarged

// Drag to move, pinch or slide to zoom. What is inside the circle is what gets saved.
export default function PhotoCropper({ src, onCancel, onDone }) {
  const imgRef = useRef(null);
  const [nat, setNat] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map());
  const pinch = useRef(null);

  const base = nat ? CIRCLE / Math.min(nat.w, nat.h) : 1; // at zoom 1 the short side fills the circle
  const scale = base * zoom;

  // keep the photo covering the circle, so there are never empty edges
  const clamp = (p, z) => {
    if (!nat) return p;
    const s = base * z;
    const mx = Math.max(0, (nat.w * s - CIRCLE) / 2);
    const my = Math.max(0, (nat.h * s - CIRCLE) / 2);
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) };
  };
  const changeZoom = (z) => {
    const nz = Math.min(4, Math.max(1, z));
    setZoom(nz);
    setPos((p) => clamp(p, nz));
  };

  const down = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom };
    }
  };
  const move = (e) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      changeZoom((pinch.current.z * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.current.d);
    } else if (pointers.current.size === 1) {
      setPos((p) => clamp({ x: p.x + cur.x - prev.x, y: p.y + cur.y - prev.y }, zoom));
    }
  };
  const up = (e) => { pointers.current.delete(e.pointerId); pinch.current = null; };

  const finish = () => {
    const big = document.createElement('canvas');
    big.width = OUT_LARGE; big.height = OUT_LARGE;
    const size = CIRCLE / scale; // how much of the original fits inside the circle
    const sx = nat.w / 2 - pos.x / scale - size / 2;
    const sy = nat.h / 2 - pos.y / scale - size / 2;
    big.getContext('2d').drawImage(imgRef.current, sx, sy, size, size, 0, 0, OUT_LARGE, OUT_LARGE);
    const small = document.createElement('canvas');
    small.width = OUT; small.height = OUT;
    small.getContext('2d').drawImage(big, 0, 0, OUT, OUT);
    onDone({ small: small.toDataURL('image/jpeg', 0.88), large: big.toDataURL('image/jpeg', 0.85) });
  };

  return (
    <Modal title="Adjust your photo" onClose={onCancel}>
      <p className="mb-3 text-sm text-mist">Drag to move. Pinch or use the slider to zoom.</p>
      <div
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        style={{ width: VIEW, height: VIEW }}
        className="relative mx-auto touch-none select-none overflow-hidden rounded-2xl bg-black"
      >
        <img
          ref={imgRef} src={src} alt="" draggable={false}
          onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          style={nat ? {
            position: 'absolute', maxWidth: 'none',
            width: nat.w * scale, height: nat.h * scale,
            left: VIEW / 2 - (nat.w * scale) / 2 + pos.x, top: VIEW / 2 - (nat.h * scale) / 2 + pos.y,
          } : { opacity: 0 }}
        />
        <div
          className="pointer-events-none absolute rounded-full border-2 border-white/80"
          style={{ width: CIRCLE, height: CIRCLE, left: (VIEW - CIRCLE) / 2, top: (VIEW - CIRCLE) / 2, boxShadow: '0 0 0 999px rgba(23,13,26,0.72)' }}
        />
      </div>

      <div className="mx-auto mt-4 flex items-center gap-3" style={{ width: VIEW }}>
        <button onClick={() => changeZoom(zoom - 0.25)} aria-label="Zoom out" className="btn btn-ghost !h-10 !w-10 !px-0"><Minus size={16} /></button>
        <input
          type="range" min="1" max="4" step="0.01" value={zoom} onChange={(e) => changeZoom(Number(e.target.value))}
          aria-label="Zoom" className="h-2 flex-1 accent-blush"
        />
        <button onClick={() => changeZoom(zoom + 0.25)} aria-label="Zoom in" className="btn btn-ghost !h-10 !w-10 !px-0"><Plus size={16} /></button>
      </div>

      <div className="mt-5 flex gap-3">
        <button onClick={onCancel} className="btn btn-ghost flex-1">Cancel</button>
        <button onClick={finish} disabled={!nat} className="btn btn-primary flex-1">Use photo</button>
      </div>
    </Modal>
  );
}
