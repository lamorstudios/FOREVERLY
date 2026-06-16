/**
 * Familienmuseum – Aggregation echter Familieninhalte zu Museums-Ansichten.
 * Keine erfundenen Inhalte; alles wird aus vorhandenen Daten abgeleitet.
 */
import { fullName } from '@/lib/format';
import type {
  Person,
  Relationship,
  RelationshipType,
  Memory,
  Photo,
  Audio,
  TimeCapsule,
  FamilyEvent,
  FilmProject,
  CalendarEvent,
  Artifact,
} from '@/types/models';

export interface MuseumData {
  persons: Person[];
  relationships: Relationship[];
  memories: Memory[];
  photos: Photo[];
  audios: Audio[];
  capsules: TimeCapsule[];
  events: FamilyEvent[];
  films: FilmProject[];
  calendarEvents: CalendarEvent[];
  artifacts: Artifact[];
}

// Generationsversatz von `to` relativ zu `from` (gen(to) − gen(from)).
const GEN_DELTA: Partial<Record<RelationshipType, number>> = {
  vater: -1, mutter: -1, stiefvater: -1, stiefmutter: -1,
  oma: -2, opa: -2, tante: -1, onkel: -1,
  sohn: 1, tochter: 1, stiefkind: 1, adoptivkind: 1, pflegekind: 1,
  nichte: 1, neffe: 1,
};

function yearOf(date?: string | null): number | null {
  if (!date) return null;
  const y = new Date(date).getFullYear();
  return Number.isNaN(y) ? null : y;
}

// --- Generationen -----------------------------------------------------------

export interface GenerationGroup {
  index: number; // 1 = älteste Generation
  persons: Person[];
}

export function generations(d: MuseumData): GenerationGroup[] {
  const byId = new Map(d.persons.map((p) => [p.id, p]));
  const neighbors = new Map<string, { id: string; delta: number }[]>();
  const add = (a: string, b: string, delta: number) => {
    if (!neighbors.has(a)) neighbors.set(a, []);
    neighbors.get(a)!.push({ id: b, delta });
  };
  for (const r of d.relationships) {
    const delta = GEN_DELTA[r.type] ?? 0;
    add(r.from_person_id, r.to_person_id, delta);
    add(r.to_person_id, r.from_person_id, -delta);
  }
  const gen = new Map<string, number>();
  for (const start of d.persons.map((p) => p.id)) {
    if (gen.has(start)) continue;
    gen.set(start, 0);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const n of neighbors.get(cur) ?? []) {
        if (gen.has(n.id)) continue;
        gen.set(n.id, gen.get(cur)! + n.delta);
        queue.push(n.id);
      }
    }
  }
  const min = Math.min(...[...gen.values()]);
  const groups = new Map<number, Person[]>();
  for (const p of d.persons) {
    const idx = (gen.get(p.id) ?? 0) - min + 1;
    if (!groups.has(idx)) groups.set(idx, []);
    groups.get(idx)!.push(byId.get(p.id)!);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([index, persons]) => ({
      index,
      persons: persons.sort((a, b) => (a.birth_date ?? '').localeCompare(b.birth_date ?? '')),
    }));
}

// --- Zeitreise / Stammbaum-Zeitmaschine -------------------------------------

export interface TimeTravelResult {
  year: number;
  births: Person[];
  deaths: Person[];
  alive: Person[]; // bereits geboren und (noch) nicht verstorben
  memories: Memory[];
  events: FamilyEvent[];
}

export function timeTravel(d: MuseumData, year: number): TimeTravelResult {
  const births = d.persons.filter((p) => yearOf(p.birth_date) === year);
  const deaths = d.persons.filter((p) => yearOf(p.death_date) === year);
  const alive = d.persons.filter((p) => {
    const b = yearOf(p.birth_date);
    const de = yearOf(p.death_date);
    return b !== null && b <= year && (de === null || de >= year);
  });
  const memories = d.memories.filter((m) => yearOf(m.occurred_on ?? m.created_at) === year);
  const events = d.events.filter((e) => yearOf(e.event_date) === year);
  return { year, births, deaths, alive, memories, events };
}

/** Jahre, zu denen es Inhalte gibt (für die Zeitreise-Auswahl). */
export function contentYears(d: MuseumData): number[] {
  const set = new Set<number>();
  d.persons.forEach((p) => { const y = yearOf(p.birth_date); if (y) set.add(y); });
  d.memories.forEach((m) => { const y = yearOf(m.occurred_on ?? m.created_at); if (y) set.add(y); });
  d.events.forEach((e) => { const y = yearOf(e.event_date); if (y) set.add(y); });
  return [...set].sort((a, b) => b - a);
}

