/**
 * Freemium-Modell (Free · Plus · Premium).
 *
 * Drei klar erkennbare Tarife. Plus ist die empfohlene Mitte mit dem besten
 * Preis-Leistungs-Verhältnis. Gating erfolgt clientseitig über den
 * PremiumContext (planbasiert); serverseitige Durchsetzung folgt im Realbetrieb.
 * Die Preise/Limits sind deckungsgleich mit der Business-Foundation in
 * `lib/billing.ts` (dortige Struktur für Admin-Kennzahlen & spätere Abrechnung).
 */

export type PlanId = 'free' | 'plus' | 'premium';

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  /** Kurzbeschreibung unter dem Namen. */
  tagline: string;
  /** Empfohlener Tarif (optisch hervorgehoben). */
  recommended?: boolean;
  /** Badge-Text, z. B. „Beliebteste Wahl". */
  badge?: string;
  /** Enthaltene Funktionen. */
  features: string[];
  /** Optionale Grenzen (nur Free). */
  limits?: string[];
  /** Optionaler Zusatztext unter den Funktionen. */
  note?: string;
  /** Maximale Mitglieder (Infinity = unbegrenzt) – für Limits/Abrechnung. */
  maxMembers: number;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Foreverly Free',
    price: '0 €',
    tagline: 'Für kleine Familien und zum Kennenlernen.',
    features: [
      'Familienbaum',
      'Erinnerungen',
      'Familienmomente',
      'Familienstatus',
      'Familienchat',
      'Familienkarte',
      'Basis-Zeitkapseln',
      'Dokumente',
      'Einladungen',
    ],
    limits: [
      'bis 15 Familienmitglieder',
      'bis 500 Fotos',
      'bis 100 Videos',
      'Standardspeicher',
    ],
    note: 'Foreverly bleibt kostenlos, bis diese Grenzen erreicht werden. Vor Erreichen der Grenze erhältst du frühzeitig Hinweise zum Upgrade.',
    maxMembers: 15,
  },
  {
    id: 'plus',
    name: 'Foreverly Plus',
    price: '1,99 € / Monat',
    tagline: 'Beste Preis-Leistung für die meisten Familien.',
    recommended: true,
    badge: 'Beliebteste Wahl',
    features: [
      'Alles aus Free',
      'bis 25 Familienmitglieder',
      'deutlich mehr Speicher',
      'unbegrenzte Erinnerungen',
      'unbegrenzte Zeitkapseln',
      'Video-Zeitkapseln',
      'Familienfilme',
      'Spracharchive',
      'Priorisierte Backups',
    ],
    note: 'Ein Abo für die ganze Familie. Eine Person zahlt, alle profitieren.',
    maxMembers: 25,
  },
  {
    id: 'premium',
    name: 'Foreverly Premium',
    price: '9,99 € / Monat',
    tagline: 'Für große Familien und maximale Möglichkeiten.',
    features: [
      'Alles aus Plus',
      'unbegrenzte Familienmitglieder',
      'maximaler Speicher',
      'KI-Familienassistent',
      'KI-Familienchronik',
      'automatische Familienfilme',
      'Familienbuch als PDF',
      'Premium Familienmuseum',
      'Nachlass- und Vermächtnisfunktionen',
      'Prioritäts-Support',
    ],
    maxMembers: Infinity,
  },
];

export function planById(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]!;
}

/** Rangfolge für planbasiertes Feature-Gating. */
export const PLAN_RANK: Record<PlanId, number> = { free: 0, plus: 1, premium: 2 };

/** Funktionen, die einen bezahlten Tarif voraussetzen. */
export type PremiumFeature =
  | 'films'
  | 'historian'
  | 'pdfBook'
  | 'premiumCapsules'
  | 'extraStorage'
  | 'legacyAi';

export const PREMIUM_FEATURE_LABELS: Record<PremiumFeature, string> = {
  films: 'Familienfilme',
  historian: 'KI-Familienhistoriker',
  pdfBook: 'PDF-Familienbuch',
  premiumCapsules: 'Unbegrenzte Zeitkapseln',
  extraStorage: 'Mehr Speicher',
  legacyAi: 'Spracharchive (Legacy AI)',
};

/** Mindest-Tarif je Premium-Funktion (Plus schaltet die meisten frei). */
export const FEATURE_MIN_PLAN: Record<PremiumFeature, PlanId> = {
  films: 'plus',
  premiumCapsules: 'plus',
  extraStorage: 'plus',
  legacyAi: 'plus',
  historian: 'premium',
  pdfBook: 'premium',
};
