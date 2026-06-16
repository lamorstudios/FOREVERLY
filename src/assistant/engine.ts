/**
 * KI-Familienassistent – deterministische, quellengebundene Unterstützung.
 *
 * Grundsätze:
 *  - Nutzt AUSSCHLIESSLICH vorhandene Familieninhalte (keine Erfindungen).
 *  - Schlägt nur vor – führt nichts selbst aus. Aktionen öffnen Bildschirme,
 *    die der Nutzer bestätigt.
 */
import { fullName, formatDate, daysUntil, openingCountdown } from '@/lib/format';
import type {
  Person,
  Relationship,
  Memory,
  Photo,
  Audio,
  TimeCapsule,
  CalendarEvent,
  FamilyEvent,
  FilmProject,
  Trustee,
  VaultEntry,
  EstateInfo,
} from '@/types/models';

export interface AssistantData {
  persons: Person[];
  relationships: Relationship[];
  memories: Memory[];
  photos: Photo[];
  audios: Audio[];
  capsules: TimeCapsule[];
  calendarEvents: CalendarEvent[];
  events: FamilyEvent[];
  films: FilmProject[];
  trustees: Trustee[];
  vaultEntries: VaultEntry[];
  estate: EstateInfo | null;
}

export type AssistantTab = 'HomeTab' | 'MemoriesTab' | 'CapsulesTab' | 'ProfileTab';

export interface AssistantAction {
  tab: AssistantTab;
  screen: string;
  params?: Record<string, unknown>;
  label: string;
}

export interface AssistantSuggestion {
  id: string;
  icon: string; // Ionicon-Name
  title: string;
  subtitle: string;
  action?: AssistantAction;
}

export interface AssistantStat {
  icon: string;
  label: string;
  value: number;
}

export interface AssistantAnswer {
  found: boolean;
  answer: string;
}

// --- Hilfen -----------------------------------------------------------------

function fold(s: string): string {
  return s.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');
}

