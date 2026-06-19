import { listEvents } from './familyEvents';
import { listMemories } from './memories';
import { listPersons } from './persons';
import { EVENT_TYPES } from '@/constants/events';
import { fullName } from '@/lib/format';
import type { ChronicleEntry } from '@/types/models';

/**
 * Familienchronik: aus vorhandenen Daten (Events, Erinnerungen, Geburten/
 * Sterbedaten) chronologisch zusammengestellt. Keine erfundenen Inhalte.
 */
export async function getChronicle(familyId: string): Promise<ChronicleEntry[]> {
  const [events, memories, persons] = await Promise.all([
    listEvents(familyId),
    listMemories(familyId),
    listPersons(familyId),
  ]);

  const entries: ChronicleEntry[] = [];

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
