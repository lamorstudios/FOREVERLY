/**
 * Typografie – bewusst große Schriftgrößen für gute Lesbarkeit,
 * auch für ältere Menschen.
 */
export const typography = {
  // Große, freundliche Größen
  display: { fontSize: 34, lineHeight: 42, fontWeight: '700' as const },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  heading: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
  subheading: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  body: { fontSize: 18, lineHeight: 26, fontWeight: '400' as const },
  bodyStrong: { fontSize: 18, lineHeight: 26, fontWeight: '600' as const },
  label: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const },
  button: { fontSize: 20, lineHeight: 24, fontWeight: '700' as const },
} as const;

export type TypographyVariant = keyof typeof typography;
