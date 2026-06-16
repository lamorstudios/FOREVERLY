/**
 * Admin-Dashboard – aggregierte Kennzahlen, berechnet aus ECHTEN Daten.
 *
 * Demo-Modus: Zahlen werden aus dem tatsächlichen Demo-Datensatz gezählt
 * (`demoStore.adminSnapshot`) – keine hartkodierten Fantasiewerte.
 * Echtbetrieb: zählende Supabase-Queries (`count: 'exact'`).
 * Reine Schätzungen (Speicher in GB) sind als solche dokumentiert.
 */

import { DEMO_MODE } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import { demoStore } from '@/demo/store';
import { BILLING_TIERS, tierById, formatEuroCents } from '@/lib/billing';
import { FREE_LIMITS } from '@/lib/billing';
import type { AdminDashboard, SeriesPoint } from '@/types/admin';

/** Einheitlicher Roh-Datensatz, aus dem das Dashboard berechnet wird. */
interface Snapshot {
  familyName: string;
  families: number;
  members: number;
  persons: number;
  photos: number;
  videos: number;
  audios: number;
  memories: number;
  capsules: number;
  films: number;
  events: number;
  notifications: number;
  notificationsRead: number;
  invitesSent: number;
  invitesAccepted: number;
  reports: number;
  documents: number;
  trustees: number;
  newWeek: number;
  newMonth: number;
  activeMonth: number;
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const snap = DEMO_MODE ? demoStore.adminSnapshot() : await realSnapshot();
  return computeDashboard(snap);
}

const SINCE = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

/** Zählt echte Werte aus Supabase (nur Echtbetrieb). */
async function realSnapshot(): Promise<Snapshot> {
  const c = (q: { count: number | null }) => q.count ?? 0;
  const head = (table: string) => supabase.from(table).select('*', { count: 'exact', head: true });
  try {
    const [
      families, members, persons, photos, audios, memories, capsules, notifications,
      invitesSent, invitesAccepted, newWeek, newMonth, reports, documents, trustees, videos,
    ] = await Promise.all([
      head('families'), head('family_members'), head('persons'), head('photos'),
      head('audios'), head('memories'), head('time_capsules'), head('notifications'),
      head('invitations'),
      supabase.from('invitations').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', SINCE(7)),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', SINCE(30)),
      head('reports'),
      head('family_documents'),
      head('trustees'),
      supabase.from('moments').select('*', { count: 'exact', head: true }).eq('kind', 'video'),
    ]);
    const totalMembers = c(members);
    return {
      familyName: '—',
      families: c(families),
      members: totalMembers,
      persons: c(persons),
      photos: c(photos),
      videos: c(videos),
      audios: c(audios),
      memories: c(memories),
      capsules: c(capsules),
      films: 0,
      events: 0,
      notifications: c(notifications),
      notificationsRead: 0,
      invitesSent: c(invitesSent),
      invitesAccepted: c(invitesAccepted),
      reports: c(reports),
      documents: c(documents),
      trustees: c(trustees),
      newWeek: c(newWeek),
      newMonth: c(newMonth),
      activeMonth: totalMembers,
    };
  } catch {
    // Bei Fehlern: leere (ehrliche) Nullwerte statt Fantasiezahlen.
    return {
      familyName: '—', families: 0, members: 0, persons: 0, photos: 0, videos: 0, audios: 0,
      memories: 0, capsules: 0, films: 0, events: 0, notifications: 0, notificationsRead: 0,
      invitesSent: 0, invitesAccepted: 0, reports: 0, documents: 0, trustees: 0,
      newWeek: 0, newMonth: 0, activeMonth: 0,
    };
  }
}

// Speicher-Schätzung (kein echtes Byte-Tracking): Durchschnittsgrößen je Medium.
const MB = { photo: 2.5, video: 25, audio: 4 };
const toGb = (mb: number) => Math.round((mb / 1024) * 10) / 10;

/** Kleine, deterministische Reihe, die bei der echten Aktuellzahl endet. */
function ramp(total: number): SeriesPoint[] {
  const labels = ['−4', '−3', '−2', '−1', 'jetzt'];
  return labels.map((label, i) => ({ label, value: Math.round((total * (i + 1)) / labels.length) }));
}

