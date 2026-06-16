/**
 * Typen für das interne Admin-Dashboard (nur für den App-Betreiber).
 *
 * Diese Kennzahlen sind betriebsintern und werden NICHT für normale Nutzer
 * angezeigt. Sie bilden die Grundlage für Wachstumsmessung, Speicher-/Kosten-
 * kontrolle und die spätere Monetarisierung.
 */

import type { BillingTierId } from '@/lib/billing';

/** Ein Datenpunkt einer Zeitreihe (z. B. für Charts). */
export interface SeriesPoint {
  label: string;
  value: number;
}

/** Nutzerübersicht – Registrierungen & Aktivität. */
export interface AdminUserMetrics {
  total: number;
  activeToday: number;
  activeWeek: number;
  activeMonth: number;
  newToday: number;
  newWeek: number;
  newMonth: number;
}

/** Familienübersicht – Anzahl, Größe & Top-Familien. */
export interface AdminFamilyMetrics {
  families: number;
  activeFamilies: number;
  members: number;
  avgSize: number;
  largest: { name: string; members: number }[];
}

/** Wachstum – Einladungen sind der wichtigste organische Hebel. */
export interface AdminGrowthMetrics {
  invitesSent: number;
  invitesAccepted: number;
  /** Anteil angenommener Einladungen (0–1). */
  conversionRate: number;
  topFamilies: { name: string; invites: number }[];
}

/** Inhalte – aggregierte Mengen über alle Familien. */
export interface AdminContentMetrics {
  photos: number;
  videos: number;
  audios: number;
  memories: number;
  capsules: number;
  films: number;
}

/** Speicherverbrauch in GB – wichtig für die spätere Kostenkontrolle. */
export interface AdminStorageMetrics {
  totalGb: number;
  photosGb: number;
  videosGb: number;
  audiosGb: number;
  perFamily: { name: string; gb: number }[];
}

/** Aufschlüsselung je Tarif (Nutzer & Familien). */
export interface AdminTierBreakdown {
  tier: BillingTierId;
  name: string;
  priceLabel: string;
  users: number;
  families: number;
}

/** Abonnement-Kennzahlen (Struktur vorbereitet, noch keine echte Abrechnung). */
export interface AdminSubscriptionMetrics {
  tiers: AdminTierBreakdown[];
  /** Free-Familien nahe an einem Limit → realistische Upgrade-Kandidaten. */
  potentialUpgrades: number;
  /** Geschätzter monatlich wiederkehrender Umsatz in Cent (für spätere Abrechnung). */
  estimatedMrrCents: number;
  /** Geschätzter jährlicher Umsatz in Cent. */
  estimatedArrCents: number;
  /** Conversion Free → Plus/Premium (Anteil zahlender Familien, 0–1). */
  freeToPaidConversion: number;
}

/** Free-Limit-Auslastung über alle Free-Familien. */
export interface AdminLimitUsage {
  key: string;
  label: string;
  limit: number;
  /** Familien ab 80 % der Obergrenze (Hinweis-Schwelle). */
  familiesNearLimit: number;
  /** Familien, die die Obergrenze erreicht haben. */
  familiesReached: number;
}

/** Betrieb & Nutzung (Chronik, Benachrichtigungen, Feature-Nutzung). */
export interface AdminOperationsMetrics {
  chronicleEntries: number;
  notifications: number;
  invitesSent: number;
  invitesAccepted: number;
  activeFamiliesPerWeek: number;
  topFeatures: { label: string; uses: number }[];
}

/** Benachrichtigungs-Kennzahlen (Versand & Engagement). */
export interface AdminNotificationMetrics {
  sent: number;
  opened: number;
  /** Klick-/Öffnungsrate (0–1). */
  openRate: number;
  mostActive: { name: string; actions: number }[];
}

/** Zeitreihen für die Analytics-Charts. */
export interface AdminAnalytics {
  userGrowth: SeriesPoint[];
  familyGrowth: SeriesPoint[];
  uploads: SeriesPoint[];
  invites: SeriesPoint[];
}

/** Vollständiger Datensatz des Admin-Dashboards. */
export interface AdminDashboard {
  generatedAt: string;
  users: AdminUserMetrics;
  families: AdminFamilyMetrics;
  growth: AdminGrowthMetrics;
  content: AdminContentMetrics;
  storage: AdminStorageMetrics;
  subscriptions: AdminSubscriptionMetrics;
  limits: AdminLimitUsage[];
  operations: AdminOperationsMetrics;
  notifications: AdminNotificationMetrics;
  analytics: AdminAnalytics;
}
