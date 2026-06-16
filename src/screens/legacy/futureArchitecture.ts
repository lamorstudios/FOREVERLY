/**
 * Architektur-Vorbereitung für Phase 13.
 * Bewusst NICHT implementiert – nur Flags/Schnittstellen als Andockpunkte.
 */

export const LEGACY_FEATURE_FLAGS = {
  familyUniverse3D: false, // Familienuniversum in 3D
  aiDocumentaries: false, // KI-generierte Dokumentationen
  familyMuseum: false, // Familienmuseum
  generationArchive: false, // Generationenarchiv
  crossGenerationNetwork: false, // Familiennetzwerk über Generationen
} as const;

/** Platzhalter für ein späteres Generationenarchiv. */
export interface GenerationArchiveNode {
  generation: number;
  personIds: string[];
}