function daysUntilAnnual(dateStr: string, ref = new Date()): number {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return -1;
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const next = new Date(ref.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next.setFullYear(ref.getFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

// --- Statistiken ------------------------------------------------------------

export function familyStats(data: AssistantData): AssistantStat[] {
  return [
    { icon: 'people-outline', label: 'Familienmitglieder', value: data.persons.length },
    { icon: 'sparkles-outline', label: 'Erinnerungen', value: data.memories.length },
    { icon: 'image-outline', label: 'Fotos', value: data.photos.length },
    { icon: 'mic-outline', label: 'Audios', value: data.audios.length },
    { icon: 'time-outline', label: 'Zeitkapseln', value: data.capsules.length },
    { icon: 'film-outline', label: 'Familienfilme', value: data.films.length },
  ];
}

// --- Empfehlungen / proaktive Vorschläge ------------------------------------

export function recommendations(data: AssistantData, ref = new Date()): AssistantSuggestion[] {
  const out: AssistantSuggestion[] = [];

  // Geburtstage in den nächsten 30 Tagen
  const birthdays = data.persons
    .filter((p) => p.birth_date && !p.death_date)
    .map((p) => ({ p, days: daysUntilAnnual(p.birth_date!, ref) }))
    .filter((b) => b.days >= 0 && b.days <= 30)
    .sort((a, b) => a.days - b.days)
    .slice(0, 2);
  for (const b of birthdays) {
    const name = fullName(b.p.first_name, b.p.last_name);
    out.push({
      id: `bday-${b.p.id}`,
      icon: 'gift-outline',
      title: b.days === 0 ? `${name} hat heute Geburtstag! 🎉` : `${name} hat in ${b.days} ${b.days === 1 ? 'Tag' : 'Tagen'} Geburtstag`,
      subtitle: 'Erinnerung senden, Event planen oder Film erstellen',
      action: { tab: 'HomeTab', screen: 'Calendar', label: 'Im Kalender ansehen' },
    });
  }

  // Heute vor X Jahren
  const mm = ref.getMonth();
  const dd = ref.getDate();
  const onThis = data.memories
    .filter((m) => m.occurred_on)
    .map((m) => ({ m, d: new Date(m.occurred_on!) }))
    .filter((x) => !Number.isNaN(x.d.getTime()) && x.d.getMonth() === mm && x.d.getDate() === dd && x.d.getFullYear() < ref.getFullYear());
  if (onThis[0]) {
    const yearsAgo = ref.getFullYear() - onThis[0].d.getFullYear();
    out.push({
      id: 'onthisday',
      icon: 'calendar-outline',
      title: `Heute vor ${yearsAgo} Jahren`,
      subtitle: onThis[0].m.title,
      action: { tab: 'HomeTab', screen: 'OnThisDay', label: 'Anzeigen' },
    });
  }

  // Zeitkapseln, die bald öffnen
  const soonCapsule = data.capsules
    .filter((c) => !c.is_opened)
    .map((c) => ({ c, days: daysUntil(c.open_at) }))
    .filter((x) => x.days !== null && (x.days as number) >= 0 && (x.days as number) <= 60)
    .sort((a, b) => (a.days as number) - (b.days as number))[0];
  if (soonCapsule) {
    out.push({
      id: `capsule-${soonCapsule.c.id}`,
      icon: 'lock-open-outline',
      title: 'Eine Zeitkapsel öffnet bald',
      subtitle: `${soonCapsule.c.title} · ${openingCountdown(soonCapsule.c.open_at)}`,
      action: { tab: 'CapsulesTab', screen: 'CapsuleList', label: 'Zeitkapseln ansehen' },
    });
  }

  // Film-Empfehlung
  const eventsWithMoments = data.events.length;
  if (data.memories.length + eventsWithMoments >= 3) {
    out.push({
      id: 'film-reco',
      icon: 'film-outline',
      title: 'Genug Material für einen Familienfilm',
      subtitle: 'Aus euren Ereignissen und Erinnerungen lässt sich ein Film erstellen.',
      action: { tab: 'HomeTab', screen: 'FilmGallery', label: 'Familienfilm öffnen' },
    });
  }

  // Nachlass-Hinweise
  const hasTestament = data.vaultEntries.some((v) => v.category === 'testament');
  const hasPV = data.vaultEntries.some((v) => v.category === 'patientenverfuegung');
  const nachlassMissing: string[] = [];
  if (!hasTestament) nachlassMissing.push('Testament-Hinweis');
  if (!hasPV) nachlassMissing.push('Patientenverfügung');
  if (data.trustees.length < 2) nachlassMissing.push('Vertrauenspersonen');
  if (!data.estate) nachlassMissing.push('Nachlass-Einstellungen');
  if (nachlassMissing.length > 0) {
    out.push({
      id: 'nachlass',
      icon: 'shield-checkmark-outline',
      title: 'Vorsorge vervollständigen',
      subtitle: `Noch offen: ${nachlassMissing.join(' · ')}`,
      action: { tab: 'ProfileTab', screen: 'VaultHub', label: 'Vorsorge öffnen' },
    });
  }

  // Engagement-Hinweis
  const newest = [...data.memories].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
  if (newest) {
    const days = daysUntil(newest.created_at);
    if (days !== null && Math.abs(days as number) > 45) {
      out.push({
        id: 'engagement',
        icon: 'add-circle-outline',
        title: 'Lange keine Erinnerung mehr',
        subtitle: 'Möchtest du ein Foto oder eine Geschichte festhalten?',
        action: { tab: 'MemoriesTab', screen: 'MemoryForm', label: 'Erinnerung hinzufügen' },
      });
    }
  }

  return out;
}

// --- Strukturierte Antworten (Intent-Erkennung) -----------------------------

function joinNames(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} und ${items[items.length - 1]}`;
}

export function structuredAnswer(data: AssistantData, query: string): AssistantAnswer | null {
  const q = fold(query);

  // Anzahl / Statistik
  if (q.includes('wie viele') || q.includes('anzahl')) {
    return {
      found: true,
      answer:
        `In eurer Familie sind aktuell ${data.persons.length} Personen erfasst – mit ` +
        `${data.memories.length} Erinnerungen, ${data.photos.length} Fotos, ${data.audios.length} Audios, ` +
        `${data.capsules.length} Zeitkapseln und ${data.films.length} Familienfilmen.`,
    };
  }

  // Zeitkapseln
  if (q.includes('zeitkapsel')) {
    const open = data.capsules
      .filter((c) => !c.is_opened)
      .sort((a, b) => a.open_at.localeCompare(b.open_at));
    if (open.length === 0) return { found: true, answer: 'Aktuell warten keine ungeöffneten Zeitkapseln.' };
    return {
      found: true,
      answer:
        'Diese Zeitkapseln sind noch verschlossen:\n\n' +
        open.map((c) => `• ${c.title} – ${openingCountdown(c.open_at)}`).join('\n'),
    };
  }

  // Filme
  if (q.includes('film')) {
    if (data.films.length === 0) return { found: true, answer: 'Es gibt noch keine Familienfilme. Du kannst im Bereich „Familienfilm" einen erstellen.' };
    return { found: true, answer: 'Diese Familienfilme existieren:\n\n' + data.films.map((f) => `• ${f.title}`).join('\n') };
  }

  // Ältester Verwandter
  if (q.includes('altest') || q.includes('aeltest')) {
    const withDate = data.persons.filter((p) => p.birth_date).sort((a, b) => a.birth_date!.localeCompare(b.birth_date!));
    const oldest = withDate[0];
    if (oldest) {
      return { found: true, answer: `${fullName(oldest.first_name, oldest.last_name)} ist die älteste erfasste Person – geboren am ${formatDate(oldest.birth_date)}.` };
    }
  }

  // Wohnort / Stadt
  if (q.includes('wohnt') || q.includes('lebt') || q.includes('stadt') || q.includes('munchen') || q.includes('hamburg') || q.includes('lubeck')) {
    const matches = data.persons.filter((p) => p.birth_place && q.includes(fold(p.birth_place)));
    if (matches.length > 0) {
      return { found: true, answer: `${joinNames(matches.map((p) => fullName(p.first_name, p.last_name)))} ${matches.length > 1 ? 'sind' : 'ist'} mit diesem Ort verbunden (laut hinterlegtem Geburtsort).` };
    }
  }

  // Geburtstag einer Person
  if (q.includes('geburtstag') || q.includes('geboren')) {
    const person = data.persons.find((p) => q.includes(fold(p.first_name)) && p.birth_date);
    if (person) {
      const days = daysUntilAnnual(person.birth_date!);
      return {
        found: true,
        answer: `${fullName(person.first_name, person.last_name)} wurde am ${formatDate(person.birth_date)} geboren – ${days === 0 ? 'heute ist der Geburtstag! 🎉' : `der nächste Geburtstag ist in ${days} Tagen.`}`,
      };
    }
    // Allgemein: nächste Geburtstage
    const upcoming = data.persons
      .filter((p) => p.birth_date && !p.death_date)
      .map((p) => ({ p, days: daysUntilAnnual(p.birth_date!) }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 3);
    if (upcoming.length > 0) {
      return {
        found: true,
        answer: 'Die nächsten Geburtstage:\n\n' + upcoming.map((u) => `• ${fullName(u.p.first_name, u.p.last_name)} – in ${u.days} Tagen`).join('\n'),
      };
    }
  }

  return null; // → Fallback an den Familienhistoriker (extraktiv)
}
