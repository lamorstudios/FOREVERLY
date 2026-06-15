/**
 * Beziehungsvorschläge: erkennt logische Familienbeziehungen aus den
 * vorhandenen Beziehungen und schlägt fehlende vor (z.B. Bruder → Kind →
 * Nichte/Neffe). Rein deterministisch, keine erfundenen Personen.
 *
 * Konvention: relationship(from, to, type) bedeutet „to ist <type> von from".
 */
import { fullName } from '@/lib/format';
import type {
  Person,
  Relationship,
  RelationshipType,
  RelationshipCategory,
} from '@/types/models';

export interface SuggestionCandidate {
  from_person_id: string;
  to_person_id: string;
  suggested_type: RelationshipType;
  suggested_category: RelationshipCategory;
  reason: string;
}

const SIBLINGS: RelationshipType[] = ['bruder', 'schwester'];
const PARENTS: RelationshipType[] = ['vater', 'mutter'];
const CHILDREN: RelationshipType[] = ['tochter', 'sohn'];

export function computeSuggestions(
  persons: Person[],
  relationships: Relationship[],
  existing: { from_person_id: string; to_person_id: string }[] = [],
): SuggestionCandidate[] {
  const nameOf = (id: string) => {
    const p = persons.find((x) => x.id === id);
    return p ? fullName(p.first_name, p.last_name) : 'diese Person';
  };
  const candidates = new Map<string, SuggestionCandidate>();

  // bereits vorhandene Verbindungen (Beziehung ODER Vorschlag) sperren
  const blocked = new Set<string>();
  for (const r of relationships) blocked.add(`${r.from_person_id}->${r.to_person_id}`);
  for (const e of existing) blocked.add(`${e.from_person_id}->${e.to_person_id}`);

  const add = (c: SuggestionCandidate) => {
    const key = `${c.from_person_id}->${c.to_person_id}`;
    if (blocked.has(key) || candidates.has(key) || c.from_person_id === c.to_person_id) return;
    candidates.set(key, c);
  };

  for (const a of relationships) {
    const second = relationships.filter((b) => b.from_person_id === a.to_person_id);
    for (const b of second) {
      const X = a.from_person_id;
      const Y = a.to_person_id;
      const Z = b.to_person_id;

      // Geschwister(Y von X) + Kind(Z von Y) -> Nichte/Neffe
      if (SIBLINGS.includes(a.type) && CHILDREN.includes(b.type)) {
        add({
          from_person_id: X,
          to_person_id: Z,
          suggested_type: b.type === 'tochter' ? 'nichte' : 'neffe',
          suggested_category: 'biological',
          reason: `${nameOf(Z)} ist das Kind von ${nameOf(Y)} (${a.type === 'bruder' ? 'deinem Bruder' : 'deiner Schwester'}).`,
        });
      }

      // Elternteil(Y von X) + Geschwister(Z von Y) -> Onkel/Tante
      if (PARENTS.includes(a.type) && SIBLINGS.includes(b.type)) {
        add({
          from_person_id: X,
          to_person_id: Z,
          suggested_type: b.type === 'schwester' ? 'tante' : 'onkel',
          suggested_category: 'biological',
          reason: `${nameOf(Z)} ist ein Geschwister von ${nameOf(Y)} (${a.type === 'vater' ? 'deinem Vater' : 'deiner Mutter'}).`,
        });
      }

      // Elternteil(Y von X) + Elternteil(Z von Y) -> Oma/Opa
      if (PARENTS.includes(a.type) && PARENTS.includes(b.type)) {
        add({
          from_person_id: X,
          to_person_id: Z,
          suggested_type: b.type === 'mutter' ? 'oma' : 'opa',
          suggested_category: 'biological',
          reason: `${nameOf(Z)} ist ein Elternteil von ${nameOf(Y)}.`,
        });
      }
    }
  }

  return [...candidates.values()];
}
