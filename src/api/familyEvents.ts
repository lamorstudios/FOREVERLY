import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import type {
  FamilyEvent,
  FamilyEventType,
  EventParticipant,
  RsvpStatus,
  VisibilityLevel,
} from '@/types/models';

export async function listEvents(familyId: string): Promise<FamilyEvent[]> {
  if (DEMO_MODE) return demoStore.listEvents();
  const { data, error } = await supabase
    .from('family_events')
    .select('*, event_participants(count)')
    .eq('family_id', familyId)
    .order('event_date', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as never[]).map((row) => {
    const r = row as FamilyEvent & { event_participants?: { count: number }[] };
    return { ...r, participant_count: r.event_participants?.[0]?.count ?? 0 };
  });
}

export async function getEvent(id: string): Promise<FamilyEvent | null> {
  if (DEMO_MODE) return demoStore.getEvent(id);
  const { data, error } = await supabase
    .from('family_events')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as FamilyEvent | null;
}

export interface EventInput {
  familyId: string;
  type: FamilyEventType;
  title: string;
  description?: string | null;
  eventDate: string;
  eventTime?: string | null;
  location?: string | null;
  visibility?: VisibilityLevel;
  hostUserId: string;
  hostPersonId?: string | null;
  participantPersonIds?: string[];
  createdBy: string;
}

export async function createEvent(input: EventInput): Promise<FamilyEvent> {
  if (DEMO_MODE) return demoStore.createEvent(input);
  const { data, error } = await supabase
    .from('family_events')
    .insert({
      family_id: input.familyId,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      event_date: input.eventDate,
      event_time: input.eventTime ?? null,
      location: input.location ?? null,
      visibility: input.visibility ?? 'family',
      host_user_id: input.hostUserId,
      host_person_id: input.hostPersonId ?? null,
      created_by: input.createdBy,
    })
    .select('*')
    .single();
  if (error) throw error;
  const event = data as FamilyEvent;
  const participants = (input.participantPersonIds ?? []).map((pid) => ({
    event_id: event.id,
    person_id: pid,
  }));
  if (participants.length) {
    const { error: pErr } = await supabase.from('event_participants').insert(participants);
    if (pErr) throw pErr;
  }
  return event;
}

export async function deleteEvent(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteEvent(id);
  const { error } = await supabase.from('family_events').delete().eq('id', id);
  if (error) throw error;
}

export async function listParticipants(eventId: string): Promise<EventParticipant[]> {
  if (DEMO_MODE) return demoStore.listParticipants(eventId);
  const { data, error } = await supabase
    .from('event_participants')
    .select('*, person:persons(*)')
    .eq('event_id', eventId);
  if (error) throw error;
  return (data ?? []) as EventParticipant[];
}

export async function setRsvp(input: {
  eventId: string;
  personId: string;
  userId: string;
  rsvp: RsvpStatus;
  comment?: string | null;
  bringing?: string | null;
}): Promise<EventParticipant> {
  if (DEMO_MODE) return demoStore.setRsvp(input);
  const { data, error } = await supabase
    .from('event_participants')
    .upsert(
      {
        event_id: input.eventId,
        person_id: input.personId,
        user_id: input.userId,
        rsvp: input.rsvp,
        comment: input.comment ?? null,
        bringing: input.bringing ?? null,
        responded_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,person_id' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data as EventParticipant;
}
