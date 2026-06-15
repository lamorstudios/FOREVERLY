import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import type { EmergencyContact, EmergencyEvent } from '@/types/models';

// --- Notfallkontakte ---

export async function listEmergencyContacts(
  familyId: string,
): Promise<EmergencyContact[]> {
  if (DEMO_MODE) return demoStore.listEmergencyContacts();
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('family_id', familyId)
    .order('priority', { ascending: true });
  if (error) throw error;
  return (data ?? []) as EmergencyContact[];
}

export async function createEmergencyContact(input: {
  familyId: string;
  name: string;
  relation?: string | null;
  phone?: string | null;
  note?: string | null;
  personId?: string | null;
  createdBy: string;
}): Promise<EmergencyContact> {
  if (DEMO_MODE) return demoStore.createEmergencyContact(input);
  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({
      family_id: input.familyId,
      name: input.name,
      relation: input.relation ?? null,
      phone: input.phone ?? null,
      note: input.note ?? null,
      person_id: input.personId ?? null,
      created_by: input.createdBy,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as EmergencyContact;
}

export async function deleteEmergencyContact(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteEmergencyContact(id);
  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// --- Notfallereignisse (SOS) ---

export async function listEmergencyEvents(
  familyId: string,
): Promise<EmergencyEvent[]> {
  if (DEMO_MODE) return demoStore.listEmergencyEvents();
  const { data, error } = await supabase
    .from('emergency_events')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as EmergencyEvent[];
}

export async function triggerEmergency(input: {
  familyId: string;
  triggeredBy: string;
  latitude?: number | null;
  longitude?: number | null;
  locationLabel?: string | null;
  message?: string | null;
}): Promise<EmergencyEvent> {
  if (DEMO_MODE) return demoStore.triggerEmergency(input);

  const { data, error } = await supabase
    .from('emergency_events')
    .insert({
      family_id: input.familyId,
      triggered_by: input.triggeredBy,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      location_label: input.locationLabel ?? null,
      message: input.message ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;

  await supabase.from('notifications').insert({
    family_id: input.familyId,
    actor_user_id: input.triggeredBy,
    category: 'emergency',
    title: '🚨 Notfall ausgelöst',
    body: input.locationLabel
      ? `Standort: ${input.locationLabel}`
      : 'Ein Familienmitglied benötigt Hilfe.',
    data: { eventId: (data as EmergencyEvent).id },
  });
  return data as EmergencyEvent;
}

export async function resolveEmergency(
  id: string,
  resolvedBy: string,
): Promise<void> {
  if (DEMO_MODE) return demoStore.resolveEmergency(id, resolvedBy);
  const { error } = await supabase
    .from('emergency_events')
    .update({
      state: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
    })
    .eq('id', id);
  if (error) throw error;
}
