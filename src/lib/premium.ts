/**
 * Freemium-/Premium-Modell (Phase 15).
 * Definiert Pläne und Premium-Funktionen. Gating erfolgt clientseitig über
 * den PremiumContext; serverseitige Durchsetzung folgt im Realbetrieb.
 */

export type PlanId = 'free' | 'premium';

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  maxMembers: number;
  storageGb: number;
  highlights: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Foreverly Free',
    price: '0 €',
    maxMembers: 5,
    storageGb: 2,
    highlights: ['Familienbaum & Erinnerungen', 'Familienmomente & Status', 'Basis-Zeitkapseln', 'Bis zu 5 Mitglieder'],
  },
  {
    id: 'premium',
    name: 'Family Premium',
    price: '9,99 € / Monat',
    maxMembers: 50,
    storageGb: 200,
    highlights: [
      'Ein Abo für die ganze Familie',
      'Familienfilme & Vermächtnis-Filme',
      'KI-Familienhistoriker & Familienstimmen',
      'PDF-Familienbuch & Premium-Zeitkapseln',
      'Großes Speicherpaket (200 GB)',
    ],
  },
];

/** Funktionen, die Premium voraussetzen. */
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
  premiumCapsules: 'Premium-Zeitkapseln',
  extraStorage: 'Großes Speicherpaket',
  legacyAi: 'Familienstimmen (Legacy AI)',
};
