import { listPersons } from './persons';
import { listMemories } from './memories';
import { listPhotos, listAudios } from './media';
import { listMyCapsules } from './timeCapsules';
import { listCalendarEvents } from './calendar';
import {
  buildKnowledgeBase,
  answerQuestion,
  search,
  extractWisdoms,
  buildTimeline,
  importantPeople,
  personInsight,
  detectGaps,
  type FamilyData,
  type KnowledgeBase,
} from '@/historian/engine';

/**
 * Sammelt alle Familieninhalte und baut die Wissensbasis auf.
 * Nutzt ausschließlich die vorhandenen Familien-APIs (keine externen Daten).
 */
async function gather(familyId: string): Promise<KnowledgeBase> {
  const [persons, memories, photos, audios, capsules, calendarEvents] =
    await Promise.all([
      listPersons(familyId),
      listMemories(familyId),
      listPhotos(familyId),
      listAudios(familyId),
      listMyCapsules(familyId),
      listCalendarEvents(familyId),
    ]);

  const data: FamilyData = {
    persons,
    memories,
    photos,
    audios,
    capsules,
    calendarEvents,
  };
  return buildKnowledgeBase(data);
}

export async function askHistorian(familyId: string, query: string) {
  const kb = await gather(familyId);
  return answerQuestion(kb, query);
}

export async function searchHistorian(familyId: string, query: string) {
  const kb = await gather(familyId);
  return search(kb, query);
}

export async function getWisdoms(familyId: string) {
  const kb = await gather(familyId);
  return extractWisdoms(kb);
}

export async function getTimeline(familyId: string) {
  const kb = await gather(familyId);
  return buildTimeline(kb);
}

export async function getImportantPeople(familyId: string) {
  const kb = await gather(familyId);
  return importantPeople(kb);
}

export async function getPersonInsight(familyId: string, personId: string) {
  const kb = await gather(familyId);
  return personInsight(kb, personId);
}

export async function getKnowledgeGaps(familyId: string) {
  const kb = await gather(familyId);
  return detectGaps(kb);
}
