import { Platform } from 'react-native';

/**
 * Live-Transkription über die Web Speech API des Browsers (kostenlos, ohne
 * Backend). Nur im Web verfügbar und nur in Browsern mit SpeechRecognition
 * (Chrome, Edge, teils Safari). Auf Native oder ohne Unterstützung greift der
 * Fallback (transcribeAudio nach der Aufnahme).
 */
export interface LiveTranscriber {
  start: () => void;
  stop: () => void;
}

interface Handlers {
  /** Vollständiger Text inkl. vorläufiger (interim) Erkennung – für Live-Anzeige. */
  onPartial?: (text: string) => void;
  /** Nur der bereits final erkannte Text – wird beim Stoppen übernommen. */
  onFinal?: (text: string) => void;
  onError?: () => void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function getSpeechRecognition(): any | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** Unterstützt dieser Browser Live-Transkription? */
export function isLiveTranscriptionSupported(): boolean {
  return getSpeechRecognition() != null;
}

/**
 * Erstellt einen Live-Transkriber. Gibt `null` zurück, wenn nicht verfügbar.
 */
export function createLiveTranscriber(
  handlers: Handlers,
  lang = 'de-DE',
): LiveTranscriber | null {
  const SR = getSpeechRecognition();
  if (!SR) return null;

  const recognition = new SR();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;

  let finalText = '';
  let stopped = false;

  recognition.onresult = (event: any) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      const txt = res[0]?.transcript ?? '';
      if (res.isFinal) finalText += txt;
      else interim += txt;
    }
    handlers.onPartial?.(`${finalText}${interim}`.trim());
    handlers.onFinal?.(finalText.trim());
  };
  recognition.onerror = () => handlers.onError?.();
  recognition.onend = () => {
    // continuous bricht manchmal von selbst ab – fortsetzen, solange nicht
    // bewusst gestoppt wurde.
    if (!stopped) {
      try {
        recognition.start();
      } catch {
        /* bereits gestartet */
      }
    }
  };

  return {
    start: () => {
      stopped = false;
      finalText = '';
      try {
        recognition.start();
      } catch {
        /* bereits gestartet */
      }
    },
    stop: () => {
      stopped = true;
      try {
        recognition.stop();
      } catch {
        /* nicht aktiv */
      }
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
