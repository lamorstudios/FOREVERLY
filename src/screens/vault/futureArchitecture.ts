/**
 * Architektur-Vorbereitung für spätere Nachlass-/Vermächtnis-Erweiterungen.
 *
 * Bewusst NICHT implementiert – nur Flags/Schnittstellen, damit kommende
 * Bausteine später sauber andocken können.
 */

export const VAULT_FEATURE_FLAGS = {
  notaryPartnerships: false, // Notar-Partnerschaften
  digitalEstateAdmin: false, // Digitale Nachlassverwaltung
  endToEndEncryption: false, // E2E-Verschlüsselung (vorbereitet)
  aiHistorianImport: false, // Vermächtnisse → KI-Familienhistoriker
  bookImport: false, // Vermächtnisse → Familienbuch
  filmImport: false, // Vermächtnisse → Familienfilm
} as const;

/** Platzhalter für eine spätere Notar-Anbindung. */
export interface NotaryPartner {
  id: string;
  name: string;
  city: string;
  verified: boolean;
}

/** Wohin ein Vermächtnis später automatisch einfließen kann. */
export type LegacyDestination = 'familienbuch' | 'historiker' | 'familienfilm';
