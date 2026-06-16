import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import type {
  VaultEntry,
  LegacyItem,
  FarewellMessage,
} from '@/types/models';

// ------------------------------ Vault-Einträge ------------------------------

export async function listVaultEntries(ownerUserId: string): Promise<VaultEntry[]> {
  if (DEMO_MODE) return demoStore.listVaultEntries(ownerUserId);
  const { data, error } = await supabase
    .from('vault_entries')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as VaultEntry[];
}

export type VaultEntryInput = Partial<VaultEntry> & {
  id?: string;
  familyId: string;
  ownerUserId: string;
};

export async function saveVaultEntry(input: VaultEntryInput): Promise<VaultEntry> {
  if (DEMO_MODE) return demoStore.saveVaultEntry(input);
  const row = {
    family_id: input.familyId,
    owner_user_id: input.ownerUserId,
    category: input.category,
    title: input.title,
    description: input.description ?? null,
    location: input.location ?? null,
    contact_person: input.contact_person ?? null,
    contact_person_id: input.contact_person_id ?? null,
    has_document: input.has_document ?? false,
    release_audience: input.release_audience ?? 'trustees',
  };
  const query = input.id
    ? supabase.from('vault_entries').update(row).eq('id', input.id)
    : supabase.from('vault_entries').insert(row);
  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return data as VaultEntry;
}

export async function deleteVaultEntry(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteVaultEntry(id);
  const { error } = await supabase.from('vault_entries').delete().eq('id', id);
  if (error) throw error;
}

// ------------------------------ Vermächtnisse ------------------------------

export async function listLegacyItems(ownerUserId: string): Promise<LegacyItem[]> {
  if (DEMO_MODE) return demoStore.listLegacyItems(ownerUserId);
  const { data, error } = await supabase
    .from('legacy_items')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LegacyItem[];
}

export type LegacyItemInput = Partial<LegacyItem> & {
  id?: string;
  familyId: string;
  ownerUserId: string;
};

export async function saveLegacyItem(input: LegacyItemInput): Promise<LegacyItem> {
  if (DEMO_MODE) return demoStore.saveLegacyItem(input);
  const row = {
    family_id: input.familyId,
    owner_user_id: input.ownerUserId,
    kind: input.kind,
    title: input.title,
    content: input.content,
    for_audience: input.for_audience ?? 'inner',
  };
  const query = input.id
    ? supabase.from('legacy_items').update(row).eq('id', input.id)
    : supabase.from('legacy_items').insert(row);
  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return data as LegacyItem;
}

export async function deleteLegacyItem(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteLegacyItem(id);
  const { error } = await supabase.from('legacy_items').delete().eq('id', id);
  if (error) throw error;
}

// --------------------------- Abschiedsnachrichten ---------------------------

export async function listFarewellMessages(ownerUserId: string): Promise<FarewellMessage[]> {
  if (DEMO_MODE) return demoStore.listFarewellMessages(ownerUserId);
  const { data, error } = await supabase
    .from('farewell_messages')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FarewellMessage[];
}

export type FarewellMessageInput = Partial<FarewellMessage> & {
  id?: string;
  familyId: string;
  ownerUserId: string;
};

export async function saveFarewellMessage(input: FarewellMessageInput): Promise<FarewellMessage> {
  if (DEMO_MODE) return demoStore.saveFarewellMessage(input);
  const row = {
    family_id: input.familyId,
    owner_user_id: input.ownerUserId,
    kind: input.kind ?? 'text',
    title: input.title,
    recipient: input.recipient ?? 'inner',
    content: input.content ?? null,
    media_path: input.media_path ?? null,
  };
  const query = input.id
    ? supabase.from('farewell_messages').update(row).eq('id', input.id)
    : supabase.from('farewell_messages').insert(row);
  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return data as FarewellMessage;
}

export async function deleteFarewellMessage(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteFarewellMessage(id);
  const { error } = await supabase.from('farewell_messages').delete().eq('id', id);
  if (error) throw error;
}
