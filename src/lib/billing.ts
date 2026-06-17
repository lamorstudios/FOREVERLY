/**
 * Business Foundation – Tarife, Speicher-Limit & Abrechnungsbasis.
 *
 * AKTUELLE STRATEGIE (Stand 2026-06): FAMII ist vollständig KOSTENLOS nutzbar.
 * Alle Funktionen sind enthalten, es gibt keine gesperrten Features, keine
 * Kaufaufforderungen und keine Preiswerbung. Der EINZIGE spätere Upgrade-Grund
 * ist zusätzlicher Speicherplatz – keine künstlichen Limits außer Speicher.
 *
 * Speichermodell (technisch vorbereitet, noch keine echte Abrechnung):
 *   • Kostenloser Speicher (Free):  5 GB pro Familie
 *   • Upgrade-Auslöser:             Familie erreicht das kostenlose Speicherlimit
 *   • FAMII Plus:                   0,99 € / Monat  oder  9,99 € / Jahr
 *                                   – pro FAMILIE, nicht pro Person
 *
 * Zukünftige Preisstruktur: Plus deckt den Standard-Mehrbedarf ab; ein
 * Premium-Tarif (mehr Speicher) bleibt in den Daten erhalten, wird aktuell
 * aber NICHT beworben. Die Abwicklung erfolgt später über App Store / Google
 * Play bzw. Stripe.
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

// Mitglieder sind UNBEGRENZT (keine künstlichen Limits außer Speicher).
export const BILLING_TIERS: BillingTier[] = [
  { id: 'free', name: 'Free', priceMonthlyCents: 0, priceAnnualCents: 0, currency: 'EUR', storageGb: 5, maxMembers: Infinity },
  { id: 'plus', name: 'Plus', priceMonthlyCents: 99, priceAnnualCents: 999, currency: 'EUR', storageGb: 50, maxMembers: Infinity },
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

// --- Limit (NUR Speicher ist ein Limit – sonst nichts) ----------------------

export type FreeLimitKey = 'storage';

export interface FreeLimit {
  key: FreeLimitKey;
  label: string;
  limit: number;
  unit?: string;
}

/**
 * Free-Tarif – die EINZIGE Obergrenze ist der Speicher. Mitglieder und
 * Funktionen sind bewusst unbegrenzt bzw. kostenlos.
 */
export const FREE_LIMITS: FreeLimit[] = [
  { key: 'storage', label: 'Speicher', limit: 5, unit: 'GB' },
];

/** Kostenloser Speicher pro Familie (GB). */
export const FREE_STORAGE_GB = 5;

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
 * Freundlicher Hinweis, der NUR erscheint, wenn eine Familie das kostenlose
 * Speicherlimit erreicht hat (keine harte Paywall, keine Preiswerbung vorher).
 */
export const STORAGE_LIMIT_NOTICE = {
  title: 'Eure Familiengeschichte wächst ❤️',
  body:
    'Ihr habt euren kostenlosen Speicherplatz genutzt.\n\n' +
    'Für zusätzlichen Speicher könnt ihr FAMII Plus freischalten.',
} as const;

/**
 * Detail-Variante mit konkretem Speicherstand (optional verwendbar). Beispiel:
 * „Eure Familie nutzt aktuell 4,8 von 5 GB Speicher. …"
 */
export function storageUpgradeMessage(usedGb: number, limitGb: number): string {
  const used = usedGb.toLocaleString('de-DE', { maximumFractionDigits: 1 });
  const limit = limitGb.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  return `Eure Familie nutzt aktuell ${used} von ${limit} GB Speicher. Um weitere Erinnerungen, Videos und Dokumente zu speichern, kann ein Familienmitglied FAMII Plus freischalten.`;
}
