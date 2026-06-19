import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import { logActivity } from './activities';
import type { ContentType, Memory, VisibilityLevel } from '@/types/models';

export interface MemoryInput {
  title: string;
  description?: string | null;
  content_type: ContentType;
  person_id?: string | null;
  occurred_on?: string | null;
  visibility?: VisibilityLevel;
  visibility_branch_id?: string | null;
}

export async function listMemories(
  familyId: string,
  personId?: string,
): Promise<Memory[]> {
  if (DEMO_MODE) return demoStore.listMemories(familyId, personId);
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
  if (DEMO_MODE) return demoStore.getMemory(id);
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
  if (DEMO_MODE) {
    const m = demoStore.createMemory(familyId, authorId, input);
    demoStore.logActivity({
      familyId,
      actorId: authorId,
      action: 'memory.created',
      entityType: 'memory',
      entityId: m.id,
      summary: m.title,
    });
    return m;
  }
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
  if (DEMO_MODE) return demoStore.updateMemory(id, input);
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
  if (DEMO_MODE) return demoStore.deleteMemory(id);
  const { error } = await supabase.from('memories').delete().eq('id', id);
  if (error) throw error;
}
