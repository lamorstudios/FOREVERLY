import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NotificationType } from './notificationCenter';

/**
 * Benachrichtigungs-Einstellungen pro Kategorie (lokal gespeichert).
 * Bestimmt, ob eine Benachrichtigung eines bestimmten Typs zugestellt wird.
 */
const KEY = 'foreverly.notifications';

export type PrefKey =
  | 'family'
  | 'memories'
  | 'birthdays'
  | 'events'
  | 'sos'
  | 'capsules'
  | 'location'
  | 'estate';

export const NOTIFICATION_CATEGORIES: { key: PrefKey; label: string }[] = [
  { key: 'family', label: 'Familie (Beitritte & Status)' },
  { key: 'memories', label: 'Erinnerungen, Fotos, Videos & Audios' },
  { key: 'birthdays', label: 'Geburtstage & Jubiläen' },
  { key: 'events', label: 'Familienevents' },
  { key: 'sos', label: 'SOS-Notfälle' },
  { key: 'capsules', label: 'Zeitkapseln' },
  { key: 'location', label: 'Standortfreigaben & Heimweg' },
  { key: 'estate', label: 'Nachlass-Freigaben' },
];

/** Welche Einstellung steuert welchen Benachrichtigungstyp? */
export const TYPE_TO_CATEGORY: Record<NotificationType, PrefKey> = {
  status: 'family',
  member_joined: 'family',
  memory: 'memories',
  photo: 'memories',
  audio: 'memories',
  video: 'memories',
  interview_reminder: 'memories',
  interview_saved: 'memories',
  birthday: 'birthdays',
  event_soon: 'events',
  capsule_created: 'capsules',
  capsule_opening: 'capsules',
  sos: 'sos',
  location: 'location',
  estate: 'estate',
};

export type NotificationPrefs = Record<PrefKey, boolean>;

export function defaultPrefs(): NotificationPrefs {
  return Object.fromEntries(NOTIFICATION_CATEGORIES.map((c) => [c.key, true])) as NotificationPrefs;
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const base = defaultPrefs();
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...base, ...JSON.parse(raw) } : base;
  } catch {
    return base;
  }
}

export async function setNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}

/** Soll ein Benachrichtigungstyp laut Einstellungen zugestellt werden? */
export function isTypeEnabled(prefs: NotificationPrefs, type: NotificationType): boolean {
  return prefs[TYPE_TO_CATEGORY[type]] ?? true;
}
