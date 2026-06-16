/**
 * Legacy Moments & Family Memories.
 *
 * Aggregiert vorhandene Familieninhalte zu emotionalen, wertschätzenden
 * Bausteinen: Erinnerung des Tages, Familienschatz-Karten (was droht verloren
 * zu gehen), „Frag …, solange du noch kannst", Legacy Score je Person, der
 * automatische Jahresrückblick sowie gesammelte Familienweisheiten.
 *
 * Es wird NICHTS erfunden – alles basiert auf real vorhandenen Inhalten.
 */

import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import { listPersons } from './persons';
import { listMemories } from './memories';
import { listPhotos, listAudios } from './media';
import { listMyCapsules } from './timeCapsules';
import { listEvents } from './familyEvents';
import { listMoments } from './moments';
import { fullName } from '@/lib/format';
import type {
  Person, Memory, Photo, Audio, TimeCapsule, FamilyEvent, Moment, LifeStory, FamilyWisdom,
} from '@/types/models';

function visible(memories: Memory[], userId?: string): Memory[] {
  return memories.filter((m) => m.visibility !== 'private' || m.author_id === userId);
}

interface Bundle {
  persons: Person[];
  memories: Memory[];
  photos: Photo[];
  audios: Audio[];
  capsules: TimeCapsule[];
  events: FamilyEvent[];
  moments: Moment[];
  lifeStories: LifeStory[];
}

async function gatherAll(familyId: string, userId?: string): Promise<Bundle> {
  const [persons, memories, photos, audios, capsules, events, moments] = await Promise.all([
    listPersons(familyId),
    listMemories(familyId),
    listPhotos(familyId),
    listAudios(familyId),
    listMyCapsules(familyId),
    listEvents(familyId),
    listMoments(familyId),
  ]);
  const lifeStories = DEMO_MODE ? demoStore.listFamilyLifeStories(familyId) : [];
  return { persons, memories: visible(memories, userId), photos, audios, capsules, events, moments, lifeStories };
}

// --- 9 · Erinnerung des Tages -----------------------------------------------

export type MediaKind = 'photo' | 'audio' | 'video' | 'memory' | 'event';

export interface DailyMemory {
  kind: MediaKind;
  title: string;
  subtitle: string;
  mediaPath: string | null;
  bucket: 'photos' | null;
  personName: string | null;
}

/** Tagesgenau (deterministisch) hervorgehobene Erinnerung. */
export async function getMemoryOfTheDay(familyId: string, userId?: string): Promise<DailyMemory | null> {
  const b = await gatherAll(familyId, userId);
  const nameOf = (id: string | null) => {
    const p = id ? b.persons.find((x) => x.id === id) : null;
    return p ? fullName(p.first_name, p.last_name) : null;
  };
  const pool: DailyMemory[] = [
    ...b.photos.map<DailyMemory>((p) => ({
      kind: 'photo', title: p.caption ?? 'Ein besonderer Moment', subtitle: 'Foto-Erinnerung',
      mediaPath: p.storage_path, bucket: 'photos', personName: nameOf(p.person_id),
    })),
    ...b.memories.map<DailyMemory>((m) => ({
      kind: 'memory', title: m.title, subtitle: m.description ?? 'Erinnerung',
      mediaPath: null, bucket: null, personName: nameOf(m.person_id),
    })),
    ...b.audios.map<DailyMemory>((a) => ({
      kind: 'audio', title: a.title ?? 'Sprachaufnahme', subtitle: a.transcript ? `„${a.transcript}"` : 'Originalstimme',
      mediaPath: null, bucket: null, personName: nameOf(a.person_id),
    })),
  ];
  if (pool.length === 0) return null;
  // Deterministisch über den Tag des Jahres wählen.
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return pool[dayOfYear % pool.length]!;
}

// --- 6 · Legacy Score -------------------------------------------------------

export interface LegacyScore {
  person: Person;
  memories: number;
  audios: number;
  photos: number;
  interviews: number;
  total: number;
  /** Orientierender Hinweis – kein Wettbewerb. */
  hint: string;
}

function scoreFor(b: Bundle, p: Person): LegacyScore {
  const memories = b.memories.filter((m) => m.person_id === p.id).length;
  const audios = b.audios.filter((a) => a.person_id === p.id).length;
  const photos = b.photos.filter((x) => x.person_id === p.id).length;
  const interviews = b.lifeStories.filter((s) => s.person_id === p.id).length;
  const total = memories + audios + photos + interviews;
  const hint = total < 6
    ? 'Es gibt noch viele Geschichten zu bewahren.'
    : 'Schon viel bewahrt – jede weitere Geschichte zählt.';
  return { person: p, memories, audios, photos, interviews, total, hint };
}

export async function getLegacyScores(familyId: string, userId?: string): Promise<LegacyScore[]> {
  const b = await gatherAll(familyId, userId);
  return b.persons.map((p) => scoreFor(b, p)).sort((a, z) => a.total - z.total);
}

// --- 3 · „Frag …, solange du noch kannst" -----------------------------------

export interface ElderPrompt {
  score: LegacyScore;
  title: string;
  message: string;
}

/** Ältestes lebendes Familienmitglied mit den wenigsten bewahrten Inhalten. */
export async function getElderToAsk(familyId: string, userId?: string): Promise<ElderPrompt | null> {
  const b = await gatherAll(familyId, userId);
  const elders = b.persons
    .filter((p) => !p.death_date && p.birth_date)
    .sort((a, z) => (a.birth_date! < z.birth_date! ? -1 : 1)); // ältester zuerst
  if (elders.length === 0) return null;

  // Unter den ältesten denjenigen mit der geringsten „Score" wählen.
  const candidates = elders.slice(0, 3).map((p) => scoreFor(b, p)).sort((a, z) => a.total - z.total);
  const score = candidates[0]!;
  const name = fullName(score.person.first_name, score.person.last_name);
  const message = score.interviews === 0
    ? `${name} hat noch keine Erinnerungen aus der Kindheit hinterlassen.`
    : `Von ${name} sind erst wenige Geschichten festgehalten – jetzt ist die beste Zeit, mehr zu bewahren.`;
  return { score, title: 'Bewahre Geschichten für kommende Generationen.', message };
}

