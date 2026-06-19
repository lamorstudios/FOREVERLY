import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Merkt sich einen Einladungscode, der beim Öffnen eines Einladungslinks
 * erkannt wurde – auch über einen OAuth-Redirect (Google) hinweg, bei dem
 * die ursprüngliche URL verloren geht.
 */
const KEY = 'foreverly.pendingInvite';

/** Extrahiert den Einladungscode aus einem Link (…/invite/CODE oder ?code=CODE). */
export function parseInviteCode(url: string | null | undefined): string | null {
  if (!url) return null;
  const path = url.match(/invite\/([A-Za-z0-9]{4,})/);
  if (path?.[1]) return path[1].toUpperCase();
  const query = url.match(/[?&]code=([A-Za-z0-9]{4,})/);
  if (query?.[1]) return query[1].toUpperCase();
  return null;
}

export async function setPendingInvite(code: string): Promise<void> {
  await AsyncStorage.setItem(KEY, code);
}

export async function getPendingInvite(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}

export async function clearPendingInvite(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
