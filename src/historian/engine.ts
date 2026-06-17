/**
 * Familienhistoriker – deterministische RAG-Engine (clientseitig).
 *
 * Grundsätze:
 *  - Es werden AUSSCHLIESSLICH vorhandene Familieninhalte durchsucht.
 *  - Antworten werden NICHT frei generiert, sondern aus den gefundenen
 *    Inhalten zusammengestellt (extraktiv) – dadurch keine Halluzinationen.
 *  - Jede Antwort führt ihre Quellen auf (nachvollziehbar).
 *
 * In Produktion kann dieselbe Treffermenge zusätzlich von einem Sprachmodell
 * (z.B. Claude) sprachlich zusammengefasst werden – siehe
 * supabase/functions/family-historian. Die Quellenbindung bleibt gleich.
 */
import { fullName, formatDate } from '@/lib/format';
import type {
  Person,
  Memory,
  Photo,
  Audio,
  TimeCapsule,
  CalendarEvent,
  Relationship,
  PersonQuote,
  PersonTribute,
} from '@/types/models';

export type KnowledgeKind =
  | 'person'
  | 'memory'
  | 'photo'
  | 'audio'
  | 'time_capsule';

export type WisdomCategory =
  | 'liebe'
  | 'familie'
  | 'arbeit'
  | 'geld'
  | 'glueck'
  | 'gesundheit'
  | 'sonstige';

export interface HistorianSource {
  kind: KnowledgeKind;
  label: string;
  entityId: string;
  personId?: string | null;
  date?: string | null;
}

export interface KnowledgeDoc {
  id: string;
  kind: KnowledgeKind;
  personId: string | null;
  title: string;
  text: string;
  date: string | null;
  source: HistorianSource;
  tokens: string[];
}

export interface HistorianAnswer {
  query: string;
  found: boolean;
  answer: string;
  passages: { text: string; source: HistorianSource }[];
  sources: HistorianSource[];
}

export interface WisdomEntry {
  id: string;
  category: WisdomCategory;
  text: string;
  source: HistorianSource;
}

export interface TimelineEntry {
  id: string;
  date: string;
  year: number;
  label: string;
  source: HistorianSource;
}

export interface PersonInsight {
  person: Person;
  biography: string;
  memoryCount: number;
  photoCount: number;
  audioCount: number;
  sources: HistorianSource[];
}

export interface KnowledgeGap {
  personId: string;
  personName: string;
  message: string;
  suggestion: 'audio' | 'photo' | 'memory';
}

export interface FamilyData {
  persons: Person[];
  memories: Memory[];
  photos: Photo[];
  audios: Audio[];
  capsules: TimeCapsule[];
  calendarEvents: CalendarEvent[];
  relationships: Relationship[];
  /** Phase 16: Zitate & Erinnerungen von Ehrenmitgliedern (für Buch/Historiker). */
  quotes?: PersonQuote[];
  tributes?: PersonTribute[];
}

export interface KnowledgeBase {
  docs: KnowledgeDoc[];
  data: FamilyData;
  personById: Map<string, Person>;
}

// --- Textverarbeitung --------------------------------------------------

const STOPWORDS = new Set([
  'der', 'die', 'das', 'und', 'oder', 'wie', 'wo', 'wer', 'was', 'wann',
  'ist', 'sind', 'war', 'waren', 'ein', 'eine', 'einer', 'den', 'dem',
  'von', 'mit', 'für', 'auf', 'aus', 'bei', 'im', 'in', 'an', 'zu', 'zur',
  'zum', 'es', 'er', 'sie', 'wir', 'ihr', 'ich', 'du', 'haben', 'hat',
  'hatte', 'sich', 'man', 'auch', 'noch', 'nur', 'mehr', 'gibt', 'welche',
  'welcher', 'welches', 'unsere', 'unser', 'unseren', 'über',
]);

function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss');
}

