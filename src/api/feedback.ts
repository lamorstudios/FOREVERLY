import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import type { Feedback, FeedbackKind } from '@/types/models';

export interface FeedbackInput {
  familyId: string;
  userId: string | null;
  kind: FeedbackKind;
  message: string;
}

export async function sendFeedback(input: FeedbackInput): Promise<Feedback> {
  if (DEMO_MODE) return demoStore.createFeedback(input);
  const { data, error } = await supabase
    .from('feedback')
    .insert({ family_id: input.familyId, user_id: input.userId, kind: input.kind, message: input.message })
    .select('*')
    .single();
  if (error) throw error;
  return data as Feedback;
}

/** DSGVO: vollständiger Datenexport (Demo: In-Memory-Dump). */
export async function exportFamilyData(familyId: string): Promise<unknown> {
  if (DEMO_MODE) return demoStore.exportData();
  // Realbetrieb: serverseitiger Export-Job (vorbereitet).
  const { data, error } = await supabase.rpc('export_family_data', { family_id: familyId });
  if (error) throw error;
  return data;
}
