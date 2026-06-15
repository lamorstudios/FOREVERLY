import { supabase } from '@/lib/supabase';
import { uploadFile, makeFileName } from '@/lib/storage';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import type { Profile } from '@/types/models';

export async function getProfile(userId: string): Promise<Profile | null> {
  if (DEMO_MODE) return demoStore.getProfile(userId);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export interface UpdateProfileInput {
  full_name?: string;
  bio?: string | null;
  avatar_url?: string | null;
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<Profile> {
  if (DEMO_MODE) return demoStore.updateProfile(userId, input);
  const { data, error } = await supabase
    .from('profiles')
    .update(input)
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Profile;
}

/** Lädt ein Profilbild hoch und gibt den Storage-Pfad zurück. */
export async function uploadAvatar(
  userId: string,
  localUri: string,
): Promise<string> {
  if (DEMO_MODE) return localUri;
  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${makeFileName(ext)}`;
  return uploadFile('avatars', path, localUri, mimeForImage(ext));
}

export function mimeForImage(ext: string): string {
  switch (ext.toLowerCase()) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    default:
      return 'image/jpeg';
  }
}
