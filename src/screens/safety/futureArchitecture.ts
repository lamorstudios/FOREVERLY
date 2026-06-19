/**
 * Architektur-Vorbereitung für spätere Sicherheits-Erweiterungen.
 *
 * Bewusst NICHT implementiert – nur Schnittstellen/Flags, damit kommende
 * Funktionen später sauber andocken können (Wearables, Sturzerkennung,
 * Gesundheitsdaten, Pflege-Modus).
 */

/** Feature-Flags – aktuell alle deaktiviert. */
export const SAFETY_FEATURE_FLAGS = {
  appleWatch: false,
  androidWear: false,
  fallDetection: false,
  healthData: false,
  careMode: false,
  seniorMode: true, // Architektur vorhanden (eigener Screen), Ausbau später
} as const;

/** Quelle eines automatisch ausgelösten Alarms (für späteren Ausbau). */
export type AutoAlertSource = 'fall_detection' | 'inactivity' | 'wearable' | 'manual';

/** Platzhalter für eine spätere Wearable-Anbindung (Watch/Wear). */
export interface WearableLink {
  platform: 'apple_watch' | 'android_wear';
  paired: boolean;
  lastSeen: string | null;
}

/** Platzhalter für einen optionalen Pflege-Modus. */
export interface CareModeConfig {
  enabled: boolean;
  caregiverPersonIds: string[];
  dailyCheckIn: boolean;
}
