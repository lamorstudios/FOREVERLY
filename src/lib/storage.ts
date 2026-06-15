import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import { DEMO_MODE } from './config';

export type BucketName = 'avatars' | 'photos' | 'audios';

/**
 * Lädt eine lokale Datei (file://) in einen Storage-Bucket hoch.
 * Verwendet base64 + ArrayBuffer, da Blob-Uploads in React Native
 * unzuverlässig sind.
 *
 * @returns Den Storage-Pfad (ohne Bucket-Präfix).
 */
export async function uploadFile(
  bucket: BucketName,
  path: string,
  localUri: string,
  contentType: string,
): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const arrayBuffer = decode(base64);

  const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  return path;
}

/**
 * Erzeugt eine signierte URL zum Anzeigen/Abspielen einer privaten Datei.
 * @param expiresInSeconds Gültigkeitsdauer (Standard 1 Stunde).
 */
export async function getSignedUrl(
  bucket: BucketName,
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  if (!path) return null;
  // Im Demo-Modus (oder bei bereits vollständigen URLs) den Pfad direkt liefern.
  if (DEMO_MODE || /^(https?:|data:|blob:|file:)/.test(path)) return path;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function deleteFile(bucket: BucketName, path: string): Promise<void> {
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
}

/** Eindeutiger Dateiname mit Endung. */
export function makeFileName(extension: string): string {
  const id =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return `${id}.${extension.replace(/^\./, '')}`;
}
