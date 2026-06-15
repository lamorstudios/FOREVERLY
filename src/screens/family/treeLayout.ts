import type {
  Person,
  Relationship,
  RelationshipType,
  RelationshipCategory,
} from '@/types/models';
import { relationshipColor } from '@/theme';

/**
 * Layout-Berechnung für die visuelle Stammbaum-/Familiennetzwerk-Ansicht.
 *
 * Semantik einer Beziehung: relationship(from, to, type) bedeutet
 * „`to` ist <type> von `from`". Daraus leiten wir die Generation (Zeile)
 * jeder Person relativ zur eingeloggten Person ab und ordnen die Personen
 * je Zeile so, dass möglichst wenige Verbindungslinien kreuzen.
 */

// --- Maße eines Knotens / Layout-Raster (unskaliert) ---
export const NODE_W = 120;
export const NODE_H = 132;
const H_GAP = 38; // horizontaler Abstand zwischen Geschwistern/Partnern
const V_GAP = 88; // vertikaler Abstand zwischen Generationen
const MARGIN = 110; // großzügiger Rand → „Weltgefühl", Platz zum Pannen

/** Generationsversatz von `to` relativ zu `from` (gen(to) − gen(from)). */
const GENERATION_DELTA: Record<RelationshipType, number> = {
  vater: -1,
  mutter: -1,
  stiefvater: -1,
  stiefmutter: -1,
  oma: -2,
  opa: -2,
  tante: -1,
  onkel: -1,
  sohn: 1,
  tochter: 1,
  stiefkind: 1,
  adoptivkind: 1,
  pflegekind: 1,
  nichte: 1,
  neffe: 1,
  bruder: 0,
  schwester: 0,
  cousin: 0,
  cousine: 0,
  ehepartner: 0,
  lebenspartner: 0,
  sonstige: 0,
};

export interface TreeNode {
  person: Person;
  /** Linke obere Ecke im Layout-Raum (unskaliert). */
  x: number;
  y: number;
  /** Beziehungs-Kategorien dieser Person (für die kleinen Farbpunkte). */
  categories: RelationshipCategory[];
}

