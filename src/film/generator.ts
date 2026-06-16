/**
 * Familienfilm-Generator – baut aus ECHTEN Familieninhalten ein Storyboard
 * (Kapitel + Szenen). Keine generischen KI-Videos: jede Szene stammt aus
 * vorhandenen Fotos, Videos, Audios, Erinnerungen oder Ereignissen.
 * Originalstimmen (Audios mit Transkript) werden bevorzugt eingebunden.
 */
import { fullName, formatDate } from '@/lib/format';
import type {
  Person,
  Memory,
  Photo,
  Audio,
  FamilyEvent,
  Moment,
  LegacyItem,
  FarewellMessage,
  FilmProject,
  FilmScene,
  FilmChapter,
  GeneratedFilm,
} from '@/types/models';

export interface FilmData {
  persons: Person[];
  memories: Memory[];
  photos: Photo[];
  audios: Audio[];
  events: FamilyEvent[];
  moments: Moment[];
  legacyItems: LegacyItem[];
  farewellMessages: FarewellMessage[];
}

let sid = 0;
const nid = () => `s${sid++}`;

function nameOf(persons: Person[], id?: string | null): string | null {
  const p = id ? persons.find((x) => x.id === id) : null;
  return p ? fullName(p.first_name, p.last_name) : null;
}

function titleScene(title: string, caption?: string | null): FilmScene {
  return { id: nid(), type: 'title', title, caption: caption ?? null };
}
function photoScene(p: Photo): FilmScene {
  return { id: nid(), type: 'photo', mediaPath: p.storage_path, caption: p.caption, date: p.created_at };
}
function momentScene(m: Moment): FilmScene {
  return {
    id: nid(),
    type: m.kind === 'video' ? 'video' : m.kind === 'audio' ? 'audio' : 'photo',
    caption: m.text,
    mediaPath: m.storage_path,
    transcript: m.transcript ?? null,
    date: m.created_at,
  };
}
function audioScene(a: Audio, persons: Person[]): FilmScene {
  return {
    id: nid(),
    type: 'audio',
    title: a.title,
    transcript: a.transcript ?? null,
    personName: nameOf(persons, a.person_id),
    date: a.created_at,
  };
}
function memoryScene(m: Memory): FilmScene {
  return { id: nid(), type: 'text', title: m.title, caption: m.description, date: m.occurred_on ?? m.created_at };
}

function yearOf(date?: string | null): number | null {
  if (!date) return null;
  const y = new Date(date).getFullYear();
  return Number.isNaN(y) ? null : y;
}

function pack(chapters: FilmChapter[]): FilmChapter[] {
  return chapters.filter((c) => c.scenes.length > 0);
}

