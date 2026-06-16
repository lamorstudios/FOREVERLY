import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import type {
  Trustee,
  EstateInfo,
  EstateCase,
  EstateAudience,
} from '@/types/models';

// ---------------------- Vertrauenspersonen (Trustees) ----------------------

export async function listTrustees(ownerUserId: string): Promise<Trustee[]> {
  if (DEMO_MODE) return demoStore.listTrustees(ownerUserId);
  const { data, error } = await supabase
    .from('trustees')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Trustee[];
}

export interface TrusteeInput {
  familyId: string;
  ownerUserId: string;
  personId: string | null;
  name: string;
  relation: string;
  phone?: string | null;
  email?: string | null;
  role?: string | null;
  canConfirmDeath?: boolean;
}

export async function createTrustee(input: TrusteeInput): Promise<Trustee> {
  if (DEMO_MODE) return demoStore.createTrustee(input);
  const { data, error } = await supabase
    .from('trustees')
    .insert({
      family_id: input.familyId,
      owner_user_id: input.ownerUserId,
      person_id: input.personId,
      name: input.name,
      relation: input.relation,
      phone: input.phone ?? null,
      email: input.email ?? null,
      role: input.role ?? input.relation,
      can_confirm_death: input.canConfirmDeath ?? true,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Trustee;
}

export async function updateTrustee(id: string, patch: Partial<Trustee>): Promise<Trustee> {
  if (DEMO_MODE) return demoStore.updateTrustee(id, patch);
  const { data, error } = await supabase.from('trustees').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Trustee;
}

export async function deleteTrustee(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteTrustee(id);
  const { error } = await supabase.from('trustees').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------- Nachlasshinweise (Estate Info) ----------------------

export async function getEstateInfo(ownerUserId: string): Promise<EstateInfo | null> {
  if (DEMO_MODE) return demoStore.getEstateInfo(ownerUserId);
  const { data, error } = await supabase
    .from('estate_info')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .maybeSingle();
  if (error) throw error;
  return (data as EstateInfo) ?? null;
}

export interface EstateInfoInput {
  has_will?: boolean;
  will_location?: string | null;
  has_patient_decree?: boolean;
  patient_decree_location?: string | null;
  has_power_of_attorney?: boolean;
  power_of_attorney_location?: string | null;
  has_insurance?: boolean;
  insurance_location?: string | null;
  contact_person?: string | null;
  contact_person_id?: string | null;
  personal_notes?: string | null;
  farewell_message?: string | null;
  media_path?: string | null;
  release_audience?: EstateAudience;
  recipient_person_ids?: string[];
  required_confirmations?: number;
}

export async function saveEstateInfo(
  ownerUserId: string,
  familyId: string,
  patch: EstateInfoInput,
): Promise<EstateInfo> {
  if (DEMO_MODE) return demoStore.upsertEstateInfo(ownerUserId, familyId, patch);
  const { data, error } = await supabase
    .from('estate_info')
    .upsert({ owner_user_id: ownerUserId, family_id: familyId, ...patch }, { onConflict: 'owner_user_id' })
    .select('*')
    .single();
  if (error) throw error;
  return data as EstateInfo;
}

// ---------------------- Freigabeprozess (Estate Cases) ----------------------

export async function listEstateCases(familyId: string): Promise<EstateCase[]> {
  if (DEMO_MODE) return demoStore.listEstateCases(familyId);
  const { data, error } = await supabase
    .from('estate_cases')
    .select('*, confirmations:estate_confirmations(*)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as EstateCase[];
}

export async function getEstateCase(id: string): Promise<EstateCase | null> {
  if (DEMO_MODE) return demoStore.getEstateCase(id);
  const { data, error } = await supabase
    .from('estate_cases')
    .select('*, confirmations:estate_confirmations(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as EstateCase) ?? null;
}

export interface ReportDeathInput {
  familyId: string;
  subjectUserId: string;
  subjectPersonId: string | null;
  reportedByUserId: string | null;
  reportedByTrusteeId: string | null;
  reportedByName: string;
  note?: string | null;
}

export async function reportDeath(input: ReportDeathInput): Promise<EstateCase> {
  if (DEMO_MODE) return demoStore.reportDeath(input);
  const { data, error } = await supabase.rpc('report_death', input);
  if (error) throw error;
  return data as EstateCase;
}

export interface ConfirmInput {
  caseId: string;
  trusteeId: string | null;
  confirmerName: string;
  decision: 'confirm' | 'reject';
  note?: string | null;
}

export async function confirmEstateCase(input: ConfirmInput): Promise<EstateCase> {
  if (DEMO_MODE) return demoStore.confirmEstateCase(input);
  const { data, error } = await supabase.rpc('confirm_estate_case', input);
  if (error) throw error;
  return data as EstateCase;
}

export async function revokeEstateCase(caseId: string): Promise<EstateCase> {
  if (DEMO_MODE) return demoStore.revokeEstateCase(caseId);
  const { data, error } = await supabase
    .from('estate_cases')
    .update({ status: 'rejected', released_at: null })
    .eq('id', caseId)
    .select('*')
    .single();
  if (error) throw error;
  return data as EstateCase;
}
