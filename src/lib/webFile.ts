import { Platform } from 'react-native';

/** Läuft die App im Web-Browser? */
export const isWeb = Platform.OS === 'web';

/**
 * Öffnet im Web einen echten Datei-Dialog (`<input type="file">`). Mit
 * `capture` öffnet sich auf Mobilgeräten direkt Kamera/Mikrofon-Aufnahme,
 * sonst die Datei-/Galerieauswahl. Gibt eine abspielbare Blob-URL zurück.
 *
 * Zuverlässiger Fallback, wo In-App-Aufnahme (expo-av/Kamera) im Browser nicht
 * funktioniert. Nur im Web aufrufen.
 */
export function pickMediaFile(accept: string, capture = false): Promise<{ uri: string; name: string } | null> {
  return new Promise((resolve) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc: any = (globalThis as any).document;
      if (!doc) return resolve(null);
      const input = doc.createElement('input');
      input.type = 'file';
      input.accept = accept;
      if (capture) input.setAttribute('capture', 'environment');
      input.style.display = 'none';
      input.onchange = () => {
        const file = input.files && input.files[0];
        try { doc.body.removeChild(input); } catch { /* ignore */ }
        if (!file) return resolve(null);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const url = (globalThis as any).URL.createObjectURL(file);
        resolve({ uri: url, name: file.name ?? 'aufnahme' });
      };
      doc.body.appendChild(input);
      input.click();
    } catch {
      resolve(null);
    }
  });
}
