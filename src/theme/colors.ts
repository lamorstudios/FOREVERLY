/**
 * FAMII Farbwelt 2.0
 *
 * Ruhig, hochwertig und emotional. Helle, warme Cremetöne als Basis,
 * dezentes Gold/Bronze als Akzent. Weniger Braun, mehr Weißraum-Gefühl –
 * im Geist moderner Premium-Apps (Apple, Headspace, Airbnb).
 */
export const colors = {
  // Hintergründe – heller, luftiger, warm
  background: '#FBF8F3', // warmes Cremeweiß
  surface: '#FFFFFF',
  surfaceAlt: '#F4EFE7', // sehr helles Sand
  surfaceMuted: '#ECE5DA', // dezente Tönung für Chips/Felder
  warmWhite: '#FFFDF9',
  sand: '#EAE1D2',
  champagne: '#E9DCC4', // sanftes Champagner für dezente Akzente
  taupe: '#8C7E69', // warmes Taupe
  overlay: 'rgba(34, 28, 22, 0.40)',

  // Schrift – warmes Anthrazit statt Braun
  textPrimary: '#2B2620',
  textSecondary: '#6E6557',
  textMuted: '#A69C8C',
  textOnAccent: '#FFFFFF',

  // Akzente – sanfteres Champagner-Gold/Bronze (weniger kräftig)
  primary: '#B6864E', // warmes Bronze-Gold
  primaryDark: '#8E6536',
  primarySoft: '#F1E7D6',
  gold: '#CBA869', // dezentes Champagner-Gold (weicher)
  goldSoft: '#F2E9D7',
  bronze: '#A37C52',

  // Status
  success: '#5E9C7B', // ruhiges Salbeigrün
  error: '#C25B52',
  warning: '#D2A458',

  // Beziehungs-Kategorien (farbliche Verbindungen im Stammbaum)
  relationBiological: '#5B8A5A', // Grün  – biologische Verwandtschaft
  relationMarried: '#4A78A8', // Blau  – angeheiratete Familie
  relationPatchwork: '#D6A93B', // Gelb  – Patchwork / Stieffamilie
  relationAdoption: '#8A6BB0', // Lila  – Adoption / Pflegefamilie

  // Sehr dezente Bereichs-Tönungen (Orientierung je App-Bereich, seniorengerecht)
  tintHome: '#FBF8F3', // warmes Beige (Standard)
  tintFamily: '#EEF3F8', // leichtes Blau – Familienwelt
  tintMemories: '#FAF4E9', // warmes Champagner – Erinnerungen
  tintCapsules: '#F4F0F8', // sanftes Violett – Zeitkapseln
  tintHistorian: '#EEF4EE', // dezentes Grün – Historiker

  // Linien & Ränder – weicher, kaum sichtbar
  border: '#EFE9DE',
  borderStrong: '#E5DCCC',
  divider: '#F4EEE4',

  // Schatten
  shadow: '#2B2620',
} as const;

export type ColorName = keyof typeof colors;
