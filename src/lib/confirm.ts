import { Alert, Platform } from 'react-native';

/**
 * Plattformübergreifende Bestätigung.
 *
 * Hintergrund: `Alert.alert(...)` mit mehreren Buttons löst im **Web**
 * (react-native-web) die `onPress`-Callbacks nicht aus – Bestätigungsdialoge
 * wirken dort „tot". Diese Hilfsfunktion nutzt im Web das native
 * `window.confirm` und auf iOS/Android weiterhin `Alert.alert`.
 *
 * @returns Promise<boolean> – true, wenn bestätigt wurde.
 */
export function confirmAsync(opts: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}): Promise<boolean> {
  const { title, message = '', confirmLabel = 'OK', cancelLabel = 'Abbrechen', destructive } = opts;

  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    const ok = typeof window !== 'undefined' && typeof window.confirm === 'function'
      ? window.confirm(text)
      : true;
    return Promise.resolve(ok);
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ]);
  });
}

/** Einfacher Hinweis (eine Schaltfläche) – web-tauglich. */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    return;
  }
  Alert.alert(title, message);
}
