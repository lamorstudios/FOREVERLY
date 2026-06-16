/**
 * Foreverly Farbwelt 2.1 – „modern warm"
 *
 * Ruhig, hochwertig, emotional. Cremeweiß/Warmweiß/Sand als Basis, dezentes
 * Champagner/Taupe statt kräftigem Gold. Weichere Ränder, kaum Kontraste –
 * im Geist moderner Premium-Apps (Apple, Notion, Calm).
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
  taupe: '#8C7E69', // warmes Taupe (ruhige Sekundärfarbe)
  overlay: 'rgba(34, 28, 22, 0.40)',

  // Schrift – warmes Anthrazit statt Braun
  textPrimary: '#2B2620',
  textSecondary: '#6F6557',
  textMuted: '#A89E8E',
  textOnAccent: '#FFFFFF',

  // Akzente – sanftes Champagner-Gold/Bronze (weniger kräftig)
  primary: '#B68A54', // warmes, ruhiges Bronze-Gold
  primaryDark: '#90683A',
  primarySoft: '#F1E7D6',
  gold: '#CBA869', // dezentes Champagner-Gold (weicher als zuvor)
  goldSoft: '#F2E9D7',
  bronze: '#A37C52',

  // Status – ruhig, nicht grell
  success: '#5E9C7B', // ruhiges Salbeigrün
  error: '#C25B52',
  warning: '#D2A458',

  // Beziehungs-Kategorien (etwas weicher abgestimmt)
  relationBiological: '#5F8A5E', // Grün  – biologische Verwandtschaft
  relationMarried: '#5680A6', // Blau  – angeheiratete Familie
  relationPatchwork: '#CBA552', // Gold  – Patchwork / Stieffamilie
  relationAdoption: '#8A6FB0', // Lila  – Adoption / Pflegefamilie

  // Sehr dezente Bereichs-Tönungen (Orientierung je App-Bereich)
  tintHome: '#FBF8F3',
  tintFamily: '#EFF3F7', // leichtes Blau – Familienwelt
  tintMemories: '#FAF4E9', // warmes Champagner – Erinnerungen
  tintCapsules: '#F4F1F8', // sanftes Violett – Zeitkapseln
  tintHistorian: '#EFF4EF', // dezentes Grün – Historiker

  // Linien & Ränder – weicher, kaum sichtbar
  border: '#EFE9DE',
  borderStrong: '#E5DCCC',
  divider: '#F4EEE4',

  // Schatten
  shadow: '#2B2620',
} as const;

export type ColorName = keyof typeof colors;
