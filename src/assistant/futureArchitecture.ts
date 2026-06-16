/**
 * Architektur-Vorbereitung für Phase 12 (KI-Assistent 2.0).
 * Bewusst NICHT implementiert – nur Flags/Schnittstellen als Andockpunkte.
 */

export const ASSISTANT_FEATURE_FLAGS = {
  voiceAssistant: false, // Sprachassistent
  voiceChat: false, // freihändiger Voice-Chat
  historian2: false, // Familienhistoriker 2.0 (LLM-Zusammenfassungen)
  aiBooks: false, // KI-generierte Familienbücher
  aiDocumentaries: false, // KI-generierte Familiendokumentationen
  proactivePush: false, // proaktive Benachrichtigungen
} as const;

/** Spätere Sprach-Sitzung (Platzhalter). */
export interface VoiceSession {
  id: string;
  language: 'de' | 'en';
  active: boolean;
}
