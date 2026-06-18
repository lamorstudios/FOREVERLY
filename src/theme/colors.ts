/**
 * FAMII Farbwelt 2026 – „Premium Family App"
 *
 * Reines Skin-Update: dieselben Token-Namen, neue Werte. Kühle, moderne
 * Indigo/Violett-Basis mit warmem Orange-Akzent, viel Weißraum, klare Karten.
 * Strukturen, Layouts und Logik bleiben unverändert – nur die Optik.
 */
export const colors = {
  // Hintergründe – hell, ruhig, neutral (kein starker Seiten-Gradient)
  background: '#FAFAFC', // sehr helles Off-White
  surface: '#FFFFFF', // Karten
  surfaceAlt: '#EEF1F8', // sehr helles Kühlgrau-Blau
  surfaceMuted: '#EEF0F6', // dezente Tönung für Chips/Felder
  warmWhite: '#FFFFFF',
  sand: '#EEF0F6',
  overlay: 'rgba(31, 34, 48, 0.45)',

  // Schrift
  textPrimary: '#1F2230',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnAccent: '#FFFFFF',

  // Akzente – Royal-Blau / Periwinkle / Apricot (Premium-Familienpalette)
  primary: '#5B7CFF', // Royal-Blau (zentrale Markenfarbe)
  primaryDark: '#4457D9', // tieferes Blau (Text/Kontrast)
  primarySoft: '#E9EEFF', // Soft Blue
  secondary: '#8A7DFF', // Periwinkle/Violett
  secondarySoft: '#EFECFF',
  tertiary: '#FFB86C', // Apricot
  accent: '#FFB86C', // Apricot-Akzent
  accentSoft: '#FFEFDD',

  // Soft-Flächen (Chips, Icon-Hintergründe)
  softPink: '#FCE7F6',
  softPurple: '#EFECFF',
  softBlue: '#E9EEFF',

  // Bottom-Navigation
  navActive: '#5B7CFF',
  navInactive: '#9CA3AF',

  // Icon-Kategoriefarben (eindeutige Wiedererkennung)
  iconBirthday: '#F6B44C',
  iconCapsule: '#8A7DFF', // Zeitkapseln – Periwinkle
  iconAudio: '#E86ACD',
  iconDocument: '#5B7CFF', // Dokumente – Blau
  iconLegacy: '#FFB86C', // Nachlass – Apricot
  iconMemories: '#FF7FB2', // Erinnerungen – Rosa
  iconFamily: '#58C48A', // Familie – Grün
  iconPlaces: '#49B38A',
  iconContacts: '#4FC3F7', // Kontakte – Türkis
  iconVorsorge: '#F0B14A',

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
