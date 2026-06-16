/**
 * Business Foundation – Tarife, Speicher/Mitglieder-Limits & Abrechnungsbasis.
 *
 * Monetarisierungs-Strategie: möglichst viele Funktionen sind bereits kostenlos.
 * Bezahlt wird vor allem für mehr Speicher und größere Familien – nicht für
 * gesperrte Kernfunktionen. Noch KEINE echte Abrechnung; nur die Struktur, auf
 * der eine spätere Monetarisierung (Stripe / App-Store-Abos) aufsetzt.
 */

export type BillingTierId = 'free' | 'plus' | 'premium';
export type BillingPeriod = 'monthly' | 'annual';

export interface BillingTier {
  id: BillingTierId;
  name: string;
  /** Preis in Cent/Monat – Basis für spätere Abrechnung (0 = kostenlos). */
  priceMonthlyCents: number;
  /** Preis in Cent/Jahr (0 = kein Jahresabo / kostenlos). */
  priceAnnualCents: number;
  currency: 'EUR';
  /** Inklusiver Speicher in GB. */
  storageGb: number;
  /** Maximale Mitglieder (Infinity = unbegrenzt). */
  maxMembers: number;
}

export const BILLING_TIERS: BillingTier[] = [
  { id: 'free', name: 'Free', priceMonthlyCents: 0, priceAnnualCents: 0, currency: 'EUR', storageGb: 5, maxMembers: 15 },
  { id: 'plus', name: 'Plus', priceMonthlyCents: 199, priceAnnualCents: 1999, currency: 'EUR', storageGb: 50, maxMembers: 50 },
  { id: 'premium', name: 'Premium', priceMonthlyCents: 999, priceAnnualCents: 9900, currency: 'EUR', storageGb: 500, maxMembers: Infinity },
];

export function tierById(id: BillingTierId): BillingTier {
  return BILLING_TIERS.find((t) => t.id === id) ?? BILLING_TIERS[0]!;
}

/** Cent-Betrag als „1,99 €" formatieren. */
export function formatEuroCents(cents: number): string {
  return `${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/** Ersparnis des Jahresabos in Prozent (gegenüber 12× Monatspreis). */
export function annualSavingsPct(id: BillingTierId): number {
  const t = tierById(id);
  const yearly = t.priceMonthlyCents * 12;
  if (yearly <= 0 || t.priceAnnualCents <= 0) return 0;
  return Math.round(((yearly - t.priceAnnualCents) / yearly) * 100);
}

// --- Limits (Speicher & Mitglieder = die Monetarisierungs-Hebel) ------------

export type FreeLimitKey = 'members' | 'storage';

export interface FreeLimit {
  key: FreeLimitKey;
  label: string;
  limit: number;
  unit?: string;
}

/** Free-Tarif – die relevanten Obergrenzen (Mitglieder & Speicher). */
export const FREE_LIMITS: FreeLimit[] = [
  { key: 'members', label: 'Familienmitglieder', limit: 15 },
  { key: 'storage', label: 'Speicher', limit: 5, unit: 'GB' },
];

/** Ab diesem Anteil der Obergrenze wird ein dezenter Hinweis angezeigt. */
export const LIMIT_WARN_RATIO = 0.8;

export interface LimitStatus {
  ratio: number;
  remaining: number;
  /** ≥ 80 %, aber noch nicht erreicht → Hinweis anzeigen. */
  warn: boolean;
  /** Obergrenze erreicht/überschritten. */
  reached: boolean;
}

export function limitStatus(used: number, limit: number): LimitStatus {
  const ratio = limit > 0 ? used / limit : 0;
  return {
    ratio,
    remaining: Math.max(0, limit - used),
    warn: ratio >= LIMIT_WARN_RATIO && used < limit,
    reached: used >= limit,
  };
}

/**
 * Sanfter Speicher-Hinweis statt harter Paywall. Beispiel:
 * „Eure Familie nutzt aktuell 4,8 von 5 GB Speicher. Um weitere Erinnerungen,
 *  Videos und Dokumente zu speichern, kann ein Familienmitglied Foreverly Plus
 *  freischalten."
 */
export function storageUpgradeMessage(usedGb: number, limitGb: number): string {
  const used = usedGb.toLocaleString('de-DE', { maximumFractionDigits: 1 });
  const limit = limitGb.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  return `Eure Familie nutzt aktuell ${used} von ${limit} GB Speicher. Um weitere Erinnerungen, Videos und Dokumente zu speichern, kann ein Familienmitglied Foreverly Plus freischalten.`;
}
