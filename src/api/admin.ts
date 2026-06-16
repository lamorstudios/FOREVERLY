/**
 * Admin-Dashboard – Aggregierte Betriebs-Kennzahlen (nur für den Betreiber).
 *
 * Im Demo-Modus liefern wir realistische, plattformweite Beispielwerte, damit
 * das Dashboard sofort aussagekräftig aussieht. Im Echtbetrieb würden diese
 * Zahlen serverseitig (z. B. über Supabase-RPC/Materialized Views) aggregiert –
 * der Andockpunkt ist hier bereits vorbereitet.
 */

import { DEMO_MODE } from '@/lib/config';
import { BILLING_TIERS, tierById, formatEuroCents } from '@/lib/billing';
import type { AdminDashboard } from '@/types/admin';

export async function getAdminDashboard(): Promise<AdminDashboard> {
  if (DEMO_MODE) return buildDemoDashboard();
  // Echtbetrieb: serverseitige Aggregation (noch nicht implementiert).
  // Bis dahin liefern wir denselben Demo-Datensatz, damit die UI nutzbar bleibt.
  return buildDemoDashboard();
}

/** Realistischer, deterministischer Beispiel-Datensatz für die Vorschau. */
function buildDemoDashboard(): AdminDashboard {
  const months = ['Nov', 'Dez', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'];

  // Tarif-Aufschlüsselung (Familien-Abo: ein Abo gilt für die ganze Familie).
  const tierUsers: Record<string, number> = { free: 4050, plus: 540, premium: 230 };
  const tierFamilies: Record<string, number> = { free: 980, plus: 150, premium: 50 };

  const tiers = BILLING_TIERS.map((t) => ({
    tier: t.id,
    name: t.name,
    priceLabel: t.priceMonthlyCents === 0 ? '0 €' : `${formatEuroCents(t.priceMonthlyCents)} / Monat`,
    users: tierUsers[t.id] ?? 0,
    families: tierFamilies[t.id] ?? 0,
  }));

  // Geschätzter MRR aus den zahlenden Familien (Plus + Premium).
  const estimatedMrrCents = tiers.reduce(
    (sum, t) => sum + t.families * tierById(t.tier).priceMonthlyCents,
    0,
  );
  // Jährlicher Umsatz als Run-Rate (12× MRR).
  const estimatedArrCents = estimatedMrrCents * 12;

  const totalFamilies = 1180;
  const paidFamilies = (tierFamilies.plus ?? 0) + (tierFamilies.premium ?? 0);
  const freeToPaidConversion = paidFamilies / totalFamilies;

  const invitesSent = 3120;
  const invitesAccepted = 1890;

  // Free-Familien nahe an einem Limit = realistische Upgrade-Kandidaten.
  const potentialUpgrades = 64 + 96;

  return {
    generatedAt: new Date().toISOString(),

    users: {
      total: 4820,
      activeToday: 612,
      activeWeek: 2140,
      activeMonth: 3890,
      newToday: 38,
      newWeek: 274,
      newMonth: 980,
    },

    families: {
      families: totalFamilies,
      activeFamilies: 870,
      members: 4820,
      avgSize: 4820 / totalFamilies,
      largest: [
        { name: 'Familie Mielke', members: 21 },
        { name: 'Familie Weber', members: 18 },
        { name: 'Familie Schneider', members: 16 },
        { name: 'Familie Koch', members: 14 },
        { name: 'Familie Bauer', members: 13 },
      ],
    },

    growth: {
      invitesSent,
      invitesAccepted,
      conversionRate: invitesAccepted / invitesSent,
      topFamilies: [
        { name: 'Familie Mielke', invites: 42 },
        { name: 'Familie Weber', invites: 35 },
        { name: 'Familie Hoffmann', invites: 29 },
        { name: 'Familie Schneider', invites: 24 },
        { name: 'Familie Bauer', invites: 21 },
      ],
    },

    content: {
      photos: 128450,
      videos: 9320,
      audios: 4110,
      memories: 21870,
      capsules: 3240,
      films: 760,
    },

    storage: {
      totalGb: 842.5,
      photosGb: 410.2,
      videosGb: 372.8,
      audiosGb: 41.5,
      perFamily: [
        { name: 'Familie Mielke', gb: 24.8 },
        { name: 'Familie Weber', gb: 19.3 },
        { name: 'Familie Schneider', gb: 15.1 },
        { name: 'Familie Koch', gb: 11.6 },
        { name: 'Familie Bauer', gb: 9.4 },
      ],
    },

    subscriptions: {
      tiers,
      potentialUpgrades,
      estimatedMrrCents,
      estimatedArrCents,
      freeToPaidConversion,
    },

    limits: [
      { key: 'members', label: 'Familienmitglieder', limit: 15, familiesNearLimit: 64, familiesReached: 12 },
      { key: 'storage', label: 'Speicher (5 GB)', limit: 5, familiesNearLimit: 96, familiesReached: 18 },
    ],

    analytics: {
      userGrowth: zip(months, [1200, 1750, 2280, 2900, 3450, 3990, 4420, 4820]),
      familyGrowth: zip(months, [290, 420, 560, 710, 860, 1000, 1100, 1180]),
      uploads: zip(months, [8400, 9600, 11200, 12900, 13800, 15100, 16400, 17600]),
      invites: zip(months, [210, 260, 300, 340, 360, 390, 420, 450]),
    },
  };
}

function zip(labels: string[], values: number[]) {
  return labels.map((label, i) => ({ label, value: values[i] ?? 0 }));
}
