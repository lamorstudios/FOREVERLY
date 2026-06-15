/**
 * Foreverly Farbpalette
 *
 * Warm, emotional und vertrauenswürdig: Cremeweiß, Beigetöne, sanfte
 * Erdtöne und dezente Gold-Akzente. Bewusst keine Corporate-Optik.
 */
export const colors = {
  // Hintergründe
  background: '#FBF6EE', // Cremeweiß
  surface: '#FFFFFF',
  surfaceAlt: '#F3EADB', // sanftes Beige
  overlay: 'rgba(58, 47, 36, 0.45)',

  // Schrift
  textPrimary: '#3A2F24', // warmes Dunkelbraun
  textSecondary: '#6F6253',
  textMuted: '#9C8F7E',
  textOnAccent: '#FFFFFF',

  // Akzente
  primary: '#B07D4B', // warmes Karamell/Erdton
  primaryDark: '#8A5F35',
  primarySoft: '#E8D6BF',
  gold: '#C8A24A', // dezenter Gold-Akzent
  goldSoft: '#EBD9A8',

  // Status
  success: '#5B8A5A',
  error: '#B4524A',
  warning: '#CC9A3F',

  // Beziehungs-Kategorien (farbliche Verbindungen)
  relationBiological: '#5B8A5A', // Grün  – biologische Verwandtschaft
  relationMarried: '#4A78A8', // Blau  – angeheiratete Familie
  relationPatchwork: '#D6A93B', // Gelb  – Patchwork / Stieffamilie
  relationAdoption: '#8A6BB0', // Lila  – Adoption / Pflegefamilie

  // Linien & Ränder
  border: '#E3D7C4',
  divider: '#EDE4D5',

  // Schatten
  shadow: '#3A2F24',
} as const;

export type ColorName = keyof typeof colors;