export function tokenize(text: string): string[] {
  return fold(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

// --- Wissensbasis aufbauen --------------------------------------------

function birthLine(p: Person): string {
  const name = fullName(p.first_name, p.last_name);
  const parts: string[] = [];
  if (p.birth_date) {
    parts.push(`${name} wurde am ${formatDate(p.birth_date)} geboren`);
  } else {
    parts.push(name);
  }
  if (p.birth_place) parts[parts.length - 1] += ` in ${p.birth_place}`;
  if (p.death_date) parts.push(`verstorben am ${formatDate(p.death_date)}`);
  return parts.join(', ') + '.';
}

export function buildKnowledgeBase(data: FamilyData): KnowledgeBase {
  const personById = new Map(data.persons.map((p) => [p.id, p]));
  const docs: KnowledgeDoc[] = [];

  const nameOf = (id?: string | null) =>
    id && personById.has(id)
      ? fullName(personById.get(id)!.first_name, personById.get(id)!.last_name)
      : '';

  // Personen / Profile
  for (const p of data.persons) {
    const name = fullName(p.first_name, p.last_name);
    const text = [birthLine(p), p.biography ?? '']
      .filter(Boolean)
      .join(' ');
    docs.push({
      id: `person-${p.id}`,
      kind: 'person',
      personId: p.id,
      title: name,
      text,
      date: p.birth_date,
      source: {
        kind: 'person',
        label: `Profil von ${name}`,
        entityId: p.id,
        personId: p.id,
        date: p.birth_date,
      },
    } as unknown as KnowledgeDoc);
  }

  // Erinnerungen
  for (const m of data.memories) {
    const text = [m.title, m.description ?? ''].filter(Boolean).join('. ');
    docs.push({
      id: `memory-${m.id}`,
      kind: 'memory',
      personId: m.person_id,
      title: m.title,
      text,
      date: m.occurred_on ?? m.created_at,
      source: {
        kind: 'memory',
        label: `Erinnerung „${m.title}"${m.occurred_on ? ` vom ${formatDate(m.occurred_on)}` : ''}`,
        entityId: m.id,
        personId: m.person_id,
        date: m.occurred_on,
      },
    } as unknown as KnowledgeDoc);
  }

  // Fotos
  for (const ph of data.photos) {
    const text = [ph.caption ?? '', nameOf(ph.person_id)]
      .filter(Boolean)
      .join('. ');
    if (!text) continue;
    docs.push({
      id: `photo-${ph.id}`,
      kind: 'photo',
      personId: ph.person_id,
      title: ph.caption ?? 'Foto',
      text,
      date: ph.created_at,
      source: {
        kind: 'photo',
        label: `Foto${ph.caption ? ` „${ph.caption}"` : ''}`,
        entityId: ph.id,
        personId: ph.person_id,
        date: ph.created_at,
      },
    } as unknown as KnowledgeDoc);
  }

  // Audios (inkl. Transkription, falls vorhanden → durchsuchbar)
  for (const a of data.audios) {
    const who = nameOf(a.person_id);
    const text = [a.title ?? 'Audioaufnahme', who, a.transcript ?? ''].filter(Boolean).join('. ');
    docs.push({
      id: `audio-${a.id}`,
      kind: 'audio',
      personId: a.person_id,
      title: a.title ?? 'Audioaufnahme',
      text,
      date: a.created_at,
      source: {
        kind: 'audio',
        label: who ? `Audio von ${who}` : `Audioaufnahme${a.title ? ` „${a.title}"` : ''}`,
        entityId: a.id,
        personId: a.person_id,
        date: a.created_at,
      },
    } as unknown as KnowledgeDoc);
  }

  // Zeitkapseln – NUR freigegebene (geöffnete) Inhalte
  for (const c of data.capsules) {
    if (!c.is_opened) continue;
    const text = [c.title, c.description ?? '', c.text_content ?? '']
      .filter(Boolean)
      .join('. ');
    docs.push({
      id: `capsule-${c.id}`,
      kind: 'time_capsule',
      personId: null,
      title: c.title,
      text,
      date: c.open_at,
      source: {
        kind: 'time_capsule',
        label: `Zeitkapsel „${c.title}"`,
        entityId: c.id,
        date: c.open_at,
      },
    } as unknown as KnowledgeDoc);
  }

  // Tokens vorberechnen
  for (const d of docs) {
    d.tokens = tokenize(`${d.title} ${d.text}`);
  }

  return { docs, data, personById };
}

// --- Retrieval --------------------------------------------------------

function scoreDoc(queryTokens: string[], doc: KnowledgeDoc): number {
  if (queryTokens.length === 0) return 0;
  const titleTokens = new Set(tokenize(doc.title));
  let score = 0;
  for (const qt of queryTokens) {
    const occurrences = doc.tokens.filter((t) => t === qt).length;
    if (occurrences > 0) score += occurrences;
    // Teiltreffer (z.B. "reise" in "reisen")
    else if (doc.tokens.some((t) => t.includes(qt) || qt.includes(t))) score += 0.5;
    if (titleTokens.has(qt)) score += 1.5;
  }
  return score;
}

export function retrieve(
  kb: KnowledgeBase,
  query: string,
  limit = 6,
): { doc: KnowledgeDoc; score: number }[] {
  const queryTokens = tokenize(query);
  return kb.docs
    .map((doc) => ({ doc, score: scoreDoc(queryTokens, doc) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// --- Frage beantworten (extraktiv, mit Quellen) -----------------------

export function answerQuestion(kb: KnowledgeBase, query: string): HistorianAnswer {
  const hits = retrieve(kb, query, 5);

  if (hits.length === 0) {
    return {
      query,
      found: false,
      answer:
        'Dazu liegen mir in euren gespeicherten Familiendaten keine Informationen vor. ' +
        'Vielleicht möchtest du eine passende Erinnerung, ein Foto oder eine Audioaufnahme hinzufügen?',
      passages: [],
      sources: [],
    };
  }

  const passages = hits.map((h) => ({
    text: h.doc.text.trim(),
    source: h.doc.source,
  }));

  const answer =
    'Auf Basis eurer Familiendaten habe ich Folgendes gefunden:\n\n' +
    passages.map((p) => `• ${p.text}`).join('\n\n');

  return {
    query,
    found: true,
    answer,
    passages,
    sources: passages.map((p) => p.source),
  };
}

// --- Globale Suche ----------------------------------------------------

export function search(kb: KnowledgeBase, query: string): KnowledgeDoc[] {
  return retrieve(kb, query, 30).map((r) => r.doc);
}

// --- Kurzbiografie (deterministisch) ----------------------------------

export function buildBiography(kb: KnowledgeBase, person: Person): string {
  const name = fullName(person.first_name, person.last_name);
  const sentences: string[] = [birthLine(person)];

  if (person.biography) sentences.push(person.biography.trim());

  const memoryCount = kb.data.memories.filter((m) => m.person_id === person.id).length;
  const photoCount = kb.data.photos.filter((p) => p.person_id === person.id).length;
  const audioCount = kb.data.audios.filter((a) => a.person_id === person.id).length;

  const counts: string[] = [];
  if (memoryCount) counts.push(`${memoryCount} Erinnerung${memoryCount > 1 ? 'en' : ''}`);
  if (photoCount) counts.push(`${photoCount} Foto${photoCount > 1 ? 's' : ''}`);
  if (audioCount) counts.push(`${audioCount} Audioaufnahme${audioCount > 1 ? 'n' : ''}`);

  if (counts.length) {
    sentences.push(`Zu ${name} sind ${joinDe(counts)} gespeichert.`);
  } else if (!person.biography) {
    sentences.push(`Zu ${name} liegen bislang nur wenige Informationen vor.`);
  }
  return sentences.join(' ');
}

function joinDe(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} und ${items[items.length - 1]}`;
}

// --- Lebensweisheiten (Erkennung aus vorhandenen Texten) --------------

const WISDOM_KEYWORDS: { category: WisdomCategory; words: string[] }[] = [
  { category: 'liebe', words: ['liebe', 'lieben', 'herz'] },
  { category: 'familie', words: ['familie', 'zusammenhalt', 'kinder', 'enkel'] },
  { category: 'arbeit', words: ['arbeit', 'fleiss', 'beruf', 'pflicht'] },
  { category: 'geld', words: ['geld', 'reichtum', 'besitz', 'sparen'] },
  { category: 'glueck', words: ['glück', 'gluck', 'zufrieden', 'dankbar'] },
  { category: 'gesundheit', words: ['gesundheit', 'gesund'] },
];

function categorize(sentence: string): WisdomCategory | null {
  const folded = fold(sentence);
  for (const group of WISDOM_KEYWORDS) {
    if (group.words.some((w) => folded.includes(fold(w)))) return group.category;
  }
  return null;
}

export function extractWisdoms(kb: KnowledgeBase): WisdomEntry[] {
  const seen = new Set<string>();
  const result: WisdomEntry[] = [];

  for (const doc of kb.docs) {
    if (doc.kind === 'photo') continue;
    const sentences = doc.text.split(/(?<=[.!?])\s+/);
    for (const raw of sentences) {
      const sentence = raw.trim();
      if (sentence.length < 12 || sentence.length > 160) continue;
      const category = categorize(sentence);
      if (!category) continue;
      const key = fold(sentence);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        id: `${doc.id}-${result.length}`,
        category,
        text: sentence.replace(/^[•\-\s]+/, ''),
        source: doc.source,
      });
    }
  }
  return result;
}

// --- Ereignis-Timeline -------------------------------------------------

export function buildTimeline(kb: KnowledgeBase): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const p of kb.data.persons) {
    const name = fullName(p.first_name, p.last_name);
    if (p.birth_date) {
      entries.push(makeTimeline(`birth-${p.id}`, p.birth_date, `Geburt von ${name}`, {
        kind: 'person',
        label: `Profil von ${name}`,
        entityId: p.id,
        personId: p.id,
        date: p.birth_date,
      }));
    }
    if (p.death_date) {
      entries.push(makeTimeline(`death-${p.id}`, p.death_date, `${name} verstorben`, {
        kind: 'person',
        label: `Profil von ${name}`,
        entityId: p.id,
        personId: p.id,
        date: p.death_date,
      }));
    }
  }

  for (const m of kb.data.memories) {
    if (!m.occurred_on) continue;
    entries.push(makeTimeline(`mem-${m.id}`, m.occurred_on, m.title, {
      kind: 'memory',
      label: `Erinnerung „${m.title}" vom ${formatDate(m.occurred_on)}`,
      entityId: m.id,
      personId: m.person_id,
      date: m.occurred_on,
    }));
  }

  return entries
    .filter((e) => !Number.isNaN(e.year))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function makeTimeline(
  id: string,
  date: string,
  label: string,
  source: HistorianSource,
): TimelineEntry {
  return { id, date, year: new Date(date).getFullYear(), label, source };
}

// --- Wichtige Personen -------------------------------------------------

export function importantPeople(kb: KnowledgeBase): PersonInsight[] {
  return kb.data.persons
    .map((person) => personInsight(kb, person.id)!)
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.memoryCount + b.photoCount + b.audioCount -
        (a.memoryCount + a.photoCount + a.audioCount),
    );
}

export function personInsight(
  kb: KnowledgeBase,
  personId: string,
): PersonInsight | null {
  const person = kb.personById.get(personId);
  if (!person) return null;

  const memories = kb.data.memories.filter((m) => m.person_id === personId);
  const photos = kb.data.photos.filter((p) => p.person_id === personId);
  const audios = kb.data.audios.filter((a) => a.person_id === personId);

  const sources: HistorianSource[] = kb.docs
    .filter((d) => d.personId === personId)
    .map((d) => d.source);

  return {
    person,
    biography: buildBiography(kb, person),
    memoryCount: memories.length,
    photoCount: photos.length,
    audioCount: audios.length,
    sources,
  };
}

// --- Familienwissen retten (Lücken erkennen) --------------------------

// ====================== Phase 8 · KI-Familienhistoriker ======================

export interface FamilyKnowledge {
  origins: { label: string; count: number }[]; // Orte (Geburtsorte etc.)
  professions: { label: string; count: number }[];
  traditions: { label: string; source: HistorianSource }[];
}

const PROFESSION_WORDS = [
  'Lehrer', 'Lehrerin', 'Tischler', 'Ingenieur', 'Krankenschwester', 'Arzt',
  'Ärztin', 'Bauer', 'Handwerk', 'Handwerker', 'Kaufmann', 'Schneider',
  'Bäcker', 'Pfarrer', 'Seefahrt', 'Seemann',
];
const TRADITION_WORDS = [
  'Streuselkuchen', 'Weihnachten', 'Sonntagskaffee', 'Sonntag', 'Kuchen',
  'Grillen', 'Grillfest', 'Urlaub', 'Ostsee', 'Garten', 'Rezept',
];

/** Aggregiert Familienwissen (nur aus vorhandenen Inhalten). */
export function familyKnowledge(kb: KnowledgeBase): FamilyKnowledge {
  const places = new Map<string, number>();
  for (const p of kb.data.persons) {
    if (p.birth_place) places.set(p.birth_place, (places.get(p.birth_place) ?? 0) + 1);
  }
  const professions = new Map<string, number>();
  const traditions: { label: string; source: HistorianSource }[] = [];
  const seenTradition = new Set<string>();

  for (const doc of kb.docs) {
    const folded = fold(doc.text);
    for (const w of PROFESSION_WORDS) {
      if (folded.includes(fold(w))) professions.set(w, (professions.get(w) ?? 0) + 1);
    }
    for (const w of TRADITION_WORDS) {
      if (folded.includes(fold(w)) && !seenTradition.has(fold(w)) && doc.kind !== 'person') {
        seenTradition.add(fold(w));
        traditions.push({ label: w, source: doc.source });
      }
    }
  }

  const toSorted = (m: Map<string, number>) =>
    [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);

  return { origins: toSorted(places), professions: toSorted(professions), traditions };
}

export interface TopicGroup {
  topic: string;
  label: string;
  count: number;
  sources: HistorianSource[];
}

const TOPIC_KEYWORDS: { topic: string; label: string; words: string[] }[] = [
  { topic: 'kindheit', label: 'Kindheit', words: ['kindheit', 'kind', 'schule', 'einschulung', 'jugend'] },
  { topic: 'auswanderung', label: 'Auswanderung & Herkunft', words: ['stettin', 'auswander', 'flucht', 'heimat', 'herkunft'] },
  { topic: 'hochzeit', label: 'Hochzeit & Liebe', words: ['hochzeit', 'heirat', 'ja-wort', 'liebe', 'jahrestag'] },
  { topic: 'beruf', label: 'Beruf & Arbeit', words: ['arbeit', 'beruf', 'tischler', 'lehrer', 'ingenieur', 'krankenschwester'] },
  { topic: 'familie', label: 'Familie & Feiern', words: ['familie', 'fest', 'feier', 'weihnachten', 'grillen', 'geburtstag'] },
  { topic: 'reisen', label: 'Reisen & Urlaub', words: ['urlaub', 'reise', 'ostsee', 'italien', 'strand', 'see'] },
];

/** Erkennt Themen über vorhandene Inhalte (schlagwortbasiert). */
export function detectTopics(kb: KnowledgeBase): TopicGroup[] {
  const groups = TOPIC_KEYWORDS.map((t) => ({ ...t, count: 0, sources: [] as HistorianSource[] }));
  for (const doc of kb.docs) {
    if (doc.kind === 'person') continue;
    const folded = fold(doc.text);
    for (const g of groups) {
      if (g.words.some((w) => folded.includes(fold(w)))) {
        g.count += 1;
        if (g.sources.length < 6) g.sources.push(doc.source);
      }
    }
  }
  return groups
    .filter((g) => g.count > 0)
    .map(({ topic, label, count, sources }) => ({ topic, label, count, sources }))
    .sort((a, b) => b.count - a.count);
}

export interface PersonConnection {
  person: Person;
  count: number;
  reason: string;
}

/** Erkennt Personen, die häufig gemeinsam mit der Person erwähnt werden. */
export function personConnections(kb: KnowledgeBase, personId: string): PersonConnection[] {
  const target = kb.personById.get(personId);
  if (!target) return [];
  const counts = new Map<string, { count: number; reasons: Set<string> }>();
  const bump = (id: string, reason: string) => {
    if (id === personId || !kb.personById.has(id)) return;
    if (!counts.has(id)) counts.set(id, { count: 0, reasons: new Set() });
    const e = counts.get(id)!;
    e.count += 1;
    e.reasons.add(reason);
  };

  // Gemeinsame Familienereignisse (Kalender-Teilnehmer).
  for (const ev of kb.data.calendarEvents) {
    const ids = ev.participant_ids ?? [];
    if (ids.includes(personId)) ids.forEach((id) => bump(id, 'gemeinsame Familienereignisse'));
  }
  // Gemeinsame Nennung in Erinnerungstexten (Namens-Erwähnung).
  const others = kb.data.persons.filter((p) => p.id !== personId);
  for (const m of kb.data.memories) {
    const text = fold(`${m.title} ${m.description ?? ''}`);
    const mentionsTarget = m.person_id === personId || text.includes(fold(target.first_name));
    if (!mentionsTarget) continue;
    for (const o of others) {
      if (m.person_id === o.id || text.includes(fold(o.first_name))) bump(o.id, 'gemeinsame Erinnerungen');
    }
  }

  return [...counts.entries()]
    .map(([id, e]) => ({ person: kb.personById.get(id)!, count: e.count, reason: [...e.reasons].join(' · ') }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

/** Zeitleiste einer einzelnen Person. */
export function personTimeline(kb: KnowledgeBase, personId: string): TimelineEntry[] {
  return buildTimeline(kb).filter((e) => e.source.personId === personId);
}

export interface OnThisDayItem {
  yearsAgo: number;
  date: string;
  label: string;
  source: HistorianSource;
}

/** „Heute in der Familiengeschichte" – gleicher Tag/Monat in früheren Jahren. */
export function onThisDay(kb: KnowledgeBase, ref: Date = new Date()): OnThisDayItem[] {
  const mm = ref.getMonth();
  const dd = ref.getDate();
  const items: OnThisDayItem[] = [];
  const add = (date: string | null, label: string, source: HistorianSource) => {
    if (!date) return;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return;
    if (d.getMonth() !== mm || d.getDate() !== dd) return;
    const yearsAgo = ref.getFullYear() - d.getFullYear();
    if (yearsAgo <= 0) return;
    items.push({ yearsAgo, date, label, source });
  };

  for (const p of kb.data.persons) {
    const name = fullName(p.first_name, p.last_name);
    add(p.birth_date, `Geburtstag von ${name}`, { kind: 'person', label: `Profil von ${name}`, entityId: p.id, personId: p.id, date: p.birth_date });
  }
  for (const m of kb.data.memories) {
    add(m.occurred_on, m.title, { kind: 'memory', label: `Erinnerung „${m.title}"`, entityId: m.id, personId: m.person_id, date: m.occurred_on });
  }
  for (const ev of kb.data.calendarEvents) {
    add(ev.event_date, ev.title, { kind: 'person', label: ev.title, entityId: ev.id, date: ev.event_date });
  }
  return items.sort((a, b) => a.yearsAgo - b.yearsAgo);
}

/** Themen, die mit einer bestimmten Person verbunden sind. */
export function personTopics(kb: KnowledgeBase, personId: string): TopicGroup[] {
  const docs = kb.docs.filter((d) => d.personId === personId && d.kind !== 'person');
  const groups = TOPIC_KEYWORDS.map((t) => ({ ...t, count: 0, sources: [] as HistorianSource[] }));
  for (const doc of docs) {
    const folded = fold(doc.text);
    for (const g of groups) {
      if (g.words.some((w) => folded.includes(fold(w)))) {
        g.count += 1;
        if (g.sources.length < 6) g.sources.push(doc.source);
      }
    }
  }
  return groups.filter((g) => g.count > 0).map(({ topic, label, count, sources }) => ({ topic, label, count, sources })).sort((a, b) => b.count - a.count);
}

export interface MemoryJourney {
  query: string;
  total: number;
  photos: KnowledgeDoc[];
  audios: KnowledgeDoc[];
  stories: KnowledgeDoc[]; // Erinnerungen + Zeitkapseln
  sources: HistorianSource[];
}

/** „Erinnerungsreise" zu einem Thema – gruppierte, quellengebundene Inhalte. */
export function memoryJourney(kb: KnowledgeBase, query: string): MemoryJourney {
  const docs = retrieve(kb, query, 40).map((r) => r.doc);
  const photos = docs.filter((d) => d.kind === 'photo');
  const audios = docs.filter((d) => d.kind === 'audio');
  const stories = docs.filter((d) => d.kind === 'memory' || d.kind === 'time_capsule');
  return { query, total: docs.length, photos, audios, stories, sources: docs.map((d) => d.source) };
}

export function detectGaps(kb: KnowledgeBase): KnowledgeGap[] {
  const gaps: KnowledgeGap[] = [];
  for (const person of kb.data.persons) {
    const name = fullName(person.first_name, person.last_name);
    const memories = kb.data.memories.filter((m) => m.person_id === person.id);
    const photos = kb.data.photos.filter((p) => p.person_id === person.id);
    const audios = kb.data.audios.filter((a) => a.person_id === person.id);

    if (audios.length === 0) {
      gaps.push({
        personId: person.id,
        personName: name,
        message: `Von ${name} existieren keine Sprachaufnahmen.`,
        suggestion: 'audio',
      });
    }
    if (photos.length <= 2) {
      gaps.push({
        personId: person.id,
        personName: name,
        message:
          photos.length === 0
            ? `Zu ${name} gibt es noch keine Fotos.`
            : `Zu ${name} gibt es nur ${photos.length} Foto${photos.length > 1 ? 's' : ''}.`,
        suggestion: 'photo',
      });
    }
    if (memories.length === 0) {
      gaps.push({
        personId: person.id,
        personName: name,
        message: `Zu ${name} wurden noch keine Erinnerungen gespeichert.`,
        suggestion: 'memory',
      });
    }
  }
  return gaps;
}
