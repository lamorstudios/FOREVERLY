/**
 * Benachrichtigungs-Inhalte (emotional & modern) + In-App-Navigation.
 *
 * Ergänzt `lib/notifications.ts` (echte/lokale Push-Mechanik) um die fachlichen
 * Typen, ihre warme Sprache (Emoji + Text) und das Ziel beim Antippen. Für
 * Web/Demo werden Push-Benachrichtigungen simuliert; die Architektur für echtes
 * Push (Expo Push → FCM/APNs) ist als Andockpunkt vorbereitet.
 */

import type { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import type { AppNotification } from '@/types/models';

type IoniconName = keyof typeof Ionicons.glyphMap;

export type NotificationType =
  | 'status'
  | 'memory'
  | 'photo'
  | 'audio'
  | 'member_joined'
  | 'capsule_created'
  | 'capsule_opening'
  | 'event_soon'
  | 'sos'
  | 'location'
  | 'estate'
  | 'interview_reminder';

/** Optionales Navigationsziel, das in `AppNotification.data` mitgegeben wird. */
export interface NotificationTarget {
  /** Route im Home-Stack. */
  route?: string;
  /** Tab-übergreifendes Ziel (z. B. Fotos im Erinnerungen-Tab). */
  tab?: string;
  screen?: string;
  params?: Record<string, unknown>;
}

export interface NotificationData extends NotificationTarget {
  type?: NotificationType;
}

interface TypeMeta {
  category: AppNotification['category'];
  emoji: string;
  icon: IoniconName;
  color: string;
  label: string;
}

/** Darstellung & Einordnung je Benachrichtigungstyp. */
export const NOTIFICATION_META: Record<NotificationType, TypeMeta> = {
  status: { category: 'status', emoji: '💛', icon: 'heart-outline', color: colors.primary, label: 'Familienstatus' },
  memory: { category: 'info', emoji: '✨', icon: 'sparkles-outline', color: colors.gold, label: 'Neue Erinnerung' },
  photo: { category: 'info', emoji: '📸', icon: 'image-outline', color: colors.relationMarried, label: 'Neues Foto' },
  audio: { category: 'info', emoji: '🎤', icon: 'mic-outline', color: colors.success, label: 'Neue Aufnahme' },
  member_joined: { category: 'info', emoji: '🎉', icon: 'people-outline', color: colors.bronze, label: 'Neues Mitglied' },
  capsule_created: { category: 'info', emoji: '⏳', icon: 'time-outline', color: colors.bronze, label: 'Neue Zeitkapsel' },
  capsule_opening: { category: 'calendar', emoji: '⏳', icon: 'lock-open-outline', color: colors.gold, label: 'Zeitkapsel öffnet bald' },
  event_soon: { category: 'calendar', emoji: '🎉', icon: 'balloon-outline', color: colors.relationMarried, label: 'Familienevent' },
  sos: { category: 'emergency', emoji: '🚨', icon: 'alert-circle', color: colors.error, label: 'SOS' },
  location: { category: 'info', emoji: '📍', icon: 'location-outline', color: colors.relationMarried, label: 'Standort' },
  estate: { category: 'info', emoji: '🗝️', icon: 'file-tray-full-outline', color: colors.primary, label: 'Nachlass' },
  interview_reminder: { category: 'info', emoji: '🎙️', icon: 'chatbubbles-outline', color: colors.success, label: 'Interview' },
};

export interface NotificationMessage {
  title: string;
  body: string;
}

export interface MessageInput {
  name?: string;
  subject?: string;
  days?: number;
}

/** Erzeugt eine warme, freundliche Benachrichtigung (kein technischer Text). */
export function buildNotificationMessage(type: NotificationType, input: MessageInput = {}): NotificationMessage {
  const name = input.name ?? 'Jemand';
  const subject = input.subject ?? '';
  const days = input.days ?? 0;
  const e = NOTIFICATION_META[type].emoji;
  switch (type) {
    case 'status':
      return { title: `${e} ${name} fühlt sich gerade etwas allein.`, body: 'Schau doch mal nach – eine Nachricht tut gut.' };
    case 'memory':
      return { title: `${e} ${name} hat eine neue Erinnerung festgehalten.`, body: subject };
    case 'photo':
      return { title: `${e} ${name} hat neue Fotos geteilt.`, body: subject || 'Schau dir die neuen Momente an.' };
    case 'audio':
      return { title: `${e} ${name} hat eine neue Sprachnachricht aufgenommen.`, body: 'Hör dir die Originalstimme an.' };
    case 'member_joined':
      return { title: `${e} ${name} ist eurer Familie beigetreten.`, body: 'Heißt das neue Familienmitglied willkommen.' };
    case 'capsule_created':
      return { title: `${e} ${name} hat eine Zeitkapsel für die Zukunft erstellt.`, body: subject };
    case 'capsule_opening':
      return { title: `${e} Eure Zeitkapsel öffnet sich in ${days} ${days === 1 ? 'Tag' : 'Tagen'}.`, body: subject };
    case 'event_soon':
      return { title: `${e} Bald geht es los: ${subject || 'ein Familienevent'}.`, body: days <= 1 ? 'Es ist bald so weit.' : `Noch ${days} Tage.` };
    case 'sos':
      return { title: `${e} SOS von ${name} – Standort verfügbar.`, body: 'Bitte schau sofort nach.' };
    case 'location':
      return { title: `${e} ${name} teilt gerade den Heimweg.`, body: 'Du kannst den Weg live verfolgen.' };
    case 'estate':
      return { title: `${e} Ein Nachlasshinweis wurde aktualisiert.`, body: subject };
    case 'interview_reminder':
      return { title: `${e} Zeit, eine Geschichte zu bewahren.`, body: subject || `Nimm dir einen Moment für ${name}.` };
  }
}

/**
 * Simuliert eine Push-Benachrichtigung (Web/Demo). Im Echtbetrieb würde hier
 * der registrierte Push-Token-Dienst angesprochen. Bewusst nebenwirkungsarm.
 */
export function simulatePush(message: NotificationMessage): void {
  if (typeof console !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log(`[Push · Demo] ${message.title}`);
  }
}

/** Architektur-Andockpunkt für echtes Push (noch nicht aktiv). */
export const PUSH_ARCHITECTURE = {
  provider: 'expo-notifications', // später: Expo Push → FCM/APNs
  tokenStorage: 'profiles.push_token',
  enabledInDemo: false,
} as const;
