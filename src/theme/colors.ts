/**
 * Foreverly Farbwelt 2.0
 *
 * Ruhig, hochwertig und emotional. Helle, warme Cremetöne als Basis,
 * dezentes Gold/Bronze als Akzent. Weniger Braun, mehr Weißraum-Gefühl –
 * im Geist moderner Premium-Apps (Apple, Headspace, Airbnb).
 */
export const colors = {
  // Hintergründe – heller, luftiger
  background: '#FAF7F2', // warmes Cremeweiß
  surface: '#FFFFFF',
  surfaceAlt: '#F4EFE7', // sehr helles Sand
  surfaceMuted: '#EFE8DC', // dezente Tönung für Chips/Felder
  warmWhite: '#FFFDF9',
  sand: '#EDE5D7',
  overlay: 'rgba(34, 28, 22, 0.42)',

  // Schrift – warmes Anthrazit statt Braun
  textPrimary: '#2B2620',
  textSecondary: '#6E6557',
  textMuted: '#A69C8C',
  textOnAccent: '#FFFFFF',

  // Akzente – warmes Gold & Bronze
  primary: '#BE8A4E', // warmes Bronze-Gold
  primaryDark: '#9A6B38',
  primarySoft: '#F1E6D4',
  gold: '#D4A95C', // leuchtendes, dezentes Gold
  goldSoft: '#F4E8CC',
  bronze: '#A9763F',

  // Status
  success: '#5E9C7B', // ruhiges Salbeigrün
  error: '#C25B52',
  warning: '#D6A24A',

  // Beziehungs-Kategorien (farbliche Verbindungen im Stammbaum)
  relationBiological: '#5B8A5A', // Grün  – biologische Verwandtschaft
  relationMarried: '#4A78A8', // Blau  – angeheiratete Familie
  relationPatchwork: '#D6A93B', // Gelb  – Patchwork / Stieffamilie
  relationAdoption: '#8A6BB0', // Lila  – Adoption / Pflegefamilie

  // Sehr dezente Bereichs-Tönungen (Orientierung je App-Bereich, seniorengerecht)
  tintHome: '#FAF7F2', // warmes Beige (Standard)
  tintFamily: '#EEF3F8', // leichtes Blau – Familienwelt
  tintMemories: '#FAF3E6', // warmes Gold – Erinnerungen
  tintCapsules: '#F4F0F8', // sanftes Violett – Zeitkapseln
  tintHistorian: '#EEF4EE', // dezentes Grün – Historiker

  // Linien & Ränder – weicher, kaum sichtbar
  border: '#ECE4D6',
  borderStrong: '#E0D6C4',
  divider: '#F1EBE0',

  // Schatten
  shadow: '#2B2620',
} as const;

export type ColorName = keyof typeof colors;
