import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import { getPerson, updatePerson } from './persons';
import { listMemories } from './memories';
import { listPhotos, listAudios } from './media';
import { fullName } from '@/lib/format';
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

/** Profilbild zu einer Nutzer-ID (für Autor-Avatare in der Erinnerungs-Chronik). */
export function authorAvatar(userId: string | null): string | null {
  if (DEMO_MODE) return demoStore.avatarForUser(userId);
  return null;
}

/** Alle Zitate einer Familie (für Familienbuch & Historiker). */
export async function listFamilyQuotes(familyId: string): Promise<PersonQuote[]> {
  if (DEMO_MODE) return demoStore.listFamilyQuotes(familyId);
  const { data, error } = await supabase.from('person_quotes').select('*').eq('family_id', familyId);
  if (error) throw error;
  return (data ?? []) as PersonQuote[];
}

/** Alle Erinnerungen (Tributes) einer Familie (für Familienbuch & Historiker). */
export async function listFamilyTributes(familyId: string): Promise<PersonTribute[]> {
  if (DEMO_MODE) return demoStore.listFamilyTributes(familyId);
  const { data, error } = await supabase.from('person_tributes').select('*').eq('family_id', familyId);
  if (error) throw error;
  return (data ?? []) as PersonTribute[];
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

// --- Familienhistoriker: Lebensgeschichte aus gemeinsamen Erinnerungen ------

export interface MemorialStory {
  name: string;
  /** „Basierend auf N Erinnerungen … entstand folgende Geschichte über …" */
  intro: string;
  /** Zusammenhängende Lebensgeschichte (aus echten Beiträgen zusammengestellt). */
  paragraphs: string[];
  /** Familienchronik (chronologische Eckpunkte). */
  chronicle: { year: number; label: string }[];
  /** Zusammenfassung wichtiger Ereignisse / Kennzahlen. */
  summary: string[];
  counts: { tributes: number; quotes: number; memories: number; photos: number; audios: number; total: number };
}

/**
 * Stellt aus ALLEN gemeinsamen Beiträgen zu einem Ehrenmitglied eine
 * Lebensgeschichte, Familienchronik und Zusammenfassung zusammen.
 *
 * Es wird nichts erfunden: Der Text basiert ausschließlich auf vorhandenen
 * Biografie-, Erinnerungs-, Zitat-, Foto- und Audio-Beiträgen der Familie.
 */
export async function generateMemorialStory(
  familyId: string,
  personId: string,
): Promise<MemorialStory | null> {
  const [person, tributes, quotes, memories, photos, audios] = await Promise.all([
    getPerson(personId),
    listTributes(personId),
    listQuotes(personId),
    listMemories(familyId, personId),
    listPhotos(familyId, { personId }),
    listAudios(familyId, { personId }),
  ]);
  if (!person) return null;

  const name = fullName(person.first_name, person.last_name);
  const total = tributes.length + quotes.length + memories.length + photos.length + audios.length;

  const intro = `Basierend auf ${total} ${total === 1 ? 'Beitrag' : 'Erinnerungen, Geschichten und Beiträgen'} der Familie entstand folgende Geschichte über ${name}.`;

  const paragraphs: string[] = [];
  if (person.biography) paragraphs.push(person.biography);
  if (person.traits) paragraphs.push(person.traits);

  if (tributes.length) {
    const voices = tributes.slice(0, 3).map((t) => `${t.author_name} erinnert sich: „${t.text}"`);
    paragraphs.push(`So bleibt ${person.first_name} in der Familie lebendig. ${voices.join(' ')}`);
  }
  if (quotes.length) {
    const sayings = quotes.slice(0, 3).map((q) => `„${q.text}"`);
    paragraphs.push(`${person.first_name} wird auch durch wiederkehrende Worte erinnert: ${sayings.join(', ')}.`);
  }
  if (memories.length) {
    const events = memories.slice(0, 4).map((m) => m.title);
    paragraphs.push(`Wichtige gemeinsame Erinnerungen: ${events.join('; ')}.`);
  }
  if (paragraphs.length === 0) {
    paragraphs.push(`Über ${name} sind noch keine Beiträge vorhanden. Fügt erste Erinnerungen, Fotos oder Zitate hinzu, damit die Familiengeschichte erhalten bleibt.`);
  }

  // Chronik: Geburt → datierte Erinnerungen → Abschied.
  const chronicle: { year: number; label: string }[] = [];
  if (person.birth_date) chronicle.push({ year: new Date(person.birth_date).getFullYear(), label: `Geboren${person.birth_place ? ` in ${person.birth_place}` : ''}` });
  for (const m of memories) {
    if (m.occurred_on) chronicle.push({ year: new Date(m.occurred_on).getFullYear(), label: m.title });
  }
  if (person.death_date) chronicle.push({ year: new Date(person.death_date).getFullYear(), label: 'In liebevoller Erinnerung' });
  chronicle.sort((a, b) => a.year - b.year);

  const summary: string[] = [
    `${total} gemeinsame Beiträge der Familie`,
    `${tributes.length} Erinnerungen · ${quotes.length} Zitate · ${memories.length} Momente`,
    `${photos.length} Fotos · ${audios.length} Sprachaufnahmen`,
  ];
  if (quotes[0]) summary.push(`Bekanntester Satz: „${quotes[0].text}"`);

  return {
    name,
    intro,
    paragraphs,
    chronicle,
    summary,
    counts: { tributes: tributes.length, quotes: quotes.length, memories: memories.length, photos: photos.length, audios: audios.length, total },
  };
}
