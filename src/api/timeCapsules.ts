import { supabase } from '@/lib/supabase';
import { uploadFile, makeFileName, getSignedUrl } from '@/lib/storage';
import { mimeForImage } from './profiles';
import { logActivity } from './activities';
import type {
  ContentType,
  TimeCapsule,
  UpcomingCapsule,
} from '@/types/models';

export interface CapsuleRecipientInput {
  personId?: string | null;
  userId?: string | null;
}

export interface CreateCapsuleInput {
  familyId: string;
  creatorId: string;
  title: string;
  description?: string | null;
  contentType: ContentType;
  textContent?: string | null;
  /** Lokale Datei (Foto/Audio), falls contentType media ist. */
  mediaUri?: string | null;
  openAt: string; // ISO
  recipients: CapsuleRecipientInput[];
}

/** Zeitkapseln, die der Nutzer erstellt hat (für Verwaltung). */
export async function listMyCapsules(
  familyId: string,
): Promise<TimeCapsule[]> {
  const { data, error } = await supabase
    .from('time_capsules')
    .select('*')
    .eq('family_id', familyId)
    .order('open_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as TimeCapsule[];
}

/** Anstehende (gesperrte) Kapseln für mich – nur Metadaten (DB-Funktion). */
export async function listUpcomingForMe(): Promise<UpcomingCapsule[]> {
  const { data, error } = await supabase.rpc('upcoming_capsules_for_me');
  if (error) throw error;
  return (data ?? []) as UpcomingCapsule[];
}

export async function getCapsule(id: string): Promise<TimeCapsule | null> {
  const { data, error } = await supabase
    .from('time_capsules')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as TimeCapsule | null;
}

export async function createCapsule(
  input: CreateCapsuleInput,
): Promise<TimeCapsule> {
  let storagePath: string | null = null;

  if (input.mediaUri && input.contentType !== 'text') {
    const bucket = input.contentType === 'photo' ? 'photos' : 'audios';
    const ext =
      input.mediaUri.split('.').pop()?.toLowerCase() ||
      (input.contentType === 'photo' ? 'jpg' : 'm4a');
    const path = `${input.familyId}/capsules/${makeFileName(ext)}`;
    const contentType =
      input.contentType === 'photo' ? mimeForImage(ext) : 'audio/m4a';
    await uploadFile(bucket, path, input.mediaUri, contentType);
    storagePath = path;
  }

  const { data, error } = await supabase
    .from('time_capsules')
    .insert({
      family_id: input.familyId,
      creator_id: input.creatorId,
      title: input.title,
      description: input.description ?? null,
      content_type: input.contentType,
      text_content: input.textContent ?? null,
      storage_path: storagePath,
      open_at: input.openAt,
    })
    .select('*')
    .single();
  if (error) throw error;
  const capsule = data as TimeCapsule;

  const recipients = input.recipients
    .filter((r) => r.personId || r.userId)
    .map((r) => ({
      capsule_id: capsule.id,
      person_id: r.personId ?? null,
      user_id: r.userId ?? null,
    }));
  if (recipients.length > 0) {
    const { error: recError } = await supabase
      .from('time_capsule_recipients')
      .insert(recipients);
    if (recError) throw recError;
  }

  await logActivity({
    familyId: input.familyId,
    actorId: input.creatorId,
    action: 'time_capsule.created',
    entityType: 'time_capsule',
    entityId: capsule.id,
    summary: capsule.title,
  });
  return capsule;
}

export async function deleteCapsule(id: string): Promise<void> {
  const { error } = await supabase
    .from('time_capsules')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/** Bucket für den Medieninhalt einer Kapsel. */
export function capsuleMediaUrl(capsule: TimeCapsule) {
  if (!capsule.storage_path) return Promise.resolve(null);
  const bucket = capsule.content_type === 'photo' ? 'photos' : 'audios';
  return getSignedUrl(bucket, capsule.storage_path);
}
