import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import type { CalendarEvent, CalendarEventType } from '@/types/models';

export async function listCalendarEvents(
  familyId: string,
): Promise<CalendarEvent[]> {
  if (DEMO_MODE) return demoStore.listCalendarEvents();
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*, calendar_event_participants(person_id)')
    .eq('family_id', familyId)
    .order('event_date', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as never[]).map((row) => {
    const r = row as CalendarEvent & {
      calendar_event_participants?: { person_id: string | null }[];
    };
    return {
      ...r,
      participant_ids: (r.calendar_event_participants ?? [])
        .map((p) => p.person_id)
        .filter((id): id is string => !!id),
    };
  });
}

export interface CalendarEventInput {
  familyId: string;
  type: CalendarEventType;
  title: string;
  description?: string | null;
  eventDate: string;
  eventTime?: string | null;
  isAnnual?: boolean;
  forWholeFamily?: boolean;
  participantIds?: string[];
  createdBy: string;
}

export async function createCalendarEvent(
  input: CalendarEventInput,
): Promise<CalendarEvent> {
  if (DEMO_MODE) return demoStore.createCalendarEvent(input);

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      family_id: input.familyId,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      event_date: input.eventDate,
      event_time: input.eventTime ?? null,
      is_annual: input.isAnnual ?? false,
      for_whole_family: input.forWholeFamily ?? false,
      created_by: input.createdBy,
    })
    .select('*')
    .single();
  if (error) throw error;
  const event = data as CalendarEvent;

  const participants = (input.participantIds ?? []).map((personId) => ({
    event_id: event.id,
    person_id: personId,
  }));
  if (participants.length > 0) {
    const { error: pErr } = await supabase
      .from('calendar_event_participants')
      .insert(participants);
    if (pErr) throw pErr;
  }
  return { ...event, participant_ids: input.participantIds ?? [] };
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteCalendarEvent(id);
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
