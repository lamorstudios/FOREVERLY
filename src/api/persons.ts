import { supabase } from '@/lib/supabase';
import { uploadFile, makeFileName } from '@/lib/storage';
import { mimeForImage } from './profiles';
import type { Person, Relationship } from '@/types/models';

export interface PersonInput {
  first_name: string;
  last_name?: string | null;
  birth_date?: string | null;
  birth_place?: string | null;
  death_date?: string | null;
  biography?: string | null;
  avatar_url?: string | null;
}

export async function listPersons(familyId: string): Promise<Person[]> {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('family_id', familyId)
    .order('first_name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Person[];
}

export async function getPerson(id: string): Promise<Person | null> {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Person | null;
}

export async function createPerson(
  familyId: string,
  createdBy: string,
  input: PersonInput,
): Promise<Person> {
  const { data, error } = await supabase
    .from('persons')
    .insert({ ...input, family_id: familyId, created_by: createdBy })
    .select('*')
    .single();
  if (error) throw error;
  return data as Person;
}

export async function updatePerson(
  id: string,
  input: PersonInput,
): Promise<Person> {
  const { data, error } = await supabase
    .from('persons')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Person;
}

export async function deletePerson(id: string): Promise<void> {
  const { error } = await supabase.from('persons').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadPersonAvatar(
  familyId: string,
  localUri: string,
): Promise<string> {
  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${familyId}/persons/${makeFileName(ext)}`;
  return uploadFile('photos', path, localUri, mimeForImage(ext));
}

// --- Beziehungen -----------------------------------------------------

export async function listRelationships(
  familyId: string,
): Promise<Relationship[]> {
  const { data, error } = await supabase
    .from('relationships')
    .select('*')
    .eq('family_id', familyId);
  if (error) throw error;
  return (data ?? []) as Relationship[];
}

export async function createRelationship(input: {
  family_id: string;
  from_person_id: string;
  to_person_id: string;
  type: Relationship['type'];
  category: Relationship['category'];
  created_by: string;
}): Promise<Relationship> {
  const { data, error } = await supabase
    .from('relationships')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data as Relationship;
}

export async function deleteRelationship(id: string): Promise<void> {
  const { error } = await supabase.from('relationships').delete().eq('id', id);
  if (error) throw error;
}
