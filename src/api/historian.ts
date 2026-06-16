import { listPersons, listRelationships } from './persons';
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
  familyKnowledge,
  detectTopics,
  personConnections,
  personTimeline,
  onThisDay,
  type FamilyData,
  type KnowledgeBase,
} from '@/historian/engine';
import type { Memory } from '@/types/models';

/**
 * Berechtigungsfilter: Der Historiker darf nur Inhalte sehen, für die der
 * Nutzer berechtigt ist. Private Erinnerungen anderer Personen werden
 * ausgeblendet (keine Umgehung von Freigaben). Zeitkapseln werden ohnehin nur
 * berücksichtigt, wenn sie geöffnet/freigegeben sind (siehe Engine).
 */
function filterMemories(memories: Memory[], userId?: string): Memory[] {
  return memories.filter((m) => m.visibility !== 'private' || m.author_id === userId);
}

/**
 * Sammelt alle (berechtigten) Familieninhalte und baut die Wissensbasis auf.
 * Nutzt ausschließlich vorhandene Familien-APIs (keine externen Daten).
 */
async function gather(familyId: string, userId?: string): Promise<KnowledgeBase> {
  const [persons, relationships, memories, photos, audios, capsules, calendarEvents] =
    await Promise.all([
      listPersons(familyId),
      listRelationships(familyId),
      listMemories(familyId),
      listPhotos(familyId),
      listAudios(familyId),
      listMyCapsules(familyId),
      listCalendarEvents(familyId),
    ]);

  const data: FamilyData = {
    persons,
    memories: filterMemories(memories, userId),
    photos,
    audios,
    capsules,
    calendarEvents,
    relationships,
  };
  return buildKnowledgeBase(data);
}

export async function askHistorian(familyId: string, query: string, userId?: string) {
  return answerQuestion(await gather(familyId, userId), query);
}

export async function searchHistorian(familyId: string, query: string, userId?: string) {
  return search(await gather(familyId, userId), query);
}

export async function getWisdoms(familyId: string, userId?: string) {
  return extractWisdoms(await gather(familyId, userId));
}

export async function getTimeline(familyId: string, userId?: string) {
  return buildTimeline(await gather(familyId, userId));
}

export async function getImportantPeople(familyId: string, userId?: string) {
  return importantPeople(await gather(familyId, userId));
}

export async function getPersonInsight(familyId: string, personId: string, userId?: string) {
  return personInsight(await gather(familyId, userId), personId);
}

export async function getKnowledgeGaps(familyId: string, userId?: string) {
  return detectGaps(await gather(familyId, userId));
}

// --------------------------- Phase 8 · neue Funktionen ---------------------------

export async function getFamilyKnowledge(familyId: string, userId?: string) {
  return familyKnowledge(await gather(familyId, userId));
}

export async function getTopics(familyId: string, userId?: string) {
  return detectTopics(await gather(familyId, userId));
}

export async function getPersonConnections(familyId: string, personId: string, userId?: string) {
  return personConnections(await gather(familyId, userId), personId);
}

export async function getPersonTimeline(familyId: string, personId: string, userId?: string) {
  return personTimeline(await gather(familyId, userId), personId);
}

export async function getOnThisDay(familyId: string, userId?: string) {
  return onThisDay(await gather(familyId, userId));
}
