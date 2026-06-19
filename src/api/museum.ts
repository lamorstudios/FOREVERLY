import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import { listPersons, listRelationships } from './persons';
import { listMemories } from './memories';
import { listPhotos, listAudios } from './media';
import { listMyCapsules } from './timeCapsules';
import { listEvents } from './familyEvents';
import { listFilmProjects } from './film';
import { listCalendarEvents } from './calendar';
import {
  generations,
  timeTravel,
  contentYears,
  placesByPerson,
  exhibitions,
  museumStats,
  jubilees,
  type MuseumData,
} from '@/museum/engine';
import type { Artifact, ArtifactCategory, Memory } from '@/types/models';

function filterMemories(memories: Memory[], userId?: string): Memory[] {
  return memories.filter((m) => m.visibility !== 'private' || m.author_id === userId);
}

async function gather(familyId: string, userId?: string): Promise<MuseumData> {
  const [persons, relationships, memories, photos, audios, capsules, events, films, calendarEvents, artifacts] =
    await Promise.all([
      listPersons(familyId),
      listRelationships(familyId),
      listMemories(familyId),
      listPhotos(familyId),
      listAudios(familyId),
      listMyCapsules(familyId),
      listEvents(familyId),
      listFilmProjects(familyId),
      listCalendarEvents(familyId),
      listArtifacts(familyId),
    ]);
  return { persons, relationships, memories: filterMemories(memories, userId), photos, audios, capsules, events, films, calendarEvents, artifacts };
}

export interface MuseumOverview {
  stats: ReturnType<typeof museumStats>;
  exhibitions: ReturnType<typeof exhibitions>;
  jubilees: string[];
}

export async function getMuseumOverview(familyId: string, userId?: string): Promise<MuseumOverview> {
  const d = await gather(familyId, userId);
  return { stats: museumStats(d), exhibitions: exhibitions(d), jubilees: jubilees(d) };
}

export async function getGenerations(familyId: string, userId?: string) {
  return generations(await gather(familyId, userId));
}

export async function getTimeTravel(familyId: string, year: number, userId?: string) {
  const d = await gather(familyId, userId);
  return { result: timeTravel(d, year), years: contentYears(d) };
}

export async function getPlaces(familyId: string, userId?: string) {
  return placesByPerson(await gather(familyId, userId));
}

// --- Artefakte --------------------------------------------------------------

export async function listArtifacts(familyId: string): Promise<Artifact[]> {
  if (DEMO_MODE) return demoStore.listArtifacts(familyId);
  const { data, error } = await supabase.from('artifacts').select('*').eq('family_id', familyId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Artifact[];
}

export interface ArtifactInput {
  id?: string;
  familyId: string;
  category: ArtifactCategory;
  title: string;
  description?: string | null;
  story?: string | null;
  ownerPersonId?: string | null;
  location?: string | null;
  year?: number | null;
  createdBy: string;
}

export async function saveArtifact(input: ArtifactInput): Promise<Artifact> {
  if (DEMO_MODE) return demoStore.saveArtifact(input);
  const row = {
    family_id: input.familyId,
    category: input.category,
    title: input.title,
    description: input.description ?? null,
    story: input.story ?? null,
    owner_person_id: input.ownerPersonId ?? null,
    location: input.location ?? null,
    year: input.year ?? null,
    created_by: input.createdBy,
  };
  const query = input.id
    ? supabase.from('artifacts').update(row).eq('id', input.id)
    : supabase.from('artifacts').insert(row);
  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return data as Artifact;
}

export async function deleteArtifact(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteArtifact(id);
  const { error } = await supabase.from('artifacts').delete().eq('id', id);
  if (error) throw error;
}
