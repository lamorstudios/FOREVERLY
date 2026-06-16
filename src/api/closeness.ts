import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import type { ClosenessLevel, ClosenessRating } from '@/types/models';

export async function listCloseness(
  familyId: string,
  userId: string,
): Promise<ClosenessRating[]> {
  if (DEMO_MODE) return demoStore.listCloseness();
  const { data, error } = await supabase
    .from('closeness_ratings')
    .select('*')
    .eq('family_id', familyId)
    .eq('rater_user_id', userId);
  if (error) throw error;
  return (data ?? []) as ClosenessRating[];
}

export async function setCloseness(
  familyId: string,
  userId: string,
  personId: string,
  level: ClosenessLevel,
): Promise<ClosenessRating> {
  if (DEMO_MODE) return demoStore.setCloseness(familyId, userId, personId, level);
  const { data, error } = await supabase
    .from('closeness_ratings')
    .upsert(
      { family_id: familyId, rater_user_id: userId, person_id: personId, level },
      { onConflict: 'rater_user_id,person_id' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data as ClosenessRating;
}

/** Hilfsfunktion: Map person_id -> ClosenessLevel. */
export function closenessMap(
  ratings: ClosenessRating[],
): Record<string, ClosenessLevel> {
  const map: Record<string, ClosenessLevel> = {};
  for (const r of ratings) map[r.person_id] = r.level;
  return map;
}