// --- 7 · Familienschatz-Karten ----------------------------------------------

export type TreasureAction = 'interview' | 'memory' | 'audio';

export interface TreasurePrompt {
  id: string;
  icon: string;
  title: string;
  message: string;
  action: TreasureAction;
  personId: string | null;
}

const TRIP_WORDS = ['reise', 'urlaub', 'ferien', 'strand', 'ausflug'];

/** Vorschläge, welche Erinnerungen drohen verloren zu gehen. */
export async function getTreasurePrompts(familyId: string, userId?: string): Promise<TreasurePrompt[]> {
  const b = await gatherAll(familyId, userId);
  const prompts: TreasurePrompt[] = [];

  // a) Lebende Person ohne Sprachaufnahme & ohne Interview.
  for (const p of b.persons) {
    if (p.death_date) continue;
    const hasAudio = b.audios.some((a) => a.person_id === p.id);
    const hasInterview = b.lifeStories.some((s) => s.person_id === p.id);
    if (!hasAudio && !hasInterview) {
      const name = fullName(p.first_name, p.last_name);
      prompts.push({
        id: `voice-${p.id}`,
        icon: 'mic-outline',
        title: `Es gibt noch keine Aufnahme von ${p.first_name}s Kindheit.`,
        message: `Halte ${name}s Stimme und Geschichten fest, solange ihr zusammen seid.`,
        action: 'interview',
        personId: p.id,
      });
    }
    if (prompts.length >= 2) break;
  }

  // b) Erste Familienreise noch nicht festgehalten?
  const hasTrip = [...b.memories, ...b.events].some((x) => {
    const t = `${x.title} ${'description' in x ? x.description ?? '' : ''}`.toLowerCase();
    return TRIP_WORDS.some((w) => t.includes(w));
  });
  if (!hasTrip) {
    prompts.push({
      id: 'first-trip',
      icon: 'airplane-outline',
      title: 'Die Geschichte eurer ersten Familienreise wurde noch nicht festgehalten.',
      message: 'Erzählt, wohin es ging und was ihr erlebt habt – bevor die Details verblassen.',
      action: 'memory',
      personId: null,
    });
  }

  // c) Fragile Erinnerung: nur ein einziger Eintrag zu einer Person.
  const fragile = b.persons.find((p) => !p.death_date && b.memories.filter((m) => m.person_id === p.id).length === 1);
  if (fragile && prompts.length < 3) {
    prompts.push({
      id: `fragile-${fragile.id}`,
      icon: 'sparkles-outline',
      title: 'Diese Erinnerung könnte verloren gehen.',
      message: `Zu ${fragile.first_name} gibt es bisher nur eine einzige Erinnerung. Ergänzt sie gemeinsam.`,
      action: 'memory',
      personId: fragile.id,
    });
  }

  return prompts.slice(0, 3);
}

// --- 2 · Jahresrückblick „Euer Familienjahr" --------------------------------

export interface FamilyYearReview {
  year: number;
  newMembers: number;
  photos: number;
  videos: number;
  audios: number;
  memories: number;
  events: number;
  openedCapsules: number;
  highlights: { title: string; subtitle: string }[];
}

const yearOf = (iso: string | null) => (iso ? new Date(iso).getFullYear() : null);

/** Automatisch generierter Rückblick auf ein Familienjahr. */
export async function getFamilyYear(familyId: string, year: number, userId?: string): Promise<FamilyYearReview> {
  const b = await gatherAll(familyId, userId);
  const inYear = (iso: string | null) => yearOf(iso) === year;

  const photos = b.photos.filter((p) => inYear(p.created_at)).length;
  const audios = b.audios.filter((a) => inYear(a.created_at)).length;
  const videos = b.moments.filter((m) => m.kind === 'video' && inYear(m.created_at)).length;
  const memories = b.memories.filter((m) => inYear(m.occurred_on) || inYear(m.created_at)).length;
  const events = b.events.filter((e) => inYear(e.event_date)).length;
  const openedCapsules = b.capsules.filter((c) => c.is_opened && inYear(c.open_at)).length;
  const newMembers = b.persons.filter((p) => inYear(p.created_at)).length;

  const highlights = b.memories
    .filter((m) => inYear(m.occurred_on) || inYear(m.created_at))
    .slice(0, 4)
    .map((m) => ({ title: m.title, subtitle: m.description ?? 'Erinnerung' }));

  return { year, newMembers, photos, videos, audios, memories, events, openedCapsules, highlights };
}

// --- 8 · Familienweisheiten -------------------------------------------------

export async function listFamilyWisdoms(familyId: string): Promise<FamilyWisdom[]> {
  if (DEMO_MODE) return demoStore.listFamilyWisdoms(familyId);
  const { data, error } = await supabase
    .from('family_wisdoms').select('*').eq('family_id', familyId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FamilyWisdom[];
}

export async function addFamilyWisdom(input: { familyId: string; text: string; authorPersonId?: string | null }): Promise<FamilyWisdom> {
  if (DEMO_MODE) return demoStore.addFamilyWisdom(input);
  const { data, error } = await supabase
    .from('family_wisdoms')
    .insert({ family_id: input.familyId, text: input.text, author_person_id: input.authorPersonId ?? null })
    .select('*').single();
  if (error) throw error;
  return data as FamilyWisdom;
}
