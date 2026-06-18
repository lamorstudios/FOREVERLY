/**
 * FAMII Farbwelt 2026 – „Premium Family App"
 *
 * Reines Skin-Update: dieselben Token-Namen, neue Werte. Kühle, moderne
 * Indigo/Violett-Basis mit warmem Orange-Akzent, viel Weißraum, klare Karten.
 * Strukturen, Layouts und Logik bleiben unverändert – nur die Optik.
 */
export const colors = {
  // Hintergründe – hell, kühl, luftig
  background: '#FAFAF8', // sehr helles Off-White
  surface: '#FFFFFF', // Karten
  surfaceAlt: '#F2F3FB', // sehr helles Indigo-Grau
  surfaceMuted: '#E9EBF6', // dezente Tönung für Chips/Felder
  warmWhite: '#FDFDFF',
  sand: '#ECEEF7',
  overlay: 'rgba(30, 34, 54, 0.45)',

  // Schrift – kühles Slate statt Braun
  textPrimary: '#1E2233',
  textSecondary: '#5A6175',
  textMuted: '#9499AE',
  textOnAccent: '#FFFFFF',

  // Akzente – Indigo / Violett / Warm-Orange
  primary: '#5B6CFF', // Indigo
  primaryDark: '#4151E6', // dunkleres Indigo (Druck/Kontrast)
  primarySoft: '#E8EAFF', // helle Indigo-Tönung
  secondary: '#8C7BFF', // Violett
  secondarySoft: '#EFEBFF',
  accent: '#FFB86C', // warmes Orange
  accentSoft: '#FFF0DF',

  // Bestehende Akzent-Tokens beibehalten, auf die neue Welt gemappt
  gold: '#FFB86C', // Highlight (z. B. Premium) -> warmer Akzent
  goldSoft: '#FFF0DF',
  bronze: '#E89B4F',

  // Status
  success: '#4CAF86', // frisches Grün
  error: '#ED5A6B',
  warning: '#F2A33C',

  // Beziehungs-Kategorien (farbliche Verbindungen im Stammbaum)
  relationBiological: '#4CAF86', // Grün    – biologische Verwandtschaft
  relationMarried: '#5B6CFF', // Indigo  – angeheiratete Familie
  relationPatchwork: '#FFB86C', // Orange  – Patchwork / Stieffamilie
  relationAdoption: '#8C7BFF', // Violett – Adoption / Pflegefamilie

  // Farbcodierte Bereiche – sehr dezente Ambient-Tönungen (Hintergrund)
  tintHome: '#FFF4F6', // sanftes Rosa (warmer Empfang)
  tintFamily: '#FFF5E2', // Gold    – Familienwelt
  tintMemories: '#FFEDF2', // Rosé    – Erinnerungen
  tintCapsules: '#F1ECFF', // Lila    – Zeitkapseln
  tintHistorian: '#E7F7F0', // Mint    – Historiker / Wissen
  tintDocuments: '#E9F1FF', // Blau    – Dokumente
  tintHealth: '#E7F7F0', // Mint    – Gesundheit
  tintLegacy: '#FFECE9', // Warmrot – Nachlass / Legacy

  // Bereichs-Akzentfarben (Icons, CTAs, Badges) – kräftiger als die Tönungen
  sectionCapsules: '#8C7BFF', // Lila
  sectionMemories: '#F2789F', // Rosé
  sectionDocuments: '#4A86E8', // Blau
  sectionHealth: '#34C7A0', // Mint
  sectionFamily: '#E0A33C', // Gold
  sectionLegacy: '#E0564E', // Warmrot

  // Linien & Ränder – weich, kühl, kaum sichtbar
  border: '#ECEDF4',
  borderStrong: '#DCDEEC',
  divider: '#F0F1F8',

  // Schatten – kühles Tintenblau (premium Tiefe)
  shadow: '#1E2233',
} as const;

export type ColorName = keyof typeof colors;