/** Erzeugt das Storyboard zu einem Filmprojekt aus den vorhandenen Inhalten. */
export function generateFilm(data: FilmData, project: FilmProject): GeneratedFilm {
  sid = 0;
  const { persons } = data;
  let chapters: FilmChapter[] = [];

  if (project.kind === 'event') {
    const ev = data.events.find((e) => e.id === project.options.eventId);
    const moments = data.moments.filter((m) => m.event_id === project.options.eventId);
    chapters = [
      { key: 'intro', title: 'Der Tag', scenes: [titleScene(project.title, ev ? `${formatDate(ev.event_date)}${ev.location ? ` · ${ev.location}` : ''}` : project.subtitle)] },
      { key: 'highlights', title: 'Höhepunkte', scenes: moments.filter((m) => m.kind !== 'audio').map((m) => momentScene(m)) },
      { key: 'voices', title: 'Stimmen & Momente', scenes: moments.filter((m) => m.kind === 'audio').map((m) => momentScene(m)) },
    ];
  } else if (project.kind === 'person' || project.kind === 'documentary') {
    const pid = project.options.personId!;
    const person = persons.find((p) => p.id === pid);
    const photos = data.photos.filter((p) => p.person_id === pid);
    const memories = data.memories.filter((m) => m.person_id === pid).sort((a, b) => (a.occurred_on ?? '').localeCompare(b.occurred_on ?? ''));
    const audios = data.audios.filter((a) => a.person_id === pid);
    const events = data.events.filter((e) => e.host_person_id === pid);
    chapters = [
      { key: 'intro', title: 'Anfänge', scenes: [titleScene(project.title, person?.birth_date ? `geboren am ${formatDate(person.birth_date)}${person.birth_place ? ` in ${person.birth_place}` : ''}` : project.subtitle)] },
      { key: 'memories', title: 'Erinnerungen', scenes: [...memories.map(memoryScene), ...photos.map(photoScene)] },
      { key: 'voices', title: 'Originalstimmen', scenes: audios.map((a) => audioScene(a, persons)) },
      { key: 'family', title: 'Familie & Feiern', scenes: events.map((e) => titleScene(e.title, formatDate(e.event_date))) },
    ];
  } else if (project.kind === 'year') {
    const y = project.options.year!;
    chapters = [
      { key: 'intro', title: `Familienjahr ${y}`, scenes: [titleScene(project.title, project.subtitle)] },
      { key: 'events', title: 'Ereignisse', scenes: data.events.filter((e) => yearOf(e.event_date) === y).map((e) => titleScene(e.title, formatDate(e.event_date))) },
      { key: 'memories', title: 'Erinnerungen', scenes: data.memories.filter((m) => yearOf(m.occurred_on ?? m.created_at) === y).map(memoryScene) },
      { key: 'moments', title: 'Momente', scenes: data.moments.filter((m) => yearOf(m.created_at) === y && m.kind !== 'audio').map((m) => momentScene(m)) },
    ];
  } else if (project.kind === 'legacy') {
    const pid = project.options.personId ?? null;
    const farewell = data.farewellMessages;
    const legacy = data.legacyItems;
    chapters = [
      { key: 'intro', title: 'Mein Vermächtnis', scenes: [titleScene(project.title, project.subtitle)] },
      { key: 'message', title: 'Meine Botschaft', scenes: farewell.map((f) => ({ id: nid(), type: 'video' as const, title: f.title, caption: f.content, mediaPath: f.media_path, transcript: f.content })) },
      { key: 'values', title: 'Werte & Lektionen', scenes: legacy.map((l) => ({ id: nid(), type: 'text' as const, title: l.title, caption: l.content })) },
      { key: 'memories', title: 'Erinnerungen', scenes: (pid ? data.photos.filter((p) => p.person_id === pid) : data.photos).slice(0, 6).map(photoScene) },
    ];
  }

  // Versteckte Kapitel entfernen, leere Kapitel verwerfen.
  chapters = pack(chapters.filter((c) => !project.hidden_chapters.includes(c.key)));

  const sceneCount = chapters.reduce((n, c) => n + c.scenes.length, 0);
  const hasOriginalVoices = chapters.some((c) => c.scenes.some((s) => s.type === 'audio' && s.transcript));
  return { chapters, sceneCount, durationSec: Math.max(20, sceneCount * 5), hasOriginalVoices };
}

/** Schlägt automatische Filme aus den vorhandenen Inhalten vor. */
export interface AutoFilmSuggestion {
  kind: FilmProject['kind'];
  title: string;
  subtitle: string;
  options: FilmProject['options'];
}

export function autoFilmSuggestions(data: FilmData): AutoFilmSuggestion[] {
  const out: AutoFilmSuggestion[] = [];
  // Ereignis-Filme (Events mit Momenten)
  for (const ev of data.events) {
    const count = data.moments.filter((m) => m.event_id === ev.id).length;
    if (count > 0) out.push({ kind: 'event', title: ev.title, subtitle: `${count} Momente · ${formatDate(ev.event_date)}`, options: { eventId: ev.id } });
  }
  // Personen-Filme (Personen mit genügend Inhalten)
  for (const p of data.persons) {
    const c = data.photos.filter((x) => x.person_id === p.id).length + data.memories.filter((x) => x.person_id === p.id).length + data.audios.filter((x) => x.person_id === p.id).length;
    if (c >= 2) out.push({ kind: 'person', title: `${fullName(p.first_name, p.last_name)}`, subtitle: `Lebensfilm · ${c} Inhalte`, options: { personId: p.id } });
  }
  // Jahresrückblicke
  const years = new Set<number>();
  for (const m of data.memories) { const y = yearOf(m.occurred_on ?? m.created_at); if (y) years.add(y); }
  for (const e of data.events) { const y = yearOf(e.event_date); if (y) years.add(y); }
  [...years].sort((a, b) => b - a).slice(0, 3).forEach((y) =>
    out.push({ kind: 'year', title: `Familienjahr ${y}`, subtitle: 'Jahresrückblick', options: { year: y } }),
  );
  return out;
}