export interface TreeEdge {
  id: string;
  color: string;
  /** 'partner' = waagerechte Verbindung (gleiche Zeile), sonst Eltern→Kind. */
  kind: 'partner' | 'parent';
  /** Ankerpunkte im Layout-Raum (unskaliert). */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TreeLayout {
  nodes: TreeNode[];
  edges: TreeEdge[];
  width: number;
  height: number;
}

interface Graph {
  neighbors: Map<string, string[]>;
  delta: Map<string, number>; // key `${from}->${to}` → gen-Delta
}

function buildGraph(relationships: Relationship[]): Graph {
  const neighbors = new Map<string, string[]>();
  const delta = new Map<string, number>();
  const addNeighbor = (a: string, b: string) => {
    if (!neighbors.has(a)) neighbors.set(a, []);
    const list = neighbors.get(a)!;
    if (!list.includes(b)) list.push(b);
  };
  for (const rel of relationships) {
    const d = GENERATION_DELTA[rel.type] ?? 0;
    addNeighbor(rel.from_person_id, rel.to_person_id);
    addNeighbor(rel.to_person_id, rel.from_person_id);
    delta.set(`${rel.from_person_id}->${rel.to_person_id}`, d);
    delta.set(`${rel.to_person_id}->${rel.from_person_id}`, -d);
  }
  return { neighbors, delta };
}

/** Weist jeder Person eine Generation (gen) zu – BFS über das Beziehungsnetz. */
function assignGenerations(
  persons: Person[],
  graph: Graph,
  anchorId: string | null,
): Map<string, number> {
  const gen = new Map<string, number>();
  const ids = persons.map((p) => p.id);
  const order = anchorId && ids.includes(anchorId)
    ? [anchorId, ...ids.filter((id) => id !== anchorId)]
    : ids;

  for (const start of order) {
    if (gen.has(start)) continue;
    gen.set(start, 0);
    const queue = [start];
    while (queue.length) {
      const current = queue.shift()!;
      const currentGen = gen.get(current)!;
      for (const next of graph.neighbors.get(current) ?? []) {
        if (gen.has(next)) continue;
        const d = graph.delta.get(`${current}->${next}`) ?? 0;
        gen.set(next, currentGen + d);
        queue.push(next);
      }
    }
  }
  return gen;
}

/**
 * Sortiert die Personen je Zeile per Schwerpunkt-Heuristik (barycenter),
 * damit verbundene Personen nahe beieinander liegen und Linien selten kreuzen.
 */
function orderRows(
  rows: Map<number, string[]>,
  graph: Graph,
  personById: Map<string, Person>,
  branchIndexById?: Map<string, number>,
): void {
  const sortedRowKeys = [...rows.keys()].sort((a, b) => a - b);

  // Startordnung: nach Geburtsdatum (älter links), dann Name.
  for (const key of sortedRowKeys) {
    rows.get(key)!.sort((a, b) => byBirth(personById.get(a), personById.get(b)));
  }

  const positionOf = (id: string): number => {
    for (const key of sortedRowKeys) {
      const row = rows.get(key)!;
      const idx = row.indexOf(id);
      if (idx >= 0) return (idx + 0.5) / row.length;
    }
    return 0.5;
  };

  const branchOf = (id: string) =>
    branchIndexById?.get(id) ?? Number.MAX_SAFE_INTEGER;

  for (let iter = 0; iter < 6; iter++) {
    for (const key of sortedRowKeys) {
      const row = rows.get(key)!;
      const keyOf = new Map<string, number>();
      row.forEach((id, idx) => {
        const neigh = graph.neighbors.get(id) ?? [];
        if (neigh.length === 0) {
          keyOf.set(id, (idx + 0.5) / row.length);
          return;
        }
        const mean =
          neigh.reduce((sum, n) => sum + positionOf(n), 0) / neigh.length;
        keyOf.set(id, mean);
      });
      row.sort((a, b) => {
        const diff = keyOf.get(a)! - keyOf.get(b)!;
        if (Math.abs(diff) > 0.04) return diff;
        // Bei ähnlicher Position: gleicher Familienzweig zusammenhalten.
        const bd = branchOf(a) - branchOf(b);
        if (bd !== 0) return bd;
        return byBirth(personById.get(a), personById.get(b));
      });
    }
  }
}

/** Rückt Partner (Ehe-/Lebenspartner) innerhalb ihrer Zeile nebeneinander. */
function placePartnersAdjacent(
  rows: Map<number, string[]>,
  relationships: Relationship[],
): void {
  const partnerTypes = new Set(['ehepartner', 'lebenspartner']);
  const pairs = relationships
    .filter((r) => partnerTypes.has(r.type))
    .map((r) => [r.from_person_id, r.to_person_id] as const);

  for (const row of rows.values()) {
    for (const [a, b] of pairs) {
      const ia = row.indexOf(a);
      const ib = row.indexOf(b);
      if (ia < 0 || ib < 0 || Math.abs(ia - ib) === 1) continue;
      // b direkt hinter a einsortieren.
      const [moved] = row.splice(ib, 1);
      const target = row.indexOf(a) + 1;
      row.splice(target, 0, moved!);
    }
  }
}

function byBirth(a?: Person, b?: Person): number {
  const da = a?.birth_date ?? '';
  const db = b?.birth_date ?? '';
  if (da && db) return da < db ? -1 : da > db ? 1 : 0;
  if (da) return -1;
  if (db) return 1;
  return (a?.first_name ?? '').localeCompare(b?.first_name ?? '');
}

/** Berechnet Knoten und Verbindungslinien für den Stammbaum. */
export function computeTreeLayout(
  persons: Person[],
  relationships: Relationship[],
  anchorId: string | null,
  branchIndexById?: Map<string, number>,
  allowedEdgePairs?: Set<string>,
): TreeLayout {
  if (persons.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  const personById = new Map(persons.map((p) => [p.id, p]));
  const graph = buildGraph(relationships);
  const gen = assignGenerations(persons, graph, anchorId);

  // Kategorien je Person (für die kleinen Farbpunkte).
  const categories = new Map<string, Set<RelationshipCategory>>();
  for (const rel of relationships) {
    for (const id of [rel.from_person_id, rel.to_person_id]) {
      if (!categories.has(id)) categories.set(id, new Set());
      categories.get(id)!.add(rel.category);
    }
  }

  // Zeilen gruppieren und normalisieren (kleinste Generation = oberste Zeile).
  const minGen = Math.min(...persons.map((p) => gen.get(p.id) ?? 0));
  const rows = new Map<number, string[]>();
  for (const person of persons) {
    const row = (gen.get(person.id) ?? 0) - minGen;
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row)!.push(person.id);
  }

  orderRows(rows, graph, personById, branchIndexById);
  placePartnersAdjacent(rows, relationships);

  const sortedRowKeys = [...rows.keys()].sort((a, b) => a - b);
  const maxRowWidth = Math.max(
    ...sortedRowKeys.map((key) => {
      const n = rows.get(key)!.length;
      return n * NODE_W + (n - 1) * H_GAP;
    }),
  );

  // Knotenpositionen (Zeilen mittig ausgerichtet → ruhige Baumoptik).
  const pos = new Map<string, { x: number; y: number }>();
  const nodes: TreeNode[] = [];
  sortedRowKeys.forEach((key, rowIndex) => {
    const row = rows.get(key)!;
    const rowWidth = row.length * NODE_W + (row.length - 1) * H_GAP;
    const startX = MARGIN + (maxRowWidth - rowWidth) / 2;
    const y = MARGIN + rowIndex * (NODE_H + V_GAP);
    row.forEach((id, i) => {
      const x = startX + i * (NODE_W + H_GAP);
      pos.set(id, { x, y });
      nodes.push({
        person: personById.get(id)!,
        x,
        y,
        categories: [...(categories.get(id) ?? [])],
      });
    });
  });

  // Verbindungslinien – pro Personenpaar nur eine Linie (dedupliziert).
  const edges: TreeEdge[] = [];
  const seen = new Set<string>();
  for (const rel of relationships) {
    const a = pos.get(rel.from_person_id);
    const b = pos.get(rel.to_person_id);
    if (!a || !b) continue;
    const pairKey = [rel.from_person_id, rel.to_person_id].sort().join('|');
    if (seen.has(pairKey)) continue;
    // Nur die „aufgeklappten" Verbindungen zeichnen (falls gefiltert wird).
    if (allowedEdgePairs && !allowedEdgePairs.has(pairKey)) continue;
    seen.add(pairKey);

    const color = relationshipColor(rel.category);
    const sameRow = Math.abs(a.y - b.y) < 1;
    if (sameRow) {
      // Waagerechte Partner-/Geschwisterlinie auf halber Knotenhöhe.
      const left = a.x <= b.x ? a : b;
      const right = a.x <= b.x ? b : a;
      edges.push({
        id: pairKey,
        color,
        kind: 'partner',
        x1: left.x + NODE_W,
        y1: left.y + NODE_H / 2,
        x2: right.x,
        y2: right.y + NODE_H / 2,
      });
    } else {
      // Eltern (obere Zeile) → Kind (untere Zeile).
      const upper = a.y < b.y ? a : b;
      const lower = a.y < b.y ? b : a;
      edges.push({
        id: pairKey,
        color,
        kind: 'parent',
        x1: upper.x + NODE_W / 2,
        y1: upper.y + NODE_H,
        x2: lower.x + NODE_W / 2,
        y2: lower.y,
      });
    }
  }

  const width = maxRowWidth + MARGIN * 2;
  const height =
    sortedRowKeys.length * NODE_H +
    (sortedRowKeys.length - 1) * V_GAP +
    MARGIN * 2;

  return { nodes, edges, width, height };
}
