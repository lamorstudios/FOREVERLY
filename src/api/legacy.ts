import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import { listPersons, listRelationships } from './persons';
import { listMemories } from './memories';
import { listPhotos, listAudios } from './media';
import { listMyCapsules } from './timeCapsules';
import { listCalendarEvents } from './calendar';
import {
  buildKnowledgeBase,
  buildBiography,
  personTimeline,
  personTopics,
  extractWisdoms,
  memoryJourney,
  type FamilyData,
  type KnowledgeBase,
} from '@/historian/engine';
import type { Audio, LifeStory, LifeStoryKind, Memory, Person } from '@/types/models';

function filterMemories(memories: Memory[], userId?: string): Memory[] {
  return memories.filter((m) => m.visibility !== 'private' || m.author_id === userId);
}

async function gather(familyId: string, userId?: string): Promise<{ kb: KnowledgeBase; audios: Audio[]; persons: Person[] }> {
  const [persons, relationships, memories, photos, audios, capsules, calendarEvents] = await Promise.all([
    listPersons(familyId),
    listRelationships(familyId),
    listMemories(familyId),
    listPhotos(familyId),
    listAudios(familyId),
    listMyCapsules(familyId),
    listCalendarEvents(familyId),
  ]);
  const data: FamilyData = { persons, memories: filterMemories(memories, userId), photos, audios, capsules, calendarEvents, relationships };
  return { kb: buildKnowledgeBase(data), audios, persons };
}

export interface PersonStory {
  person: Person;
  biography: string;
  timeline: ReturnType<typeof personTimeline>;
  topics: ReturnType<typeof personTopics>;
  wisdoms: ReturnType<typeof extractWisdoms>;
  audios: Audio[];
  counts: { memories: number; photos: number; audios: number };
}

export async function getPersonStory(familyId: string, personId: string, userId?: string): Promise<PersonStory | null> {
  const { kb, audios } = await gather(familyId, userId);
  const person = kb.personById.get(personId);
  if (!person) return null;
  return {
    person,
    biography: buildBiography(kb, person),
    timeline: personTimeline(kb, personId),
    topics: personTopics(kb, personId),
    wisdoms: extractWisdoms(kb).filter((w) => w.source.personId === personId),
    audios: audios.filter((a) => a.person_id === personId),
    counts: {
      memories: kb.data.memories.filter((m) => m.person_id === personId).length,
      photos: kb.data.photos.filter((p) => p.person_id === personId).length,
      audios: audios.filter((a) => a.person_id === personId).length,
    },
  };
}

export async function getMemoryJourney(familyId: string, query: string, userId?: string) {
  const { kb } = await gather(familyId, userId);
  return memoryJourney(kb, query);
}

export async function listLegends(familyId: string): Promise<Person[]> {
  const persons = await listPersons(familyId);
  return persons.filter((p) => p.is_legend);
}

export async function setLegend(personId: string, value: boolean): Promise<void> {
  if (DEMO_MODE) return demoStore.setPersonLegend(personId, value);
  const { error } = await supabase.from('persons').update({ is_legend: value }).eq('id', personId);
  if (error) throw error;
}

// --- Lebensinterviews / Zukunftsfragen ---

export async function listLifeStories(personId: string): Promise<LifeStory[]> {
  if (DEMO_MODE) return demoStore.listLifeStories(personId);
  const { data, error } = await supabase.from('life_stories').select('*').eq('person_id', personId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LifeStory[];
}

export interface LifeStoryInput {
  familyId: string;
  personId: string;
  question: string;
  kind: LifeStoryKind;
  content?: string | null;
  mediaUri?: string | null;
  isFutureQuestion?: boolean;
}

export async function addLifeStory(input: LifeStoryInput): Promise<LifeStory> {
  if (DEMO_MODE) return demoStore.addLifeStory(input);
  const { data, error } = await supabase
    .from('life_stories')
    .insert({
      family_id: input.familyId,
      person_id: input.personId,
      question: input.question,
      kind: input.kind,
      content: input.content ?? null,
      media_path: input.mediaUri ?? null,
      is_future_question: input.isFutureQuestion ?? false,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as LifeStory;
}