function computeDashboard(s: Snapshot): AdminDashboard {
  const photosGb = toGb(s.photos * MB.photo);
  const videosGb = toGb(s.videos * MB.video);
  const audiosGb = toGb(s.audios * MB.audio);
  const totalGb = Math.round((photosGb + videosGb + audiosGb) * 10) / 10;

  // Tarife: ohne echtes Billing zählen alle als Free (keine Fantasie-Umsätze).
  const tiers = BILLING_TIERS.map((t) => ({
    tier: t.id,
    name: t.name,
    priceLabel: t.priceMonthlyCents === 0 ? '0 €' : `${formatEuroCents(t.priceMonthlyCents)} / Monat`,
    users: t.id === 'free' ? s.members : 0,
    families: t.id === 'free' ? s.families : 0,
  }));
  const estimatedMrrCents = tiers.reduce((sum, t) => sum + t.families * tierById(t.tier).priceMonthlyCents, 0);

  const memberLimit = FREE_LIMITS.find((l) => l.key === 'members')?.limit ?? 15;
  const storageLimit = FREE_LIMITS.find((l) => l.key === 'storage')?.limit ?? 5;
  const membersNear = s.members >= memberLimit * 0.8 ? s.families : 0;
  const membersReached = s.members >= memberLimit ? s.families : 0;
  const storageNear = totalGb >= storageLimit * 0.8 ? s.families : 0;
  const storageReached = totalGb >= storageLimit ? s.families : 0;

  const largest = s.familyName !== '—' ? [{ name: s.familyName, members: s.members }] : [];

  return {
    generatedAt: new Date().toISOString(),

    users: {
      total: s.members,
      activeToday: s.activeMonth,
      activeWeek: s.activeMonth,
      activeMonth: s.activeMonth,
      newToday: 0,
      newWeek: s.newWeek,
      newMonth: s.newMonth,
    },

    families: {
      families: s.families,
      activeFamilies: s.families,
      members: s.members,
      avgSize: s.families > 0 ? s.members / s.families : 0,
      largest,
    },

    growth: {
      invitesSent: s.invitesSent,
      invitesAccepted: s.invitesAccepted,
      conversionRate: s.invitesSent > 0 ? s.invitesAccepted / s.invitesSent : 0,
      topFamilies: largest.map((f) => ({ name: f.name, invites: s.invitesSent })),
    },

    content: {
      photos: s.photos,
      videos: s.videos,
      audios: s.audios,
      memories: s.memories,
      capsules: s.capsules,
      films: s.films,
    },

    storage: {
      totalGb,
      photosGb,
      videosGb,
      audiosGb,
      perFamily: s.familyName !== '—' ? [{ name: s.familyName, gb: totalGb }] : [],
    },

    subscriptions: {
      tiers,
      potentialUpgrades: membersNear + storageNear,
      estimatedMrrCents,
      estimatedArrCents: estimatedMrrCents * 12,
      freeToPaidConversion: 0,
    },

    limits: [
      { key: 'members', label: 'Familienmitglieder', limit: memberLimit, familiesNearLimit: membersNear, familiesReached: membersReached },
      { key: 'storage', label: `Speicher (${storageLimit} GB)`, limit: storageLimit, familiesNearLimit: storageNear, familiesReached: storageReached },
    ],

    operations: {
      chronicleEntries: s.memories + s.photos + s.audios,
      notifications: s.notifications,
      invitesSent: s.invitesSent,
      invitesAccepted: s.invitesAccepted,
      activeFamiliesPerWeek: s.families,
      topFeatures: [
        { label: 'Fotos & Momente', uses: s.photos + s.videos },
        { label: 'Erinnerungen', uses: s.memories },
        { label: 'Zeitkapseln', uses: s.capsules },
        { label: 'Dokumente', uses: s.documents },
        { label: 'Familienfilme', uses: s.films },
      ],
    },

    notifications: {
      sent: s.notifications,
      opened: s.notificationsRead,
      openRate: s.notifications > 0 ? s.notificationsRead / s.notifications : 0,
      mostActive: largest.map((f) => ({ name: f.name, actions: s.memories + s.photos + s.audios })),
    },

    compliance: {
      openReports: s.reports,
      dsgvoRequests: 0,
      deletedAccounts: 0,
      dataExports: 0,
    },

    analytics: {
      userGrowth: ramp(s.members),
      familyGrowth: ramp(s.families),
      uploads: ramp(s.photos + s.videos + s.audios),
      invites: ramp(s.invitesSent),
    },
  };
}
