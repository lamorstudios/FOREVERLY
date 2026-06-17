import { Linking, Platform, Share } from 'react-native';
import { notify } from './confirm';

/**
 * Einladung/Link teilen – einfache, zuverlässige Optionen für Nicht-Techniker:
 * WhatsApp, E-Mail, Kopieren und der native Teilen-Dialog. Funktioniert im Web
 * (Linking/Clipboard) und nativ.
 */

/** Kurzer, persönlicher Einladungstext (kein Entwickler-Jargon, Link am Ende). */
export function inviteMessage(link: string, inviterFirstName?: string | null): string {
  const opener = inviterFirstName
    ? `${inviterFirstName} lädt dich zu FAMII ein ❤️`
    : 'Du bist zu FAMII eingeladen ❤️';
  return (
    `${opener}\n\n` +
    'Eure Familie kann hier Erinnerungen, Fotos und Geschichten gemeinsam bewahren.\n\n' +
    'Einladung öffnen:\n' +
    link
  );
}

export async function openWhatsApp(text: string): Promise<void> {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  try {
    await Linking.openURL(url);
  } catch {
    notify('WhatsApp', 'WhatsApp konnte nicht geöffnet werden. Kopiere den Link stattdessen.');
  }
}

export async function openEmail(subject: string, body: string): Promise<void> {
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  try {
    await Linking.openURL(url);
  } catch {
    notify('E-Mail', 'E-Mail-Programm konnte nicht geöffnet werden. Kopiere den Link stattdessen.');
  }
}

/** Text in die Zwischenablage kopieren (web-tauglich). */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== 'undefined' &&
      (navigator as { clipboard?: { writeText?: (t: string) => Promise<void> } }).clipboard?.writeText
    ) {
      await (navigator as unknown as { clipboard: { writeText: (t: string) => Promise<void> } }).clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fällt unten durch */
  }
  return false;
}

/** Nativer Teilen-Dialog (iOS/Android) bzw. Web-Share, sofern verfügbar. */
export async function shareText(message: string): Promise<void> {
  try {
    const hasWebShare = typeof navigator !== 'undefined' && !!(navigator as { share?: unknown }).share;
    if (Platform.OS === 'web' && !hasWebShare) {
      const ok = await copyText(message);
      notify('Einladung', ok ? 'Link in die Zwischenablage kopiert.' : message);
      return;
    }
    await Share.share({ message });
  } catch {
    const ok = await copyText(message);
    notify('Einladung', ok ? 'Link in die Zwischenablage kopiert.' : message);
  }
}
