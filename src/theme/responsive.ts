import { useWindowDimensions } from 'react-native';

/** Zentrale Breakpoints. */
export const breakpoints = {
  mobile: 480,
  tablet: 768,
} as const;

/** Statische, app-weit genutzte Responsive-Werte. */
export const responsive = {
  mobileBreakpoint: breakpoints.mobile,
  tabletBreakpoint: breakpoints.tablet,
  cardMinWidth: 150,
  cardMaxWidth: 260,
  contentMaxWidth: 720, // begrenzt sehr breite Layouts (Tablet/Web)
} as const;

export interface ResponsiveInfo {
  width: number;
  isSmall: boolean;
  isTablet: boolean;
  /** Seitliches Bildschirm-Padding. */
  mobilePadding: number;
  /** Vertikaler Standardabstand. */
  responsiveSpacing: number;
  /** Schriftskalierung für sehr kleine/große Geräte. */
  fontScale: number;
  /** Spaltenzahl für Karten-Raster (Personen etc.). */
  columns: number;
  cardMinWidth: number;
  cardMaxWidth: number;
  contentMaxWidth: number;
}

/**
 * Liefert reaktive Responsive-Werte. Reagiert auf Größenänderungen
 * (Rotation, Web-Resize) über useWindowDimensions.
 */
export function useResponsive(): ResponsiveInfo {
  const { width } = useWindowDimensions();
  const isSmall = width < 360;
  const isTablet = width >= breakpoints.tablet;

  const mobilePadding = isSmall ? 12 : isTablet ? 28 : 16;
  const responsiveSpacing = isSmall ? 12 : isTablet ? 20 : 16;
  const fontScale = isSmall ? 0.94 : isTablet ? 1.05 : 1;
  const columns = isTablet ? 3 : width >= 400 ? 2 : 1;

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
