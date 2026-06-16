import { useWindowDimensions } from 'react-native';

/** Zentrale Breakpoints. */
export const breakpoints = {
  smallPhone: 390, // darunter: sehr kleine Smartphones (z.B. 360px)
  tablet: 768,
} as const;

/** Statische, app-weit genutzte Responsive-Werte. */
export const responsive = {
  smallBreakpoint: breakpoints.smallPhone,
  tabletBreakpoint: breakpoints.tablet,
  cardMinWidth: 150,
  cardMaxWidth: 260,
  contentMaxWidth: 720, // begrenzt sehr breite Layouts (Tablet/Web)
} as const;

export interface ResponsiveInfo {
  width: number;
  /** < 390px (z.B. iPhone SE, 360px-Geräte). */
  isSmall: boolean;
  /** >= 768px. */
  isTablet: boolean;
  /** Seitliches Bildschirm-Padding. */
  mobilePadding: number;
  /** Vertikaler Standardabstand. */
  responsiveSpacing: number;
  /** Schriftskalierung für sehr kleine/große Geräte. */
  fontScale: number;
  /** Spaltenzahl für Karten-Raster (max. 2). */
  columns: number;
  cardMinWidth: number;
  cardMaxWidth: number;
  contentMaxWidth: number;
}

/**
 * Liefert reaktive Responsive-Werte. Reagiert auf Größenänderungen
 * (Rotation, Web-Resize) über useWindowDimensions.
 *
 * Breakpoints: Small Phone < 390px · Phone 390–767px · Tablet >= 768px.
 */
export function useResponsive(): ResponsiveInfo {
  const { width } = useWindowDimensions();
  const isSmall = width < breakpoints.smallPhone;
  const isTablet = width >= breakpoints.tablet;

  const mobilePadding = isSmall ? 12 : isTablet ? 28 : 16;
  const responsiveSpacing = isSmall ? 12 : isTablet ? 20 : 16;
  const fontScale = isSmall ? 0.9 : isTablet ? 1.05 : 1;
  // maximal 2 Karten pro Reihe; sehr kleine Geräte: 1 Karte
  const columns = isSmall ? 1 : 2;

  return {
    width,
    isSmall,
    isTablet,
    mobilePadding,
    responsiveSpacing,
    fontScale,
    columns,
    cardMinWidth: responsive.cardMinWidth,
    cardMaxWidth: responsive.cardMaxWidth,
    contentMaxWidth: responsive.contentMaxWidth,
  };
}
