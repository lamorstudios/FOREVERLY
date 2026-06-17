import { listPersons, listRelationships } from './persons';
import { listMemories } from './memories';
import { listPhotos, listAudios } from './media';
import { listMyCapsules } from './timeCapsules';
import { listCalendarEvents } from './calendar';
import { listFilmProjects } from './film';
import { listArtifacts } from './museum';
import { buildKnowledgeBase, search as searchKb, type FamilyData } from '@/historian/engine';
import type { Memory } from '@/types/models';

export type GlobalResultKind = 'person' | 'memory' | 'photo' | 'audio' | 'time_capsule' | 'film' | 'artifact';

export interface GlobalResult {
  id: string;
  kind: GlobalResultKind;
  title: string;
  subtitle: string;
  personId?: string | null;
}

function filterMemories(memories: Memory[], userId?: string): Memory[] {
  return memories.filter((m) => m.visibility !== 'private' || m.author_id === userId);
}

function fold(s: string): string {
  return s.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');
}

/** Globale Suche über alle (berechtigten) Familieninhalte. */
export async function globalSearch(familyId: string, query: string, userId?: string): Promise<GlobalResult[]> {
  const q = query.trim();
  if (!q) return [];
  const [persons, relationships, memories, photos, audios, capsules, calendarEvents, films, artifacts] = await Promise.all([
    listPersons(familyId),
    listRelationships(familyId),
    listMemories(familyId),
    listPhotos(familyId),
    listAudios(familyId),
    listMyCapsules(familyId),
    listCalendarEvents(familyId),
    listFilmProjects(familyId),
    listArtifacts(familyId),
  ]);

  const fd: FamilyData = { persons, memories: filterMemories(memories, userId), photos, audios, capsules, calendarEvents, relationships };
  const kb = buildKnowledgeBase(fd);
  const docHits = searchKb(kb, q).slice(0, 25);

  const results: GlobalResult[] = docHits.map((d) => ({
    id: d.id,
    kind: d.kind,
    title: d.title || 'Eintrag',
    subtitle: d.source.label,
    personId: d.personId,
  }));

  // Zusätzlich: Familienfilme & Artefakte (nicht Teil der KB).
  const fq = fold(q);
  for (const f of films) {
    if (fold(`${f.title} ${f.subtitle ?? ''}`).includes(fq)) {
      results.push({ id: f.id, kind: 'film', title: f.title, subtitle: 'Familienfilm' });
    }
  }
  for (const a of artifacts) {
    if (fold(`${a.title} ${a.description ?? ''} ${a.story ?? ''}`).includes(fq)) {
      results.push({ id: a.id, kind: 'artifact', title: a.title, subtitle: 'Familienartefakt' });
    }
  }

  return results;
}
