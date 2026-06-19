import { config, isTranscriptionConfigured } from './config';

/**
 * Wird geworfen, wenn aktuell kein Transkriptions-Backend konfiguriert ist.
 * Die UI zeigt dann den ehrlichen Beta-Hinweis statt vorgetäuschtem Text.
 */
export class TranscriptionUnavailableError extends Error {
  constructor() {
    super('Automatische Transkription ist nicht konfiguriert.');
    this.name = 'TranscriptionUnavailableError';
  }
}

/** Ist die automatische Transkription aktuell verfügbar? */
export function isTranscriptionAvailable(): boolean {
  return isTranscriptionConfigured;
}

/**
 * Lädt eine lokale Aufnahme (file:// auf Native, blob: im Web) als Blob.
 */
async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return res.blob();
}

/**
 * Sendet die Aufnahme an den konfigurierten Speech-to-Text-Endpunkt und gibt
 * den erkannten Text zurück. Das Original-Audio wird hierbei nur gelesen, nie
 * verändert oder gelöscht.
 *
 * Erwartetes Backend (z. B. Supabase Edge Function → OpenAI Whisper):
 *   POST {transcribeUrl}  (multipart/form-data, Feld „file")
 *   → 200 { "text": "…" }
 *
 * Ist kein Endpunkt hinterlegt, wird {@link TranscriptionUnavailableError}
 * geworfen – es wird KEIN Text erfunden.
 */
export async function transcribeAudio(
  uri: string,
  opts?: { language?: string; signal?: AbortSignal },
): Promise<string> {
  if (!isTranscriptionConfigured || !config.transcribeUrl) {
    throw new TranscriptionUnavailableError();
  }

  const blob = await uriToBlob(uri);
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'm4a';

  const form = new FormData();
  // `file` ist der bei Whisper/most STT-APIs übliche Feldname.
  form.append('file', blob, `aufnahme.${ext}`);
  if (opts?.language) form.append('language', opts.language);

  const res = await fetch(config.transcribeUrl, {
    method: 'POST',
    body: form,
    signal: opts?.signal,
  });

  if (!res.ok) {
    throw new Error(`Transkriptionsdienst antwortete mit Status ${res.status}.`);
  }

  const data = (await res.json()) as { text?: string; transcript?: string };
  const text = (data.text ?? data.transcript ?? '').trim();
  if (!text) {
    throw new Error('Der Transkriptionsdienst lieferte keinen Text.');
  }
  return text;
}
