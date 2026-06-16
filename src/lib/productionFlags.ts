/**
 * Produktions-/Skalierungs-Flags (Phase 15).
 * Architektur-Andockpunkte – noch nicht aktiv im Demo-Modus.
 */

export const PRODUCTION_FLAGS = {
  pushNotifications: false, // echte Push-Benachrichtigungen (Server + Token)
  endToEndEncryption: false, // E2E-Verschlüsselung sensibler Inhalte
  backups: false, // automatisches Backup-System
  auditLogs: true, // Aktivitätsprotokoll vorhanden (activities)
  deviceManagement: false, // Geräteverwaltung
  sessionManagement: false, // Sitzungsverwaltung
  mediaCompression: false, // Foto-Komprimierung
  videoTranscoding: false, // Video-Transkodierung
  analytics: true, // datensparsame In-App-Kennzahlen
  billing: false, // echte Zahlungsabwicklung (Store/Stripe)
  adminDashboard: true, // betreiberinternes Admin-Dashboard (Kennzahlen)
} as const;

/** Datensparsame Kennzahlen-Schlüssel (keine invasiven Daten). */
export type AnalyticsMetric =
  | 'active_families'
  | 'daily_users'
  | 'uploads'
  | 'invitations'
  | 'capsules'
  | 'films';
