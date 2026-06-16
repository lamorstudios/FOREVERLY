/**
 * Architektur-Vorbereitung für Phase 14.
 * Bewusst NICHT implementiert – nur Flags/Schnittstellen als Andockpunkte.
 */

export const MUSEUM_FEATURE_FLAGS = {
  universe3D: false, // 3D-Familienuniversum
  immersiveWorld: false, // immersive Familienwelt
  arMemories: false, // AR-Erinnerungen
  vrMuseum: false, // VR-Familienmuseum
  generationTimeTravel: false, // immersive Generationen-Zeitreisen
  geoWorldMap: false, // echte Geo-/Weltkarte
} as const;

/** Platzhalter für einen späteren immersiven Raum. */
export interface ImmersiveRoom {
  id: string;
  kind: 'memory' | 'exhibition' | 'person';
  refId: string;
}
