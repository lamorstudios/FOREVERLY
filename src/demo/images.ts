/**
 * Erzeugt hochwertige Platzhalter-Bilder als SVG-Data-URIs – ohne Netzwerk,
 * funktioniert sofort im Browser. Warme Verläufe und ruhige Formen statt
 * Wireframe-Optik. Wird nur im Demo-Modus verwendet.
 */

function svgToUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Warme, hochwertige Farbpaare für Monogramm-Porträts.
const PORTRAIT_GRADIENTS: [string, string][] = [
  ['#ECCFA1', '#C8974C'], // Gold
  ['#D7BBA6', '#AC7A4F'], // Terrakotta
  ['#CBCBB2', '#8E9E78'], // Salbei
  ['#D7C0C6', '#AC7C87'], // Altrosa
  ['#C7C5D6', '#8A85A6'], // gedämpftes Lavendel
  ['#D6C2AE', '#A37C5C'], // Mokka
  ['#CDD2C0', '#7E9683'], // Eukalyptus
];

function seedIndex(seed: string, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % max;
}

/** Modernes Monogramm-Porträt mit warmem Verlauf (für Personen/Profile). */
export function portraitImage(initials: string, bg?: string): string {
  const [c1, c2] = bg
    ? [bg, bg]
    : PORTRAIT_GRADIENTS[seedIndex(initials, PORTRAIT_GRADIENTS.length)]!;
  const id = `p${seedIndex(initials + c1, 99999)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/>
        <stop offset="1" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="320" height="320" fill="url(#${id})"/>
    <circle cx="248" cy="72" r="120" fill="#FFFFFF" opacity="0.08"/>
    <circle cx="60" cy="280" r="110" fill="#000000" opacity="0.05"/>
    <text x="160" y="158" font-family="Helvetica Neue, Arial, sans-serif"
      font-size="128" font-weight="700" fill="#FFFFFF" fill-opacity="0.95"
      text-anchor="middle" dominant-baseline="central">${escapeText(initials)}</text>
  </svg>`;
  return svgToUri(svg);
}

/** Warmes, foto-artiges Platzhalterbild (sanfte Landschaft) mit Beschriftung. */
export function photoImage(label: string, color = '#C8A24A'): string {
  const id = `f${seedIndex(label + color, 99999)}`;
  const dark = shade(color, -0.22);
  const light = shade(color, 0.42);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${light}"/>
        <stop offset="1" stop-color="${color}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#${id})"/>
    <circle cx="610" cy="150" r="64" fill="#FFFFFF" opacity="0.55"/>
    <path d="M0 430 C 180 350, 320 470, 480 410 C 620 360, 720 430, 800 400 L800 600 L0 600 Z"
      fill="${dark}" opacity="0.55"/>
    <path d="M0 500 C 160 450, 340 540, 520 500 C 660 470, 740 520, 800 500 L800 600 L0 600 Z"
      fill="${dark}" opacity="0.8"/>
    <rect width="800" height="600" fill="#000000" opacity="0.06"/>
    <text x="40" y="560" font-family="Helvetica Neue, Arial, sans-serif" font-size="34"
      font-weight="700" fill="#FFFFFF" fill-opacity="0.95">${escapeText(label)}</text>
  </svg>`;
  return svgToUri(svg);
}

/** Breites Familien-Coverbild mit warmem Verlauf. */
export function coverImage(_label: string): string {
  // Premium-Verlauf passend zur Buttonwelt: Blau -> Periwinkle -> Apricot (135°).
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="520">
    <defs>
      <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#5B7CFF"/>
        <stop offset="0.45" stop-color="#8A7DFF"/>
        <stop offset="1" stop-color="#FFB86C"/>
      </linearGradient>
    </defs>
    <rect width="1000" height="520" fill="url(#cg)"/>
    <circle cx="820" cy="120" r="220" fill="#FFFFFF" opacity="0.10"/>
    <circle cx="140" cy="430" r="180" fill="#FFFFFF" opacity="0.06"/>
    <path d="M500 175 C 545 130, 625 152, 625 212 C 625 268, 545 305, 500 338
      C 455 305, 375 268, 375 212 C 375 152, 455 130, 500 175 Z"
      fill="#FFFFFF" opacity="0.18"/>
  </svg>`;
  return svgToUri(svg);
}

/** Hellt eine Hex-Farbe auf (amount>0) oder dunkelt sie ab (amount<0). */
function shade(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function escapeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
