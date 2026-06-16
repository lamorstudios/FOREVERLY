import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import { listPersons } from './persons';
import { listMemories } from './memories';
import { listPhotos, listAudios } from './media';
import { listEvents } from './familyEvents';
import { listMoments } from './moments';
import { listLegacyItems, listFarewellMessages } from './vault';
import { generateFilm, autoFilmSuggestions, type FilmData } from '@/film/generator';
import type {
  FilmProject,
  FilmKind,
  FilmMusicMood,
  FilmLock,
  FilmOptions,
  GeneratedFilm,
  Memory,
  VisibilityLevel,
} from '@/types/models';

function filterMemories(memories: Memory[], userId?: string): Memory[] {
  // Datenschutz: private Erinnerungen anderer werden nicht verfilmt.
  return memories.filter((m) => m.visibility !== 'private' || m.author_id === userId);
}

/** Sammelt alle (berechtigten) Inhalte für die Filmerstellung. */
async function gatherFilmData(familyId: string, ownerUserId: string, userId?: string): Promise<FilmData> {
  const [persons, memories, photos, audios, events, moments, legacyItems, farewellMessages] =
    await Promise.all([
      listPersons(familyId),
      listMemories(familyId),
      listPhotos(familyId),
      listAudios(familyId),
      listEvents(familyId),
      listMoments(familyId),
      listLegacyItems(ownerUserId),
      listFarewellMessages(ownerUserId),
    ]);
  return { persons, memories: filterMemories(memories, userId), photos, audios, events, moments, legacyItems, farewellMessages };
}

export function openAtForLock(lock: FilmLock): string | null {
  const now = new Date();
  if (lock === 'years5') now.setFullYear(now.getFullYear() + 5);
  else if (lock === 'years10') now.setFullYear(now.getFullYear() + 10);
  else if (lock === 'years20') now.setFullYear(now.getFullYear() + 20);
  else return null; // none / death
  return now.toISOString();
}

// ------------------------------ Projekte ------------------------------

export async function listFilmProjects(familyId: string): Promise<FilmProject[]> {
  if (DEMO_MODE) return demoStore.listFilmProjects(familyId);
  const { data, error } = await supabase.from('film_projects').select('*').eq('family_id', familyId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FilmProject[];
}

export async function getFilmProject(id: string): Promise<FilmProject | null> {
  if (DEMO_MODE) return demoStore.getFilmProject(id);
  const { data, error } = await supabase.from('film_projects').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as FilmProject) ?? null;
}

export interface FilmProjectInput {
  familyId: string;
  ownerUserId: string;
  kind: FilmKind;
  title: string;
  subtitle?: string | null;
  music?: FilmMusicMood;
  lock?: FilmLock;
  visibility?: VisibilityLevel;
  options: FilmOptions;
  auto?: boolean;
}

export async function createFilmProject(input: FilmProjectInput): Promise<FilmProject> {
  if (DEMO_MODE) return demoStore.createFilmProject(input);
  const { data, error } = await supabase
    .from('film_projects')
    .insert({
      family_id: input.familyId,
      owner_user_id: input.ownerUserId,
      kind: input.kind,
      title: input.title,
      subtitle: input.subtitle ?? null,
      music: input.music ?? 'emotional',
      lock: input.lock ?? 'none',
      open_at: openAtForLock(input.lock ?? 'none'),
      visibility: input.visibility ?? 'family',
      options: input.options,
      hidden_chapters: [],
      auto: input.auto ?? false,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as FilmProject;
}

export async function updateFilmProject(id: string, patch: Partial<FilmProject>): Promise<FilmProject> {
  if (DEMO_MODE) return demoStore.updateFilmProject(id, patch);
  const { data, error } = await supabase.from('film_projects').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as FilmProject;
}

export async function deleteFilmProject(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteFilmProject(id);
  const { error } = await supabase.from('film_projects').delete().eq('id', id);
  if (error) throw error;
}

// ------------------------------ Generierung ------------------------------

export async function generateFilmForProject(project: FilmProject, userId?: string): Promise<GeneratedFilm> {
  const data = await gatherFilmData(project.family_id, project.owner_user_id, userId);
  return generateFilm(data, project);
}

export async function getAutoFilmSuggestions(familyId: string, ownerUserId: string, userId?: string) {
  const data = await gatherFilmData(familyId, ownerUserId, userId);
  return autoFilmSuggestions(data);
}
