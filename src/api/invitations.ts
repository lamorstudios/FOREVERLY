import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';
import type { Invitation, MemberRole } from '@/types/models';

/** Erzeugt einen Einladungscode (DB-Funktion) und legt die Einladung an. */
export async function createInvitation(input: {
  familyId: string;
  invitedBy: string;
  role: MemberRole;
  email?: string | null;
}): Promise<Invitation> {
  const { data: codeData, error: codeError } = await supabase.rpc(
    'generate_invite_code',
  );
  if (codeError) throw codeError;

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      family_id: input.familyId,
      invited_by: input.invitedBy,
      role: input.role,
      email: input.email ?? null,
      code: codeData as string,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Invitation;
}

export async function listInvitations(
  familyId: string,
): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Invitation[];
}

export async function revokeInvitation(id: string): Promise<void> {
  const { error } = await supabase
    .from('invitations')
    .update({ status: 'revoked' })
    .eq('id', id);
  if (error) throw error;
}

/** Löst eine Einladung ein (DB-Funktion). Gibt die family_id zurück. */
export async function acceptInvitation(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('accept_invitation', {
    p_code: code.trim().toUpperCase(),
  });
  if (error) throw error;
  return data as string;
}

/** Baut den teilbaren Einladungslink. */
export function buildInviteLink(code: string): string {
  return `${config.inviteBaseUrl}/${code}`;
}
