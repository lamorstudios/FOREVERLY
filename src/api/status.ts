import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import { STATUS_LEVELS } from '@/constants/phase2';
import type { MemberStatus, StatusLevel } from '@/types/models';

export async function listStatuses(familyId: string): Promise<MemberStatus[]> {
  if (DEMO_MODE) return demoStore.listStatuses();
  const { data, error } = await supabase
    .from('member_statuses')
    .select('*, person:persons(*)')
    .eq('family_id', familyId);
  if (error) throw error;
  return (data ?? []) as MemberStatus[];
}

/**
 * Setzt den Status einer Person. Bei Alarm-Stufen (allein/unwohl/hilfe) wird
 * eine Benachrichtigung für die Familie erzeugt (Preview: In-App).
 */
export async function setStatus(input: {
  familyId: string;
  personId: string;
  personName: string;
  level: StatusLevel;
  message?: string | null;
  updatedBy: string;
}): Promise<MemberStatus> {
  const meta = STATUS_LEVELS[input.level];

  if (DEMO_MODE) {
    const result = demoStore.setStatus(
      input.familyId,
      input.personId,
      input.level,
      input.message ?? null,
      input.updatedBy,
    );
    if (meta.isAlert) {
      demoStore.addNotification({
        familyId: input.familyId,
        actorUserId: input.updatedBy,
        category: 'status',
        title: `${meta.emoji} ${input.personName}: ${meta.label}`,
        body: input.message ?? 'Bitte kümmere dich um dein Familienmitglied.',
        data: { personId: input.personId, level: input.level },
      });
    }
    return result;
  }

  const { data, error } = await supabase
    .from('member_statuses')
    .upsert(
      {
        family_id: input.familyId,
        person_id: input.personId,
        level: input.level,
        message: input.message ?? null,
        updated_by: input.updatedBy,
      },
      { onConflict: 'family_id,person_id' },
    )
    .select('*')
    .single();
  if (error) throw error;

  if (meta.isAlert) {
    await supabase.from('notifications').insert({
      family_id: input.familyId,
      actor_user_id: input.updatedBy,
      category: 'status',
      title: `${meta.emoji} ${input.personName}: ${meta.label}`,
      body: input.message ?? 'Bitte kümmere dich um dein Familienmitglied.',
      data: { personId: input.personId, level: input.level },
    });
  }
  return data as MemberStatus;
}
