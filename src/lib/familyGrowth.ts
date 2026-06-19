/**
 * Familienwachstum: leitet aus dem Beziehungsgraph einfache Kennzahlen ab,
 * v. a. die Anzahl der Generationen (längste Eltern→Kind-Kette).
 *
 * Konvention: relationship(from, to, type) bedeutet „to ist <type> von from".
 */
import type { Person, Relationship } from '@/types/models';

export interface FamilyGrowthStats {
  members: number;
  generations: number;
  memories: number;
  capsules: number;
}

const CHILD_TYPES = new Set(['tochter', 'sohn', 'stiefkind', 'adoptivkind', 'pflegekind']);
const PARENT_TYPES = new Set(['vater', 'mutter', 'stiefvater', 'stiefmutter']);
const GRANDPARENT_TYPES = new Set(['oma', 'opa']);

/** Längste Eltern→Kind-Kette (= Anzahl Generationen). */
export function computeGenerations(persons: Person[], relationships: Relationship[]): number {
  if (persons.length === 0) return 0;

  // Gerichtete Kanten Eltern -> Kind aufbauen.
  const children = new Map<string, Set<string>>();
  const addEdge = (parent: string, child: string) => {
    if (parent === child) return;
    if (!children.has(parent)) children.set(parent, new Set());
    children.get(parent)!.add(child);
  };

  for (const r of relationships) {
    if (CHILD_TYPES.has(r.type)) addEdge(r.from_person_id, r.to_person_id); // to ist Kind von from
    else if (PARENT_TYPES.has(r.type)) addEdge(r.to_person_id, r.from_person_id); // to ist Elternteil von from
    else if (GRANDPARENT_TYPES.has(r.type)) addEdge(r.to_person_id, r.from_person_id); // Großeltern: 2 Ebenen (vereinfachend 1 Kante)
  }

  // Längster Pfad (Knotenzahl) per memoisierter DFS, zyklensicher.
  const depthCache = new Map<string, number>();
  const visiting = new Set<string>();
  function depth(node: string): number {
    if (depthCache.has(node)) return depthCache.get(node)!;
    if (visiting.has(node)) return 1; // Zyklus → abbrechen
    visiting.add(node);
    let best = 1;
    for (const c of children.get(node) ?? []) {
      best = Math.max(best, 1 + depth(c));
    }
    visiting.delete(node);
    depthCache.set(node, best);
    return best;
  }

  let max = 1;
  for (const p of persons) max = Math.max(max, depth(p.id));
  return max;
}

export function computeFamilyGrowth(input: {
  persons: Person[];
  relationships: Relationship[];
  memories: number;
  capsules: number;
}): FamilyGrowthStats {
  return {
    members: input.persons.length,
    generations: computeGenerations(input.persons, input.relationships),
    memories: input.memories,
    capsules: input.capsules,
  };
}
