import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import type { FamilyBranch } from '@/types/models';

export async function listBranches(familyId: string): Promise<FamilyBranch[]> {
  if (DEMO_MODE) return demoStore.listBranches();
  const { data, error } = await supabase
    .from('family_branches')
    .select('*, branch_members(person_id)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as never[]).map((row) => {
    const r = row as FamilyBranch & {
      branch_members?: { person_id: string }[];
    };
    return { ...r, member_ids: (r.branch_members ?? []).map((m) => m.person_id) };
  });
}

export async function createBranch(input: {
  familyId: string;
  name: string;
  color?: string | null;
  createdBy: string;
}): Promise<FamilyBranch> {
  if (DEMO_MODE)
    return demoStore.createBranch(input.familyId, input.name, input.color ?? null, input.createdBy);
  const { data, error } = await supabase
    .from('family_branches')
    .insert({
      family_id: input.familyId,
      name: input.name,
      color: input.color ?? null,
      created_by: input.createdBy,
    })
    .select('*')
    .single();
  if (error) throw error;
  return { ...(data as FamilyBranch), member_ids: [] };
}

export async function setBranchMembers(
  branchId: string,
  personIds: string[],
): Promise<FamilyBranch> {
  if (DEMO_MODE) return demoStore.setBranchMembers(branchId, personIds);
  await supabase.from('branch_members').delete().eq('branch_id', branchId);
  if (personIds.length > 0) {
    const { error } = await supabase
      .from('branch_members')
      .insert(personIds.map((person_id) => ({ branch_id: branchId, person_id })));
    if (error) throw error;
  }
  const { data, error } = await supabase
    .from('family_branches')
    .select('*')
    .eq('id', branchId)
    .single();
  if (error) throw error;
  return { ...(data as FamilyBranch), member_ids: personIds };
}

export async function deleteBranch(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteBranch(id);
  const { error } = await supabase.from('family_branches').delete().eq('id', id);
  if (error) throw error;
}
