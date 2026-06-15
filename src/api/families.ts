import { supabase } from '@/lib/supabase';
import { uploadFile, makeFileName } from '@/lib/storage';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import { mimeForImage } from './profiles';
import type { Family, FamilyMember, MemberRole } from '@/types/models';

interface FamilyMembershipRow {
  role: MemberRole;
  family: Family;
}

/** Alle Familien, in denen der aktuelle Nutzer Mitglied ist. */
export async function listMyFamilies(): Promise<
  { family: Family; role: MemberRole }[]
> {
  if (DEMO_MODE) return demoStore.listMyFamilies();
  const { data, error } = await supabase
    .from('family_members')
    .select('role, family:families(*)')
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as FamilyMembershipRow[])
    .filter((r) => r.family)
    .map((r) => ({ family: r.family, role: r.role }));
}

export async function getFamily(id: string): Promise<Family | null> {
  if (DEMO_MODE) return demoStore.getFamily(id);
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Family | null;
}

export async function createFamily(input: {
  name: string;
  createdBy: string;
  imageUri?: string | null;
}): Promise<Family> {
  if (DEMO_MODE) {
    return demoStore.updateFamily('fam-mielke', {
      name: input.name,
      image_url: input.imageUri ?? null,
    });
  }
  const { data, error } = await supabase
    .from('families')
    .insert({ name: input.name, created_by: input.createdBy })
    .select('*')
    .single();
  if (error) throw error;
  const family = data as Family;

  if (input.imageUri) {
    const url = await uploadFamilyImage(family.id, input.imageUri);
    return updateFamily(family.id, { image_url: url });
  }
  return family;
}

export async function updateFamily(
  id: string,
  input: { name?: string; image_url?: string | null },
): Promise<Family> {
  if (DEMO_MODE) return demoStore.updateFamily(id, input);
  const { data, error } = await supabase
    .from('families')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Family;
}

export async function uploadFamilyImage(
  familyId: string,
  localUri: string,
): Promise<string> {
  if (DEMO_MODE) return localUri;
  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${familyId}/cover/${makeFileName(ext)}`;
  return uploadFile('photos', path, localUri, mimeForImage(ext));
}

export async function listMembers(familyId: string): Promise<FamilyMember[]> {
  if (DEMO_MODE) return demoStore.listMembers();
  const { data, error } = await supabase
    .from('family_members')
    .select('*, profile:profiles(*)')
    .eq('family_id', familyId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as FamilyMember[];
}

export async function updateMemberRole(
  memberId: string,
  role: MemberRole,
): Promise<void> {
  if (DEMO_MODE) return demoStore.updateMemberRole(memberId, role);
  const { error } = await supabase
    .from('family_members')
    .update({ role })
    .eq('id', memberId);
  if (error) throw error;
}

export async function removeMember(memberId: string): Promise<void> {
  if (DEMO_MODE) return demoStore.removeMember(memberId);
  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('id', memberId);
  if (error) throw error;
}
