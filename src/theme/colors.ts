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
  surfaceAlt: '#F4F0FF', // sehr helles Lila
  surfaceMuted: '#EEF0F6', // dezente Tönung für Chips/Felder
  warmWhite: '#FFFFFF',
  sand: '#EEF0F6',
  overlay: 'rgba(31, 34, 48, 0.45)',

  // Schrift
  textPrimary: '#1F2230',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnAccent: '#FFFFFF',

  // Akzente – Pink / Lila / Blau (Premium-Familienpalette)
  primary: '#B48FFF', // Lila (zentrale Markenfarbe)
  primaryDark: '#7C5FE0', // dunkleres Lila (Text/Kontrast)
  primarySoft: '#F4F0FF', // Soft Purple
  secondary: '#F28FD6', // Pink
  secondarySoft: '#FCE7F6', // Soft Pink
  tertiary: '#6F8CFF', // Blau
  accent: '#F28FD6', // Pink-Akzent
  accentSoft: '#FCE7F6',

  // Soft-Flächen (Chips, Icon-Hintergründe)
  softPink: '#FCE7F6',
  softPurple: '#F4F0FF',
  softBlue: '#EEF4FF',

  // Bottom-Navigation
  navActive: '#7D8BFF',
  navInactive: '#9CA3AF',

  // Icon-Kategoriefarben (eindeutige Wiedererkennung)
  iconBirthday: '#F6B44C',
  iconCapsule: '#7D8BFF',
  iconAudio: '#E86ACD',
  iconDocument: '#5E92FF',
  iconLegacy: '#FF7AA5',
  iconPlaces: '#49B38A',
  iconContacts: '#4DB6FF',
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
