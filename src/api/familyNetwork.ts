/**
 * Family Network Engine – aggregierte Wachstumskennzahlen der Familie.
 * Nutzt den Beziehungsgraphen (für Generationen) plus die vorhandenen Inhalte.
 */
import { listPersons, listRelationships } from './persons';
import { listMemories } from './memories';
import { listMyCapsules } from './timeCapsules';
import { computeFamilyGrowth, type FamilyGrowthStats } from '@/lib/familyGrowth';
import type { Memory } from '@/types/models';

function visible(memories: Memory[], userId?: string): Memory[] {
  return memories.filter((m) => m.visibility !== 'private' || m.author_id === userId);
}

export async function getFamilyGrowth(familyId: string, userId?: string): Promise<FamilyGrowthStats> {
  const [persons, relationships, memories, capsules] = await Promise.all([
    listPersons(familyId),
    listRelationships(familyId),
    listMemories(familyId),
    listMyCapsules(familyId),
  ]);
  return computeFamilyGrowth({
    persons,
    relationships,
    memories: visible(memories, userId).length,
    capsules: capsules.length,
  });
}
