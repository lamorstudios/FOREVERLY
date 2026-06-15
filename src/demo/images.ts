/**
 * Erzeugt schlichte Platzhalter-Bilder als SVG-Data-URIs – ohne Netzwerk,
 * funktioniert sofort im Browser. Wird nur im Demo-Modus verwendet.
 */

function svgToUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Rundes Porträt mit Initialen (für Personen/Profile). */
export function portraitImage(initials: string, bg = '#E8D6BF'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
    <rect width="300" height="300" fill="${bg}"/>
    <circle cx="150" cy="120" r="58" fill="#B07D4B" opacity="0.85"/>
    <rect x="70" y="190" width="160" height="120" rx="80" fill="#B07D4B" opacity="0.85"/>
    <text x="150" y="135" font-family="Arial, sans-serif" font-size="64" font-weight="700"
      fill="#FBF6EE" text-anchor="middle">${initials}</text>
  </svg>`;
  return svgToUri(svg);
}

/** Querformat-Foto-Platzhalter mit Beschriftung. */
export function photoImage(label: string, color = '#C8A24A'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <rect width="800" height="600" fill="${color}" opacity="0.18"/>
    <rect width="800" height="600" fill="none" stroke="${color}" stroke-width="6"/>
    <circle cx="400" cy="250" r="70" fill="${color}" opacity="0.55"/>
    <path d="M250 430 L360 320 L440 400 L540 290 L650 430 Z" fill="${color}" opacity="0.55"/>
    <text x="400" y="540" font-family="Arial, sans-serif" font-size="34" font-weight="600"
      fill="#6F6253" text-anchor="middle">${escapeText(label)}</text>
  </svg>`;
  return svgToUri(svg);
}

/** Breites Familien-Coverbild. */
export function coverImage(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="500">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#E8D6BF"/>
        <stop offset="1" stop-color="#B07D4B"/>
      </linearGradient>
    </defs>
    <rect width="1000" height="500" fill="url(#g)"/>
    <path d="M500 150 C 540 110, 610 130, 610 185 C 610 235, 540 270, 500 300
      C 460 270, 390 235, 390 185 C 390 130, 460 110, 500 150 Z" fill="#C8A24A"/>
    <text x="500" y="430" font-family="Georgia, serif" font-size="54" font-weight="700"
      fill="#FBF6EE" text-anchor="middle">${escapeText(label)}</text>
  </svg>`;
  return svgToUri(svg);
}

function escapeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
