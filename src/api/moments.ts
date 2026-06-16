import { supabase } from '@/lib/supabase';
import { uploadFile, makeFileName, getSignedUrl } from '@/lib/storage';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import { mimeForImage } from './profiles';
import type { Moment, MomentComment, MomentKind, VisibilityLevel } from '@/types/models';

export async function listMoments(
  familyId: string,
  opts?: { eventId?: string | null; feedOnly?: boolean },
): Promise<Moment[]> {
  if (DEMO_MODE) return demoStore.listMoments(opts);
  let query = supabase
    .from('moments')
    .select('*, author:profiles!moments_author_user_id_fkey(*), moment_comments(count)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  if (opts?.eventId) query = query.eq('event_id', opts.eventId);
  else if (opts?.feedOnly) query = query.is('event_id', null);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as never[]).map((row) => {
    const r = row as Moment & { moment_comments?: { count: number }[] };
    return { ...r, comment_count: r.moment_comments?.[0]?.count ?? 0 };
  });
}

export async function getMoment(id: string): Promise<Moment | null> {
  if (DEMO_MODE) return demoStore.getMoment(id);
  const { data, error } = await supabase
    .from('moments')
    .select('*, author:profiles!moments_author_user_id_fkey(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Moment | null;
}

export interface MomentInput {
  familyId: string;
  authorUserId: string;
  kind: MomentKind;
  text?: string | null;
  localUri?: string | null;
  durationSeconds?: number | null;
  visibility?: VisibilityLevel;
  eventId?: string | null;
}

export async function createMoment(input: MomentInput): Promise<Moment> {
  if (DEMO_MODE) {
    return demoStore.createMoment({
      familyId: input.familyId,
      authorUserId: input.authorUserId,
      kind: input.kind,
      text: input.text ?? null,
      storagePath: input.localUri ?? null, // im Demo direkt anzeigbare URL
      durationSeconds: input.durationSeconds ?? null,
      visibility: input.visibility,
      eventId: input.eventId ?? null,
    });
  }

  let storagePath: string | null = null;
  if (input.localUri && (input.kind === 'photo' || input.kind === 'video' || input.kind === 'audio')) {
    const bucket = input.kind === 'audio' ? 'audios' : 'photos';
    const ext = input.localUri.split('.').pop()?.toLowerCase() || (input.kind === 'audio' ? 'm4a' : 'jpg');
    const path = `${input.familyId}/moments/${makeFileName(ext)}`;
    const contentType = input.kind === 'audio' ? 'audio/m4a' : mimeForImage(ext);
    await uploadFile(bucket, path, input.localUri, contentType);
    storagePath = path;
  }

  const { data, error } = await supabase
    .from('moments')
    .insert({
      family_id: input.familyId,
      author_user_id: input.authorUserId,
      kind: input.kind,
      text: input.text ?? null,
      storage_path: storagePath,
      duration_seconds: input.durationSeconds ?? null,
      visibility: input.visibility ?? 'family',
      event_id: input.eventId ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Moment;
}

export async function deleteMoment(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteMoment(id);
  const { error } = await supabase.from('moments').delete().eq('id', id);
  if (error) throw error;
}

export async function listMomentComments(momentId: string): Promise<MomentComment[]> {
  if (DEMO_MODE) return demoStore.listMomentComments(momentId);
  const { data, error } = await supabase
    .from('moment_comments')
    .select('*, author:profiles!moment_comments_author_user_id_fkey(*)')
    .eq('moment_id', momentId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as MomentComment[];
}

export async function addMomentComment(
  momentId: string,
  authorUserId: string,
  text: string,
): Promise<MomentComment> {
  if (DEMO_MODE) return demoStore.addMomentComment(momentId, authorUserId, text);
  const { data, error } = await supabase
    .from('moment_comments')
    .insert({ moment_id: momentId, author_user_id: authorUserId, text })
    .select('*')
    .single();
  if (error) throw error;
  return data as MomentComment;
}

/** Bild/Audio eines Moments als anzeigbare URL. */
export function momentMediaUrl(m: Moment) {
  if (!m.storage_path) return Promise.resolve(null);
  const bucket = m.kind === 'audio' ? 'audios' : 'photos';
  return getSignedUrl(bucket, m.storage_path);
}
