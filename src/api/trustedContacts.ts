import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import type { TrustedContact, TrustedRole } from '@/types/models';

export async function listTrustedContacts(
  familyId: string,
  personId?: string,
): Promise<TrustedContact[]> {
  if (DEMO_MODE) return demoStore.listTrustedContacts(personId);
  let query = supabase
    .from('trusted_contacts')
    .select('*, person:persons(*)')
    .eq('family_id', familyId)
    .order('is_emergency', { ascending: false });
  if (personId) query = query.eq('person_id', personId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TrustedContact[];
}

export interface TrustedContactInput {
  familyId: string;
  personId: string | null;
  name: string;
  role: TrustedRole;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  note?: string | null;
  availability?: string | null;
  isEmergency?: boolean;
  createdBy: string;
}

export async function createTrustedContact(
  input: TrustedContactInput,
): Promise<TrustedContact> {
  if (DEMO_MODE) return demoStore.createTrustedContact(input);
  const { data, error } = await supabase
    .from('trusted_contacts')
    .insert({
      family_id: input.familyId,
      person_id: input.personId,
      name: input.name,
      role: input.role,
      phone: input.phone ?? null,
      email: input.email ?? null,
      location: input.location ?? null,
      note: input.note ?? null,
      availability: input.availability ?? null,
      is_emergency: input.isEmergency ?? false,
      created_by: input.createdBy,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as TrustedContact;
}

export async function updateTrustedContact(
  id: string,
  patch: Partial<
    Pick<TrustedContact, 'name' | 'role' | 'phone' | 'email' | 'location' | 'note' | 'availability' | 'is_emergency' | 'person_id'>
  >,
): Promise<TrustedContact> {
  if (DEMO_MODE) return demoStore.updateTrustedContact(id, patch);
  const { data, error } = await supabase
    .from('trusted_contacts')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as TrustedContact;
}

export async function deleteTrustedContact(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteTrustedContact(id);
  const { error } = await supabase
    .from('trusted_contacts')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
