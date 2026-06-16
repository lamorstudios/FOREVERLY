import { listPersons, listRelationships } from './persons';
import { listMemories } from './memories';
import { listPhotos, listAudios } from './media';
import { listMyCapsules } from './timeCapsules';
import { listCalendarEvents } from './calendar';
import { listEvents } from './familyEvents';
import { listFilmProjects } from './film';
import { listTrustees, getEstateInfo } from './estate';
import { listVaultEntries } from './vault';
import {
  familyStats,
  recommendations,
  structuredAnswer,
  type AssistantData,
  type AssistantStat,
  type AssistantSuggestion,
  type AssistantAnswer,
} from '@/assistant/engine';
import { buildKnowledgeBase, answerQuestion, type FamilyData } from '@/historian/engine';
import type { Memory } from '@/types/models';

function filterMemories(memories: Memory[], userId?: string): Memory[] {
  return memories.filter((m) => m.visibility !== 'private' || m.author_id === userId);
}

async function gather(familyId: string, ownerUserId: string, userId?: string): Promise<AssistantData> {
  const [persons, relationships, memories, photos, audios, capsules, calendarEvents, events, films, trustees, vaultEntries, estate] =
    await Promise.all([
      listPersons(familyId),
      listRelationships(familyId),
      listMemories(familyId),
      listPhotos(familyId),
      listAudios(familyId),
      listMyCapsules(familyId),
      listCalendarEvents(familyId),
      listEvents(familyId),
      listFilmProjects(familyId),
      listTrustees(ownerUserId),
      listVaultEntries(ownerUserId),
      getEstateInfo(ownerUserId),
    ]);
  return {
    persons,
    relationships,
    memories: filterMemories(memories, userId),
    photos,
    audios,
    capsules,
    calendarEvents,
    events,
    films,
    trustees,
    vaultEntries,
    estate,
  };
}

export interface AssistantOverview {
  stats: AssistantStat[];
  suggestions: AssistantSuggestion[];
}

export async function getAssistantOverview(familyId: string, userId: string): Promise<AssistantOverview> {
  const data = await gather(familyId, userId, userId);
  return { stats: familyStats(data), suggestions: recommendations(data) };
}

export async function askAssistant(familyId: string, query: string, userId: string): Promise<AssistantAnswer> {
  const data = await gather(familyId, userId, userId);

  // 1) Strukturierte Intents (Geburtstage, Statistiken, Zeitkapseln, Filme …)
  const structured = structuredAnswer(data, query);
  if (structured) return structured;

  // 2) Fallback: extraktive Antwort des Familienhistorikers (quellengebunden)
  const fd: FamilyData = {
    persons: data.persons,
    memories: data.memories,
    photos: data.photos,
    audios: data.audios,
    capsules: data.capsules,
    calendarEvents: data.calendarEvents,
    relationships: data.relationships,
  };
  const kb = buildKnowledgeBase(fd);
  const res = answerQuestion(kb, query);
  return { found: res.found, answer: res.answer };
}
