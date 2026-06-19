import { supabase } from '@/lib/supabase';
import { uploadFile, makeFileName, getSignedUrl } from '@/lib/storage';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import { mimeForImage } from './profiles';
import { logActivity } from './activities';
import type { Audio, Photo } from '@/types/models';

// --- Fotos -----------------------------------------------------------

export async function listPhotos(
  familyId: string,
  opts?: { personId?: string; memoryId?: string },
): Promise<Photo[]> {
  if (DEMO_MODE) return demoStore.listPhotos(familyId, opts);
  let query = supabase
    .from('photos')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  if (opts?.personId) query = query.eq('person_id', opts.personId);
  if (opts?.memoryId) query = query.eq('memory_id', opts.memoryId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Photo[];
}

export async function uploadPhoto(input: {
  familyId: string;
  uploadedBy: string;
  localUri: string;
  caption?: string | null;
  personId?: string | null;
  memoryId?: string | null;
  width?: number | null;
  height?: number | null;
}): Promise<Photo> {
  if (DEMO_MODE) {
    const p = demoStore.uploadPhoto(input);
    demoStore.logActivity({
      familyId: input.familyId,
      actorId: input.uploadedBy,
      action: 'photo.uploaded',
      entityType: 'photo',
      entityId: p.id,
      summary: input.caption ?? 'Neues Foto',
    });
    return p;
  }
  const ext = input.localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${input.familyId}/gallery/${makeFileName(ext)}`;
  await uploadFile('photos', path, input.localUri, mimeForImage(ext));

  const { data, error } = await supabase
    .from('photos')
    .insert({
      family_id: input.familyId,
      uploaded_by: input.uploadedBy,
      storage_path: path,
      caption: input.caption ?? null,
      person_id: input.personId ?? null,
      memory_id: input.memoryId ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;

  await logActivity({
    familyId: input.familyId,
    actorId: input.uploadedBy,
    action: 'photo.uploaded',
    entityType: 'photo',
    entityId: (data as Photo).id,
    summary: input.caption ?? 'Neues Foto',
  });
  return data as Photo;
}

export async function deletePhoto(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deletePhoto(id);
  const { error } = await supabase.from('photos').delete().eq('id', id);
  if (error) throw error;
}

export function photoUrl(path: string) {
  return getSignedUrl('photos', path);
}

// --- Audios ----------------------------------------------------------

export async function listAudios(
  familyId: string,
  opts?: { personId?: string; memoryId?: string },
): Promise<Audio[]> {
  if (DEMO_MODE) return demoStore.listAudios(familyId, opts);
  let query = supabase
    .from('audios')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  if (opts?.personId) query = query.eq('person_id', opts.personId);
  if (opts?.memoryId) query = query.eq('memory_id', opts.memoryId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Audio[];
}

export async function uploadAudio(input: {
  familyId: string;
  recordedBy: string;
  localUri: string;
  title?: string | null;
  durationSeconds?: number | null;
  personId?: string | null;
  memoryId?: string | null;
  transcript?: string | null;
}): Promise<Audio> {
  if (DEMO_MODE) {
    const a = demoStore.uploadAudio(input);
    demoStore.logActivity({
      familyId: input.familyId,
      actorId: input.recordedBy,
      action: 'audio.created',
      entityType: 'audio',
      entityId: a.id,
      summary: input.title ?? 'Neue Audioaufnahme',
    });
    return a;
  }
  const ext = input.localUri.split('.').pop()?.toLowerCase() || 'm4a';
  const path = `${input.familyId}/audio/${makeFileName(ext)}`;
  await uploadFile('audios', path, input.localUri, mimeForAudio(ext));

  const { data, error } = await supabase
    .from('audios')
    .insert({
      family_id: input.familyId,
      recorded_by: input.recordedBy,
      storage_path: path,
      title: input.title ?? null,
      duration_seconds: input.durationSeconds ?? null,
      person_id: input.personId ?? null,
      memory_id: input.memoryId ?? null,
      transcript: input.transcript ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;

  await logActivity({
    familyId: input.familyId,
    actorId: input.recordedBy,
    action: 'audio.created',
    entityType: 'audio',
    entityId: (data as Audio).id,
    summary: input.title ?? 'Neue Audioaufnahme',
  });
  return data as Audio;
}

export async function deleteAudio(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteAudio(id);
  const { error } = await supabase.from('audios').delete().eq('id', id);
  if (error) throw error;
}

export function audioUrl(path: string) {
  return getSignedUrl('audios', path);
}

function mimeForAudio(ext: string): string {
  switch (ext.toLowerCase()) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'webm':
      return 'audio/webm';
    case 'aac':
      return 'audio/aac';
    default:
      return 'audio/m4a';
  }
}
