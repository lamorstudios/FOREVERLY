/**
 * Architektur-Vorbereitung für Phase 9 (Familienbuch, Familienfilm,
 * KI-Dokumentation, automatische Chroniken).
 *
 * Bewusst NICHT implementiert – nur Flags/Schnittstellen, damit die kommenden
 * Bausteine auf der bestehenden, quellengebundenen Wissensbasis aufsetzen.
 */
import type { HistorianSource } from './engine';

export const HISTORIAN_FEATURE_FLAGS = {
  familienbuch: false, // Buchgenerierung aus Wissensbasis
  familienfilm: false, // Video-Schnitt aus Momenten/Videos
  kiDokumentation: false, // narrative KI-Dokumentation
  autoChroniken: false, // automatische Jahres-/Personenchroniken
  audioTranscription: true, // Feld vorhanden, echte STT-Pipeline später
  videoAnalysis: false, // Sprache/Untertitel/Personen/Ereignisse
} as const;

/** Platzhalter: ein narrativer Abschnitt mit gebundenen Quellen (Buch/Film). */
export interface NarrativeSection {
  title: string;
  paragraphs: string[];
  sources: HistorianSource[];
}

/** Ziel-Pipelines für Audio-/Video-Analyse (später anzudocken). */
export type MediaAnalysisJob =
  | { kind: 'audio_transcription'; audioId: string }
  | { kind: 'video_transcription'; momentId: string }
  | { kind: 'video_face_tagging'; momentId: string };
