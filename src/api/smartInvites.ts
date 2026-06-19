import { supabase } from '@/lib/supabase';
import { DEMO_MODE, config } from '@/lib/config';
import { demoStore } from '@/demo/store';
import type {
  Invitation,
  MemberRole,
  RelationshipType,
  ClosenessLevel,
} from '@/types/models';

export interface SmartInviteInput {
  familyId: string;
  invitedBy: string;
  role: MemberRole;
  personId: string | null;
  inviterPersonId: string | null;
  relationshipType: RelationshipType | null;
  suggestedCloseness: ClosenessLevel | null;
  message: string | null;
}

export async function createSmartInvite(input: SmartInviteInput): Promise<Invitation> {
  if (DEMO_MODE) return demoStore.createSmartInvite(input);

  const { data: codeData, error: codeError } = await supabase.rpc('generate_invite_code');
  if (codeError) throw codeError;

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      family_id: input.familyId,
      invited_by: input.invitedBy,
      role: input.role,
      code: codeData as string,
      person_id: input.personId,
      inviter_person_id: input.inviterPersonId,
      relationship_type: input.relationshipType,
      suggested_closeness: input.suggestedCloseness,
      message: input.message,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Invitation;
}

export async function listSmartInvites(familyId: string): Promise<Invitation[]> {
  if (DEMO_MODE) return demoStore.listInvitations().filter((i) => i.person_id);
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('family_id', familyId)
    .not('person_id', 'is', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Invitation[];
}

export async function revokeSmartInvite(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.revokeInvitation(id);
  const { error } = await supabase
    .from('invitations')
    .update({ status: 'revoked' })
    .eq('id', id);
  if (error) throw error;
}

/** Simuliert die Annahme (nur Vorschau). In Produktion erfolgt sie nach der
 *  Registrierung der eingeladenen Person über accept_smart_invitation(). */
export async function acceptSmartInviteDemo(code: string): Promise<Invitation | null> {
  if (DEMO_MODE) return demoStore.acceptSmartInviteDemo(code);
  throw new Error(
    'Die Annahme erfolgt durch die eingeladene Person nach ihrer Registrierung.',
  );
}

export function buildSmartInviteLink(code: string): string {
  return `${config.inviteBaseUrl}/${code}`;
}
