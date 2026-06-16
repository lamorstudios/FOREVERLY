import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import type {
  LiveShare,
  LiveStatus,
  ShareDuration,
  SafetyAudience,
  SafetyTrip,
  SafetyTripKind,
  SafetyAlert,
} from '@/types/models';

// ----------------------------- Live-Standort -----------------------------

export async function getMyLiveShare(userId: string): Promise<LiveShare | null> {
  if (DEMO_MODE) return demoStore.getMyLiveShare(userId);
  const { data, error } = await supabase.from('live_shares').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return (data as LiveShare) ?? null;
}

export async function listLiveShares(familyId: string): Promise<LiveShare[]> {
  if (DEMO_MODE) return demoStore.listLiveShares(familyId);
  const { data, error } = await supabase
    .from('live_shares')
    .select('*, person:persons(*)')
    .eq('family_id', familyId)
    .eq('active', true);
  if (error) throw error;
  return (data ?? []) as LiveShare[];
}

export interface LiveShareInput {
  familyId: string;
  userId: string;
  personId: string | null;
  status: LiveStatus;
  statusLabel?: string | null;
  placeLabel?: string | null;
  battery?: number | null;
  audience: SafetyAudience;
  recipientPersonIds?: string[];
  duration: ShareDuration;
  expiresAt?: string | null;
}

export async function setLiveShare(input: LiveShareInput): Promise<LiveShare> {
  if (DEMO_MODE) return demoStore.setLiveShare(input);
  const { data, error } = await supabase
    .from('live_shares')
    .upsert(
      {
        family_id: input.familyId,
        user_id: input.userId,
        person_id: input.personId,
        active: input.duration !== 'off',
        status: input.status,
        status_label: input.statusLabel ?? null,
        place_label: input.placeLabel ?? null,
        battery: input.battery ?? null,
        audience: input.audience,
        recipient_person_ids: input.recipientPersonIds ?? [],
        duration: input.duration,
        expires_at: input.expiresAt ?? null,
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data as LiveShare;
}

export async function stopLiveShare(userId: string): Promise<void> {
  if (DEMO_MODE) return demoStore.stopLiveShare(userId);
  const { error } = await supabase.from('live_shares').update({ active: false, duration: 'off' }).eq('user_id', userId);
  if (error) throw error;
}

// ------------------------- Heimweg / Sicher angekommen -------------------------

export async function listSafetyTrips(familyId: string): Promise<SafetyTrip[]> {
  if (DEMO_MODE) return demoStore.listSafetyTrips(familyId);
  const { data, error } = await supabase
    .from('safety_trips')
    .select('*, person:persons(*)')
    .eq('family_id', familyId)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SafetyTrip[];
}

export async function getSafetyTrip(id: string): Promise<SafetyTrip | null> {
  if (DEMO_MODE) return demoStore.getSafetyTrip(id);
  const { data, error } = await supabase.from('safety_trips').select('*, person:persons(*)').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as SafetyTrip) ?? null;
}

export interface StartTripInput {
  familyId: string;
  userId: string;
  personId: string | null;
  kind: SafetyTripKind;
  destinationLabel: string;
  eta?: string | null;
  audience: SafetyAudience;
  recipientPersonIds?: string[];
  battery?: number | null;
}

export async function startTrip(input: StartTripInput): Promise<SafetyTrip> {
  if (DEMO_MODE) return demoStore.startTrip(input);
  const { data, error } = await supabase
    .from('safety_trips')
    .insert({
      family_id: input.familyId,
      user_id: input.userId,
      person_id: input.personId,
      kind: input.kind,
      destination_label: input.destinationLabel,
      eta: input.eta ?? null,
      status: 'active',
      audience: input.audience,
      recipient_person_ids: input.recipientPersonIds ?? [],
      battery: input.battery ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as SafetyTrip;
}

export async function arriveTrip(id: string): Promise<SafetyTrip> {
  if (DEMO_MODE) return demoStore.arriveTrip(id);
  const { data, error } = await supabase
    .from('safety_trips')
    .update({ status: 'arrived', arrived_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as SafetyTrip;
}

export async function cancelTrip(id: string): Promise<SafetyTrip> {
  if (DEMO_MODE) return demoStore.cancelTrip(id);
  const { data, error } = await supabase
    .from('safety_trips')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as SafetyTrip;
}

// --------------------------------- SOS ---------------------------------

export async function listSafetyAlerts(familyId: string): Promise<SafetyAlert[]> {
  if (DEMO_MODE) return demoStore.listSafetyAlerts(familyId);
  const { data, error } = await supabase
    .from('safety_alerts')
    .select('*, person:persons(*)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SafetyAlert[];
}

export interface SosInput {
  familyId: string;
  userId: string;
  personId: string | null;
  message?: string | null;
  placeLabel?: string | null;
  battery?: number | null;
}

export async function triggerSos(input: SosInput): Promise<SafetyAlert> {
  if (DEMO_MODE) return demoStore.triggerSos(input);
  const { data, error } = await supabase
    .from('safety_alerts')
    .insert({
      family_id: input.familyId,
      user_id: input.userId,
      person_id: input.personId,
      message: input.message ?? null,
      place_label: input.placeLabel ?? null,
      battery: input.battery ?? null,
      status: 'active',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as SafetyAlert;
}

export async function resolveSos(id: string): Promise<SafetyAlert> {
  if (DEMO_MODE) return demoStore.resolveSos(id);
  const { data, error } = await supabase
    .from('safety_alerts')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as SafetyAlert;
}