// --- Orte / Karte -----------------------------------------------------------

export interface PlaceGroup {
  place: string;
  persons: Person[];
}

export function placesByPerson(d: MuseumData): PlaceGroup[] {
  const map = new Map<string, Person[]>();
  for (const p of d.persons) {
    if (!p.birth_place) continue;
    if (!map.has(p.birth_place)) map.set(p.birth_place, []);
    map.get(p.birth_place)!.push(p);
  }
  return [...map.entries()]
    .map(([place, persons]) => ({ place, persons }))
    .sort((a, b) => b.persons.length - a.persons.length);
}

// --- Ausstellungen ----------------------------------------------------------

export interface Exhibition {
  id: string;
  title: string;
  subtitle: string;
  kind: 'event' | 'theme';
  // bei 'event': eventId; bei 'theme': Suchbegriff für Erinnerungsreise
  ref: string;
  themeQuery?: string;
}

export function exhibitions(d: MuseumData): Exhibition[] {
  const out: Exhibition[] = [];
  for (const e of d.events) {
    out.push({ id: `ev-${e.id}`, title: e.title, subtitle: e.location ?? 'Familienereignis', kind: 'event', ref: e.id });
  }
  // Themen-Ausstellungen, wenn passende Erinnerungen existieren
  const themes: { title: string; words: string[]; query: string }[] = [
    { title: 'Hochzeiten in der Familie', words: ['hochzeit', 'heirat', 'ja-wort'], query: 'Hochzeit Heirat' },
    { title: 'Familienurlaube', words: ['urlaub', 'reise', 'italien', 'ostsee'], query: 'Urlaub Reise Italien Ostsee' },
    { title: 'Kindheit & Aufwachsen', words: ['kindheit', 'schule', 'kind'], query: 'Kindheit Schule' },
  ];
  const corpus = d.memories.map((m) => `${m.title} ${m.description ?? ''}`.toLowerCase()).join(' ');
  for (const t of themes) {
    if (t.words.some((w) => corpus.includes(w))) {
      out.push({ id: `th-${t.title}`, title: t.title, subtitle: 'Themen-Ausstellung', kind: 'theme', ref: t.query, themeQuery: t.query });
    }
  }
  return out;
}

// --- Statistik --------------------------------------------------------------

export interface MuseumStat { icon: string; label: string; value: number }

export function museumStats(d: MuseumData): MuseumStat[] {
  return [
    { icon: 'layers-outline', label: 'Generationen', value: generations(d).length },
    { icon: 'people-outline', label: 'Familienmitglieder', value: d.persons.length },
    { icon: 'image-outline', label: 'Fotos', value: d.photos.length },
    { icon: 'mic-outline', label: 'Audios', value: d.audios.length },
    { icon: 'sparkles-outline', label: 'Erinnerungen', value: d.memories.length },
    { icon: 'time-outline', label: 'Zeitkapseln', value: d.capsules.length },
    { icon: 'film-outline', label: 'Familienfilme', value: d.films.length },
    { icon: 'cube-outline', label: 'Artefakte', value: d.artifacts.length },
  ];
}

// --- Jubiläen ---------------------------------------------------------------

export function jubilees(d: MuseumData, ref: Date = new Date()): string[] {
  const out: string[] = [];
  const yr = ref.getFullYear();
  // Runde Geburtstage
  for (const p of d.persons) {
    const b = yearOf(p.birth_date);
    if (b === null || p.death_date) continue;
    const age = yr - b;
    if (age > 0 && age % 10 === 0) out.push(`${fullName(p.first_name, p.last_name)} wird dieses Jahr ${age}.`);
  }
  // Hochzeitstage (Kalender-Jahrestage)
  for (const c of d.calendarEvents) {
    if (c.type !== 'jahrestag') continue;
    const y = yearOf(c.event_date);
    if (y === null) continue;
    const years = yr - y;
    if (years > 0 && years % 5 === 0) out.push(`${c.title}: ${years} Jahre.`);
  }
  // 100 Jahre Familiengeschichte
  const earliest = Math.min(...d.persons.map((p) => yearOf(p.birth_date) ?? yr));
  if (Number.isFinite(earliest) && yr - earliest >= 100) {
    out.push(`Über ${yr - earliest} Jahre Familiengeschichte – seit ${earliest}.`);
  }
  return out;
}
