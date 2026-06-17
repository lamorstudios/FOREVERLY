import { listEvents } from './familyEvents';
import { listMemories } from './memories';
import { listPersons } from './persons';
import { listPhotos } from './media';
import { listMyCapsules } from './timeCapsules';
import { listFamilyQuotes } from './memorial';
import { getFamilyKnowledge, getImportantPeople, getTopics } from './historian';
import { EVENT_TYPES } from '@/constants/events';
import { fullName } from '@/lib/format';
import type { ChronicleEntry } from '@/types/models';

/**
 * Familienchronik: aus vorhandenen Daten (Events, Erinnerungen, Geburten/
 * Sterbedaten) chronologisch zusammengestellt. Keine erfundenen Inhalte.
 */
export async function getChronicle(familyId: string): Promise<ChronicleEntry[]> {
  const [events, memories, persons, capsules] = await Promise.all([
    listEvents(familyId),
    listMemories(familyId),
    listPersons(familyId),
    listMyCapsules(familyId),
  ]);

  const entries: ChronicleEntry[] = [];

  // Zeitkapseln (auch in der Zukunft – „für kommende Generationen").
  for (const c of capsules) {
    const date = c.open_at ?? c.created_at;
    entries.push({
      id: `capsule-${c.id}`,
      year: yearOf(date),
      date,
      title: `Zeitkapsel: ${c.title}`,
      source_type: 'capsule',
      source_id: c.id,
    });
  }

  for (const e of events) {
    entries.push({
      id: `event-${e.id}`,
      year: yearOf(e.event_date),
      date: e.event_date,
      title: `${EVENT_TYPES[e.type].label}: ${e.title}`,
      source_type: 'event',
      source_id: e.id,
    });
  }

  for (const m of memories) {
    const date = m.occurred_on ?? m.created_at;
    entries.push({
      id: `memory-${m.id}`,
      year: yearOf(date),
      date,
      title: m.title,
      source_type: 'memory',
      source_id: m.id,
    });
  }

  for (const p of persons) {
    if (p.birth_date) {
      entries.push({
        id: `birth-${p.id}`,
        year: yearOf(p.birth_date),
        date: p.birth_date,
        title: `Geburt von ${fullName(p.first_name, p.last_name)}`,
        source_type: 'birth',
        source_id: p.id,
      });
    }
    if (p.death_date) {
      entries.push({
        id: `death-${p.id}`,
        year: yearOf(p.death_date),
        date: p.death_date,
        title: `${fullName(p.first_name, p.last_name)} verstorben`,
        source_type: 'death',
        source_id: p.id,
      });
    }
  }

  return entries
    .filter((e) => !Number.isNaN(e.year))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

function yearOf(date: string): number {
  return new Date(date).getFullYear();
}

// --- Familienhistoriker: lesbare Familiengeschichte (aus echten Daten) -------

export interface FamilyStory {
  hasData: boolean;
  yearFrom: number | null;
  yearTo: number | null;
  counts: {
    memories: number;
    photos: number;
    persons: number;
    events: number;
    capsules: number;
    honorary: number;
    quotes: number;
  };
  places: string[];
  people: string[];
  topics: string[];
  honoraryNames: string[];
  /** Warme, lesbare Absätze – ausschließlich aus vorhandenen Inhalten. */
  paragraphs: string[];
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} und ${items[items.length - 1]}`;
}

/**
 * Stellt aus allen Familieninhalten eine lesbare Geschichte zusammen: Zeitspanne,
 * wiederkehrende Orte, zentrale Personen und Themen sowie Ehrenmitglieder.
 * Erkennungen sind fehlertolerant (nie ein Absturz) und nichts wird erfunden.
 */
export async function getFamilyStory(familyId: string): Promise<FamilyStory> {
  const [memories, photos, persons, events, capsules, quotes] = await Promise.all([
    listMemories(familyId),
    listPhotos(familyId),
    listPersons(familyId),
    listEvents(familyId),
    listMyCapsules(familyId),
    listFamilyQuotes(familyId),
  ]);

  const years: number[] = [];
  for (const p of persons) {
    if (p.birth_date) years.push(yearOf(p.birth_date));
    if (p.death_date) years.push(yearOf(p.death_date));
  }
  for (const m of memories) if (m.occurred_on) years.push(yearOf(m.occurred_on));
  for (const e of events) years.push(yearOf(e.event_date));
  const valid = years.filter((y) => !Number.isNaN(y));
  const yearFrom = valid.length ? Math.min(...valid) : null;
  const yearTo = valid.length ? Math.max(...valid) : null;

  const honoraryPeople = persons.filter((p) => p.is_memorial);
  const honoraryNames = honoraryPeople.map((p) => fullName(p.first_name, p.last_name));

  const counts = {
    memories: memories.length,
    photos: photos.length,
    persons: persons.length,
    events: events.length,
    capsules: capsules.length,
    honorary: honoraryPeople.length,
    quotes: quotes.length,
  };

  const hasData =
    memories.length + photos.length + events.length + honoraryPeople.length > 0 ||
    persons.length > 1;

  let places: string[] = [];
  let people: string[] = [];
  let topics: string[] = [];
  try {
    const k = await getFamilyKnowledge(familyId);
    places = (k.origins ?? []).slice(0, 3).map((o) => o.label);
  } catch { /* keine Orte – ok */ }
  try {
    const ip = await getImportantPeople(familyId);
    people = ip.slice(0, 3).map((i) => fullName(i.person.first_name, i.person.last_name));
  } catch { /* keine Personen – ok */ }
  try {
    const t = await getTopics(familyId);
    topics = t.slice(0, 3).map((x) => x.label);
  } catch { /* keine Themen – ok */ }

  const paragraphs: string[] = [];
  if (hasData) {
    if (yearFrom && yearTo && yearTo > yearFrom) {
      paragraphs.push(
        `Eure Familiengeschichte reicht von ${yearFrom} bis ${yearTo} – über ${yearTo - yearFrom} Jahre hinweg.`,
      );
    }
    const bits: string[] = [];
    if (counts.memories) bits.push(`${counts.memories} Erinnerungen`);
    if (counts.photos) bits.push(`${counts.photos} Fotos`);
    if (counts.events) bits.push(`${counts.events} Familienereignisse`);
    if (bits.length) paragraphs.push(`Bisher habt ihr ${joinList(bits)} zusammengetragen.`);
    if (people.length) paragraphs.push(`Im Mittelpunkt stehen ${joinList(people)}.`);
    if (places.length) paragraphs.push(`Immer wieder kehren Orte wie ${joinList(places)} zurück.`);
    if (topics.length) paragraphs.push(`Häufige Themen eurer Geschichte: ${joinList(topics)}.`);
    if (honoraryNames.length) {
      paragraphs.push(
        `${joinList(honoraryNames)} ${honoraryNames.length === 1 ? 'wird' : 'werden'} hier in liebevoller Erinnerung bewahrt${
          counts.quotes ? ` – mit ${counts.quotes} gesammelten Zitaten` : ''
        }.`,
      );
    }
  }

  return { hasData, yearFrom, yearTo, counts, places, people, topics, honoraryNames, paragraphs };
}
