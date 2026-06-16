import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import { updatePerson } from './persons';
import type { PersonQuote, PersonTribute } from '@/types/models';

/**
 * Phase 16 · Ehrenmitglieder & Familienerbe.
 *
 * Funktionen rund um Gedenkprofile: Markierung als Familienerbe sowie Zitate
 * („Was sie oft gesagt hat") und Erinnerungen, die Familienmitglieder an die
 * Person hinterlassen. Die Galerie nutzt das bestehende Foto-System
 * (`api/media.ts`) mit Personen-Zuordnung und Uploader-Nachweis.
 */

/** Person als Familienerbe (Ehrenmitglied) markieren bzw. Markierung entfernen. */
export async function setMemorial(personId: string, value: boolean): Promise<void> {
  if (DEMO_MODE) {
    demoStore.setMemorial(personId, value);
    return;
  }
  await updatePerson(personId, { is_memorial: value });
}

/** Anzeigename zu einer Nutzer-ID (für „Hochgeladen von …" in der Galerie). */
export function uploaderName(userId: string | null): string {
  if (DEMO_MODE) return demoStore.displayNameForUser(userId);
  return 'Familienmitglied';
}

// --- Zitate -----------------------------------------------------------

export async function listQuotes(personId: string): Promise<PersonQuote[]> {
  if (DEMO_MODE) return demoStore.listQuotes(personId);
  const { data, error } = await supabase
    .from('person_quotes')
    .select('*')
    .eq('person_id', personId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PersonQuote[];
}

export async function addQuote(input: {
  familyId: string;
  personId: string;
  text: string;
  context?: string | null;
  addedByUserId: string | null;
  addedByName?: string;
}): Promise<PersonQuote> {
  if (DEMO_MODE) return demoStore.addQuote(input);
  const { data, error } = await supabase
    .from('person_quotes')
    .insert({
      family_id: input.familyId,
      person_id: input.personId,
      text: input.text,
      context: input.context ?? null,
      added_by_user_id: input.addedByUserId,
      added_by_name: input.addedByName ?? 'Familienmitglied',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as PersonQuote;
}

export async function deleteQuote(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteQuote(id);
  const { error } = await supabase.from('person_quotes').delete().eq('id', id);
  if (error) throw error;
}

// --- Erinnerungen an die Person --------------------------------------

export async function listTributes(personId: string): Promise<PersonTribute[]> {
  if (DEMO_MODE) return demoStore.listTributes(personId);
  const { data, error } = await supabase
    .from('person_tributes')
    .select('*')
    .eq('person_id', personId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PersonTribute[];
}

export async function addTribute(input: {
  familyId: string;
  personId: string;
  text: string;
  authorUserId: string | null;
  authorName?: string;
}): Promise<PersonTribute> {
  if (DEMO_MODE) return demoStore.addTribute(input);
  const { data, error } = await supabase
    .from('person_tributes')
    .insert({
      family_id: input.familyId,
      person_id: input.personId,
      text: input.text,
      author_user_id: input.authorUserId,
      author_name: input.authorName ?? 'Familienmitglied',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as PersonTribute;
}

export async function deleteTribute(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteTribute(id);
  const { error } = await supabase.from('person_tributes').delete().eq('id', id);
  if (error) throw error;
}
