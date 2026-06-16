/**
 * Business Foundation – Tarife, Free-Limits & Abrechnungs-Grundlagen.
 *
 * Noch KEINE echte Abrechnung. Diese Datei definiert nur die Struktur, auf der
 * eine spätere Monetarisierung (Stripe / App-Store-Abos) aufsetzen kann:
 * Tarife mit Preisen in Cent, Free-Limits und die Schwelle für 80 %-Hinweise.
 */

export type BillingTierId = 'free' | 'plus' | 'premium';

export interface BillingTier {
  id: BillingTierId;
  name: string;
  /** Anzeigepreis für die UI. */
  priceLabel: string;
  /** Preis in Cent/Monat – Basis für spätere Abrechnung (0 = kostenlos). */
  priceMonthlyCents: number;
  currency: 'EUR';
  highlights: string[];
}

export const BILLING_TIERS: BillingTier[] = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: '0 €',
    priceMonthlyCents: 0,
    currency: 'EUR',
    highlights: ['Bis 15 Familienmitglieder', 'Bis 500 Fotos', 'Bis 100 Videos'],
  },
  {
    id: 'plus',
    name: 'Plus',
    priceLabel: '1,99 € / Monat',
    priceMonthlyCents: 199,
    currency: 'EUR',
    highlights: ['Mehr Speicherplatz', 'Größere Familien', 'Erweiterte Funktionen'],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceLabel: '9,99 € / Monat',
    priceMonthlyCents: 999,
    currency: 'EUR',
    highlights: ['Alle Premium-Funktionen', 'Großes Speicherpaket', 'Familienfilme & KI'],
  },
];

export function tierById(id: BillingTierId): BillingTier {
  return BILLING_TIERS.find((t) => t.id === id) ?? BILLING_TIERS[0]!;
}

/** Cent-Betrag als „1,99 €" formatieren (für MRR & Tarifanzeige). */
export function formatEuroCents(cents: number): string {
  return `${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

// --- Free-Limits ------------------------------------------------------------

export type FreeLimitKey = 'members' | 'photos' | 'videos';

export interface FreeLimit {
  key: FreeLimitKey;
  label: string;
  limit: number;
}

/** Free-Tarif – Obergrenzen. Noch keine Paywall; nur Hinweise ab 80 %. */
export const FREE_LIMITS: FreeLimit[] = [
  { key: 'members', label: 'Familienmitglieder', limit: 15 },
  { key: 'photos', label: 'Fotos', limit: 500 },
  { key: 'videos', label: 'Videos', limit: 100 },
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
