/**
 * Freemium-Modell (Free · Plus · Premium) – speicher- & familiengrößenbasiert.
 *
 * Strategie: Nahezu alle Kernfunktionen sind bereits kostenlos nutzbar, damit
 * FAMII schnell wächst. Monetarisiert wird über Speicherplatz und
 * Familiengröße – nicht über gesperrte Funktionen. Plus ist die empfohlene
 * Mitte. Preise/Limits sind deckungsgleich mit `lib/billing.ts`.
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
    tagline: 'Für kleine Familien und zum Kennenlernen.',
    priceMonthly: '0 €',
    storageLabel: '5 GB Speicher',
    membersLabel: 'Bis zu 15 Familienmitglieder',
    features: [
      'Familienbaum',
      'Familienmomente',
      'Familienstatus',
      'Zeitkapseln',
      'Fotos',
      'Videos',
      'Audioaufnahmen',
      'Dokumententresor',
      'Familienkarte',
      'SOS-Funktion',
      'Familienassistent',
      'Erinnerungen',
    ],
    note: 'Du kannst FAMII kostenlos nutzen, bis deine Familie oder dein Speicher wächst.',
    storageGb: 5,
    maxMembers: 15,
  },
  {
    id: 'plus',
    name: 'FAMII Plus',
    tagline: 'Beste Preis-Leistung für die meisten Familien.',
    priceMonthly: '1,99 € / Monat',
    priceAnnual: '19,99 € / Jahr',
    recommended: true,
    badge: 'Beliebteste Wahl',
    storageLabel: '50 GB Speicher',
    membersLabel: 'Bis zu 50 Familienmitglieder',
    features: [
      'Alle Funktionen aus Free',
      'Bis zu 50 Familienmitglieder',
      '50 GB Speicher',
      'Mehr Speicher für Fotos, Videos & Dokumente',
      'Ein Abo gilt für die gesamte Familie',
    ],
    note: 'Ein Abo für die ganze Familie. Eine Person zahlt, alle profitieren.',
    storageGb: 50,
    maxMembers: 50,
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
