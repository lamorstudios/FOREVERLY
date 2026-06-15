import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import type { DocumentKind, FamilyDocument } from '@/types/models';

export async function listDocuments(
  familyId: string,
): Promise<FamilyDocument[]> {
  if (DEMO_MODE) return demoStore.listDocuments();
  const { data, error } = await supabase
    .from('family_documents')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as FamilyDocument[];
}

export interface DocumentInput {
  id?: string;
  familyId: string;
  kind: DocumentKind;
  title: string;
  isAvailable: boolean;
  location?: string | null;
  note?: string | null;
  contactPerson?: string | null;
  createdBy: string;
}

export async function upsertDocument(
  input: DocumentInput,
): Promise<FamilyDocument> {
  if (DEMO_MODE) return demoStore.upsertDocument(input);

  const payload = {
    family_id: input.familyId,
    kind: input.kind,
    title: input.title,
    is_available: input.isAvailable,
    location: input.location ?? null,
    note: input.note ?? null,
    contact_person: input.contactPerson ?? null,
    created_by: input.createdBy,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from('family_documents')
      .update(payload)
      .eq('id', input.id)
      .select('*')
      .single();
    if (error) throw error;
    return data as FamilyDocument;
  }

  const { data, error } = await supabase
    .from('family_documents')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as FamilyDocument;
}

export async function deleteDocument(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteDocument(id);
  const { error } = await supabase
    .from('family_documents')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
