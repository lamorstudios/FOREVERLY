import { supabase } from '@/lib/supabase';
import { logActivity } from './activities';
import type { ContentType, Memory } from '@/types/models';

export interface MemoryInput {
  title: string;
  description?: string | null;
  content_type: ContentType;
  person_id?: string | null;
  occurred_on?: string | null;
}

export async function listMemories(
  familyId: string,
  personId?: string,
): Promise<Memory[]> {
  let query = supabase
    .from('memories')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  if (personId) query = query.eq('person_id', personId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Memory[];
}

export async function getMemory(id: string): Promise<Memory | null> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Memory | null;
}

export async function createMemory(
  familyId: string,
  authorId: string,
  input: MemoryInput,
): Promise<Memory> {
  const { data, error } = await supabase
    .from('memories')
    .insert({ ...input, family_id: familyId, author_id: authorId })
    .select('*')
    .single();
  if (error) throw error;
  const memory = data as Memory;

  await logActivity({
    familyId,
    actorId: authorId,
    action: 'memory.created',
    entityType: 'memory',
    entityId: memory.id,
    summary: memory.title,
  });
  return memory;
}

export async function updateMemory(
  id: string,
  input: Partial<MemoryInput>,
): Promise<Memory> {
  const { data, error } = await supabase
    .from('memories')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Memory;
}

export async function deleteMemory(id: string): Promise<void> {
  const { error } = await supabase.from('memories').delete().eq('id', id);
  if (error) throw error;
}
