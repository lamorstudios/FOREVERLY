import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * Globale Navigations-Referenz, damit die interaktive Tour die App
 * tatsächlich durch die Bereiche führen kann (Tab-/Screen-Wechsel von außen).
 */
export const navigationRef = createNavigationContainerRef();

type LooseNav = { navigate: (name: string, params?: object) => void };

/** Wechselt zu Tab → Screen (für die geführte Tour). */
export function tourNavigate(tab: string, screen: string, params?: object): void {
  if (!navigationRef.isReady()) return;
  (navigationRef as unknown as LooseNav).navigate(tab, { screen, params });
}
