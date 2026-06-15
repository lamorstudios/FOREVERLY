import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Fordert Benachrichtigungsrechte an (für Zeitkapsel-Hinweise). */
export async function registerForNotifications(): Promise<boolean> {
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
 * Plant eine lokale Erinnerung zum Öffnungszeitpunkt einer Zeitkapsel.
 * (MVP: lokale Benachrichtigung; serverseitige Push folgt in späterer Phase.)
 */
export async function scheduleCapsuleReminder(input: {
  capsuleId: string;
  title: string;
  openAt: string;
}): Promise<void> {
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
