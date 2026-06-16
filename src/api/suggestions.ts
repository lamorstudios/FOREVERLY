import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import { listPersons, listRelationships } from './persons';
import { computeSuggestions } from '@/invites/suggestions';
import type {
  RelationshipSuggestion,
  RelationshipType,
  RelationshipCategory,
} from '@/types/models';

export async function listSuggestions(
  familyId: string,
): Promise<RelationshipSuggestion[]> {
  if (DEMO_MODE) return demoStore.listSuggestions();
  const { data, error } = await supabase
    .from('relationship_suggestions')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as RelationshipSuggestion[];
}

/** Erkennt logische Beziehungen und legt neue Vorschläge an. */
export async function generateSuggestions(
  familyId: string,
  createdBy: string,
): Promise<RelationshipSuggestion[]> {
  const [persons, relationships, existing] = await Promise.all([
    listPersons(familyId),
    listRelationships(familyId),
    listSuggestions(familyId),
  ]);
  const candidates = computeSuggestions(
    persons,
    relationships,
    existing.map((s) => ({ from_person_id: s.from_person_id, to_person_id: s.to_person_id })),
  );

  if (DEMO_MODE) {
    return demoStore.addSuggestions(
      candidates.map((c) => ({ ...c, family_id: familyId, created_by: createdBy })),
    );
  }
  if (candidates.length === 0) return [];
  const { data, error } = await supabase
    .from('relationship_suggestions')
    .upsert(
      candidates.map((c) => ({
        family_id: familyId,
        from_person_id: c.from_person_id,
        to_person_id: c.to_person_id,
        suggested_type: c.suggested_type,
        suggested_category: c.suggested_category,
        reason: c.reason,
        created_by: createdBy,
      })),
      { onConflict: 'from_person_id,to_person_id', ignoreDuplicates: true },
    )
    .select('*');
  if (error) throw error;
  return (data ?? []) as RelationshipSuggestion[];
}

export async function confirmSuggestion(
  suggestion: RelationshipSuggestion,
): Promise<void> {
  if (DEMO_MODE) {
    demoStore.confirmSuggestion(suggestion.id);
    return;
  }
  const { error: relErr } = await supabase.from('relationships').insert({
    family_id: suggestion.family_id,
    from_person_id: suggestion.from_person_id,
    to_person_id: suggestion.to_person_id,
    type: suggestion.suggested_type,
    category: suggestion.suggested_category,
    created_by: suggestion.created_by,
  });
  if (relErr) throw relErr;
  const { error } = await supabase
    .from('relationship_suggestions')
    .update({ status: 'confirmed' })
    .eq('id', suggestion.id);
  if (error) throw error;
}

export async function updateSuggestionType(
  id: string,
  type: RelationshipType,
  category: RelationshipCategory,
): Promise<void> {
  if (DEMO_MODE) {
    demoStore.updateSuggestion(id, { suggested_type: type, suggested_category: category });
    return;
  }
  const { error } = await supabase
    .from('relationship_suggestions')
    .update({ suggested_type: type, suggested_category: category })
    .eq('id', id);
  if (error) throw error;
}

export async function dismissSuggestion(id: string): Promise<void> {
  if (DEMO_MODE) {
    demoStore.updateSuggestion(id, { status: 'dismissed' });
    return;
  }
  const { error } = await supabase
    .from('relationship_suggestions')
    .update({ status: 'dismissed' })
    .eq('id', id);
  if (error) throw error;
}
