import { supabase } from '@/lib/supabase';
import type { Activity } from '@/types/models';

interface LogActivityInput {
  familyId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string | null;
}

/** Schreibt einen Eintrag in den Aktivitäts-Feed (best effort). */
export async function logActivity(input: LogActivityInput): Promise<void> {
  await supabase.from('activities').insert({
    family_id: input.familyId,
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    summary: input.summary ?? null,
  });
}

export async function listActivities(
  familyId: string,
  limit = 30,
): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*, actor:profiles!activities_actor_id_fkey(*)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Activity[];
}
