/**
 * Typografie 2.0
 *
 * Klare, moderne Hierarchie: große, etwas enger laufende Überschriften
 * (negatives letterSpacing wie bei Apple/Linear) und ruhig lesbare
 * Fließtexte. Weiterhin angenehm groß – auch für ältere Augen.
 */
export const typography = {
  display: { fontSize: 40, lineHeight: 46, fontWeight: '800' as const, letterSpacing: -0.6 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const, letterSpacing: -0.5 },
  heading: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.4 },
  subheading: { fontSize: 21, lineHeight: 28, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 17, lineHeight: 26, fontWeight: '400' as const, letterSpacing: 0 },
  bodyStrong: { fontSize: 17, lineHeight: 26, fontWeight: '600' as const, letterSpacing: 0 },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const, letterSpacing: 0.1 },
  caption: { fontSize: 13.5, lineHeight: 18, fontWeight: '500' as const, letterSpacing: 0.1 },
  button: { fontSize: 17, lineHeight: 22, fontWeight: '700' as const, letterSpacing: 0.2 },
} as const;

export type TypographyVariant = keyof typeof typography;
