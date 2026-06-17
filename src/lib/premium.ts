/**
 * Tarifmodell – AKTUELL ist FAMII vollständig KOSTENLOS.
 *
 * Alle Funktionen sind im Free-Tarif enthalten, es gibt keine gesperrten
 * Features. Der einzige spätere Upgrade-Grund ist zusätzlicher SPEICHER.
 * FAMII Plus (0,99 € / Monat oder 9,99 € / Jahr, pro Familie) wird erst dann
 * relevant, wenn das kostenlose Speicherlimit erreicht ist – und wird vorher
 * nicht aktiv beworben. Ein Premium-Tarif bleibt in den Daten erhalten, wird
 * aktuell aber NICHT in den Vordergrund gestellt.
 * Preise/Limits sind deckungsgleich mit `lib/billing.ts`.
 */

export type PlanId = 'free' | 'plus' | 'premium';

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Anzeigepreis pro Monat. */
  priceMonthly: string;
  /** Anzeigepreis pro Jahr (optional – Free hat keins). */
  priceAnnual?: string;
  recommended?: boolean;
  badge?: string;
  /** Speicher- und Mitglieder-Eckdaten (prominent dargestellt). */
  storageLabel: string;
  membersLabel: string;
  /** Enthaltene Funktionen. */
  features: string[];
  /** Optionaler Zusatztext (z. B. „Ein Abo für die ganze Familie"). */
  note?: string;
  storageGb: number;
  maxMembers: number;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'FAMII Free',
    tagline: 'FAMII ist kostenlos – mit allen Funktionen.',
    priceMonthly: '0 €',
    storageLabel: '5 GB Speicher',
    membersLabel: 'Unbegrenzte Familienmitglieder',
    features: [
      'Familienbaum',
      'Erinnerungen',
      'Zeitkapseln',
      'Familienbuch',
      'Dokumente',
      'Familienhistoriker',
      'Familienkarte',
      'Einladungen',
      'Benachrichtigungen',
      'Vertrauenspersonen',
      'Nachlassfunktionen',
      'Alle zukünftigen Standardfunktionen',
    ],
    note: 'Alle Funktionen sind kostenlos. Mehr brauchst du erst, wenn euer Speicher wächst.',
    storageGb: 5,
    maxMembers: Infinity,
  },
  {
    id: 'plus',
    name: 'FAMII Plus',
    tagline: 'Zusätzlicher Speicher, wenn eure Familiengeschichte wächst.',
    priceMonthly: '0,99 € / Monat',
    priceAnnual: '9,99 € / Jahr',
    recommended: true,
    storageLabel: '50 GB Speicher',
    membersLabel: 'Unbegrenzte Familienmitglieder',
    features: [
      'Alle Funktionen aus Free',
      'Deutlich mehr Speicher für Fotos, Videos & Dokumente',
      'Ein Abo gilt für die gesamte Familie – nicht pro Person',
    ],
    note: 'Ein Abo für die ganze Familie. Eine Person zahlt, alle profitieren.',
    storageGb: 50,
    maxMembers: Infinity,
  },
  {
    id: 'premium',
    name: 'FAMII Premium',
    tagline: 'Für große Familien und maximale Möglichkeiten.',
    priceMonthly: '9,99 € / Monat',
    priceAnnual: '99 € / Jahr',
    storageLabel: '500 GB Speicher',
    membersLabel: 'Unbegrenzte Familienmitglieder',
    features: [
      'Alles aus Plus',
      'Unbegrenzte Familienmitglieder',
      '500 GB Speicher',
      'Erweiterte KI-Funktionen',
      'Premium-Familienarchiv',
      'Nachlass-Tresor',
      'Erweiterte Familienfilm-Funktionen',
      'Prioritäts-Support',
    ],
    storageGb: 500,
    maxMembers: Infinity,
  },
];

export function planById(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]!;
}

/** Rangfolge für planbasiertes Feature-Gating. */
export const PLAN_RANK: Record<PlanId, number> = { free: 0, plus: 1, premium: 2 };

/**
 * Funktionen, die einen bezahlten Tarif voraussetzen.
 * Bewusst klein gehalten: nur erweiterte/Premium-Extras sind gesperrt –
 * alle Kernfunktionen bleiben kostenlos.
 */
export type PremiumFeature =
  | 'advancedAi'
  | 'premiumArchive'
  | 'estateVault'
  | 'advancedFilms'
  | 'prioritySupport';

export const PREMIUM_FEATURE_LABELS: Record<PremiumFeature, string> = {
  advancedAi: 'Erweiterte KI-Funktionen',
  premiumArchive: 'Premium-Familienarchiv',
  estateVault: 'Nachlass-Tresor',
  advancedFilms: 'Erweiterte Familienfilm-Funktionen',
  prioritySupport: 'Prioritäts-Support',
};

/** Mindest-Tarif je Premium-Funktion (Extras sind Premium-exklusiv). */
export const FEATURE_MIN_PLAN: Record<PremiumFeature, PlanId> = {
  advancedAi: 'premium',
  premiumArchive: 'premium',
  estateVault: 'premium',
  advancedFilms: 'premium',
  prioritySupport: 'premium',
};
