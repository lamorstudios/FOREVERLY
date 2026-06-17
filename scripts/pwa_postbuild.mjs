/**
 * Post-Build für Web/PWA (läuft im Deploy nach `expo export`).
 *
 * - Kopiert stabile App-Icons + ein Social-Vorschaubild nach dist/
 * - Schreibt ein Web App Manifest (installierbar auf Android/iOS-Homescreen)
 * - Fügt PWA- und Open-Graph-/Twitter-Meta in index.html und 404.html ein
 *
 * Keine neuen App-Features – reines Web-/Beta-Polishing.
 */
import fs from 'node:fs';

const BASE = '/FOREVERLY';
const ORIGIN = 'https://lamorstudios.github.io/FOREVERLY';
const dist = 'dist';

if (!fs.existsSync(dist)) {
  console.error('dist/ nicht gefunden – zuerst `expo export --platform web` ausführen.');
  process.exit(1);
}

// 1) Stabile Icons + OG-Bild aus den App-Assets
const copy = (from, to) => { try { fs.copyFileSync(from, `${dist}/${to}`); } catch (e) { console.warn('skip', to, e.message); } };
copy('assets/icon.png', 'icon-192.png');
copy('assets/icon.png', 'icon-512.png');
copy('assets/icon.png', 'apple-touch-icon.png');
copy('assets/splash.png', 'og-image.png');

// 2) Web App Manifest
const manifest = {
  name: 'FAMII',
  short_name: 'FAMII',
  description: 'Familienbaum, Erinnerungen, Zeitkapseln und Familiengeschichte an einem Ort.',
  start_url: `${BASE}/`,
  scope: `${BASE}/`,
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#FBF6EE',
  theme_color: '#FBF6EE',
  icons: [
    { src: `${BASE}/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: `${BASE}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
};
fs.writeFileSync(`${dist}/manifest.json`, JSON.stringify(manifest, null, 2));

// 3) PWA- & Social-Meta vor </head> einfügen
const meta = [
  `<link rel="manifest" href="${BASE}/manifest.json" />`,
  `<meta name="theme-color" content="#FBF6EE" />`,
  `<meta name="mobile-web-app-capable" content="yes" />`,
  `<meta name="apple-mobile-web-app-capable" content="yes" />`,
  `<meta name="apple-mobile-web-app-status-bar-style" content="default" />`,
  `<meta name="apple-mobile-web-app-title" content="FAMII" />`,
  `<link rel="apple-touch-icon" href="${BASE}/apple-touch-icon.png" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:site_name" content="FAMII" />`,
  `<meta property="og:title" content="Einladung zu FAMII" />`,
  `<meta property="og:description" content="Bewahrt Erinnerungen, Fotos und eure Familiengeschichte gemeinsam." />`,
  `<meta property="og:image" content="${ORIGIN}/og-image.png" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="Einladung zu FAMII" />`,
  `<meta name="twitter:description" content="Bewahrt Erinnerungen, Fotos und eure Familiengeschichte gemeinsam." />`,
  `<meta name="twitter:image" content="${ORIGIN}/og-image.png" />`,
].join('');

for (const file of [`${dist}/index.html`, `${dist}/404.html`]) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('rel="manifest"')) {
    html = html.replace('</head>', `${meta}</head>`);
    fs.writeFileSync(file, html);
  }
}

console.log('PWA/Social post-build fertig: manifest.json + Icons + Meta-Tags.');
