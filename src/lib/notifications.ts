import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const NOTIFICATIONS_SUPPORTED = Platform.OS !== 'web';

if (NOTIFICATIONS_SUPPORTED) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Fordert Benachrichtigungsrechte an (für Zeitkapsel-Hinweise). */
export async function registerForNotifications(): Promise<boolean> {
  if (!NOTIFICATIONS_SUPPORTED) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Foreverly',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  return granted;
}

/**
 * Technische Grundlage für Push-Benachrichtigungen: liefert den Expo-Push-Token
 * des Geräts (z. B. um ihn später serverseitig zu speichern). Gibt `null`,
 * solange das EAS-Projekt noch nicht initialisiert ist oder im Web/Simulator.
 */
export async function registerPushToken(): Promise<string | null> {
  if (!NOTIFICATIONS_SUPPORTED) return null;
  const granted = await registerForNotifications();
  if (!granted) return null;
  const extra = (Constants.expoConfig?.extra ?? {}) as { eas?: { projectId?: string } };
  const projectId =
    extra.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  if (!projectId) return null; // EAS-Projekt noch nicht eingerichtet (eas init)
  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}

/**
 * Zeigt sofort eine lokale Benachrichtigung an (Beta/Test-Modus). Auf echten
 * Geräten erscheint sie als System-Mitteilung; im Web ein No-Op. Bildet die
 * Brücke zwischen „simuliert" und echtem Push, bis der Server-Versand steht.
 */
export async function presentLocalNotification(
  title: string,
  body?: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!NOTIFICATIONS_SUPPORTED) return;
  await registerForNotifications();
  await Notifications.scheduleNotificationAsync({
    content: { title, body: body ?? '', data: data ?? {} },
    trigger: null, // sofort
  });
}

/**
 * Plant eine lokale Erinnerung zum Öffnungszeitpunkt einer Zeitkapsel.
 * (MVP: lokale Benachrichtigung; serverseitige Push folgt in späterer Phase.)
 */
export async function scheduleCapsuleReminder(input: {
  capsuleId: string;
  title: string;
  openAt: string;
}): Promise<void> {
  if (!NOTIFICATIONS_SUPPORTED) return;
  const openDate = new Date(input.openAt);
  if (Number.isNaN(openDate.getTime()) || openDate.getTime() <= Date.now()) {
    return;
  }
  await Notifications.scheduleNotificationAsync({
    identifier: `capsule-${input.capsuleId}`,
    content: {
      title: 'Eine Zeitkapsel hat sich geöffnet 💛',
      body: `„${input.title}" ist jetzt für dich bereit.`,
      data: { capsuleId: input.capsuleId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: openDate,
    },
  });
}
