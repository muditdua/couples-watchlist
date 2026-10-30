// Options for personalising your profile and the app's accent colour

export const FONTS = [
  { id: 'classic', label: 'Classic', css: "'Figtree', system-ui, sans-serif", weight: 600 },
  { id: 'serif', label: 'Serif', css: "'Fraunces', Georgia, serif", weight: 600 },
  { id: 'elegant', label: 'Elegant', css: "'Playfair Display', Georgia, serif", weight: 600 },
  { id: 'script', label: 'Script', css: "'Pacifico', cursive", weight: 400 },
  { id: 'hand', label: 'Handwritten', css: "'Caveat', cursive", weight: 600 },
  { id: 'modern', label: 'Modern', css: "'Space Grotesk', system-ui, sans-serif", weight: 600 },
];

export const NAME_COLORS = ['#f0a8b8', '#f4c98b', '#a9c7f0', '#b5dcc0', '#d3b4f0', '#f58c82', '#8fe0d0', '#e8e8e8'];

export const ACCENTS = [
  { id: 'rose', label: 'Rose', rgb: '240 168 184', hex: '#f0a8b8' },
  { id: 'coral', label: 'Coral', rgb: '245 140 130', hex: '#f58c82' },
  { id: 'peach', label: 'Peach', rgb: '247 190 140', hex: '#f7be8c' },
  { id: 'lavender', label: 'Lavender', rgb: '196 167 240', hex: '#c4a7f0' },
  { id: 'sky', label: 'Sky', rgb: '150 195 240', hex: '#96c3f0' },
  { id: 'mint', label: 'Mint', rgb: '165 214 184', hex: '#a5d6b8' },
];

export const fontOf = (id) => FONTS.find((f) => f.id === id) ?? FONTS[0];

export function applyAccent(id) {
  const a = ACCENTS.find((x) => x.id === id) ?? ACCENTS[0];
  document.documentElement.style.setProperty('--blush', a.rgb);
}

// Fallback avatar colour when someone hasn't picked a name colour: same name, same colour
const AUTO = ['#f0a8b8', '#f4c98b', '#a9c7f0', '#b5dcc0', '#d3b4f0'];
export const autoColor = (name = '') => AUTO[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AUTO.length];

// Shrinks a picked photo so the cropper stays fast; also kept so the photo can be re-adjusted later
export async function photoToSource(file, max = 640) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * k); canvas.height = Math.round(bmp.height * k);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}
