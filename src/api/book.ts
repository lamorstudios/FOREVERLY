import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';
import { demoStore } from '@/demo/store';
import { getFamily } from './families';
import { listPersons } from './persons';
import { listRelationships } from './persons';
import { listMemories } from './memories';
import { listPhotos, listAudios } from './media';
import { listMyCapsules } from './timeCapsules';
import { listCalendarEvents } from './calendar';
import { buildFamilyBook, applyProjectOverrides } from '@/book/generator';
import { buildPrintableHtml } from '@/book/print';
import type { FamilyData } from '@/historian/engine';
import type { FamilyBook } from '@/book/types';
import type {
  BookProject,
  BookType,
  BookOptions,
  BookExport,
  BookExportFormat,
} from '@/types/models';

async function gather(familyId: string): Promise<{ data: FamilyData; familyName: string }> {
  const [family, persons, relationships, memories, photos, audios, capsules, calendarEvents] =
    await Promise.all([
      getFamily(familyId),
      listPersons(familyId),
      listRelationships(familyId),
      listMemories(familyId),
      listPhotos(familyId),
      listAudios(familyId),
      listMyCapsules(familyId),
      listCalendarEvents(familyId),
    ]);
  return {
    familyName: family?.name ?? 'Familie',
    data: { persons, memories, photos, audios, capsules, calendarEvents, relationships },
  };
}

// --- Projekte ---------------------------------------------------------

export async function listBookProjects(familyId: string): Promise<BookProject[]> {
  if (DEMO_MODE) return demoStore.listBookProjects();
  const { data, error } = await supabase
    .from('book_projects')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as BookProject[];
}

export async function getBookProject(id: string): Promise<BookProject | null> {
  if (DEMO_MODE) return demoStore.getBookProject(id);
  const { data, error } = await supabase
    .from('book_projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as BookProject | null;
}

export async function createBookProject(input: {
  familyId: string;
  createdBy: string;
  type: BookType;
  options?: BookOptions;
}): Promise<BookProject> {
  const { data, familyName } = await gather(input.familyId);
  const generated = buildFamilyBook(familyName, data, input.type, input.options ?? {});

  if (DEMO_MODE) {
    return demoStore.createBookProject({
      familyId: input.familyId,
      type: input.type,
      title: generated.title,
      subtitle: generated.subtitle,
      coverPhotoPath: generated.coverPhotoPath,
      options: input.options ?? {},
      createdBy: input.createdBy,
    });
  }
  const { data: row, error } = await supabase
    .from('book_projects')
    .insert({
      family_id: input.familyId,
      type: input.type,
      title: generated.title,
      subtitle: generated.subtitle,
      cover_photo_path: generated.coverPhotoPath,
      options: input.options ?? {},
      status: 'ready',
      created_by: input.createdBy,
    })
    .select('*')
    .single();
  if (error) throw error;
  return row as BookProject;
}

export async function updateBookProject(
  id: string,
  patch: Partial<
    Pick<
      BookProject,
      'title' | 'subtitle' | 'cover_photo_path' | 'hidden_chapters' | 'chapter_order' | 'status'
    >
  >,
): Promise<BookProject> {
  if (DEMO_MODE) return demoStore.updateBookProject(id, patch);
  const { data, error } = await supabase
    .from('book_projects')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as BookProject;
}

export async function deleteBookProject(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteBookProject(id);
  const { error } = await supabase.from('book_projects').delete().eq('id', id);
  if (error) throw error;
}

// --- Generierung ------------------------------------------------------

/** Generiert das fertige Buch (Inhalt aus vorhandenen Daten + Projekt-Overrides). */
export async function generateBook(
  familyId: string,
  project: BookProject,
): Promise<FamilyBook> {
  const { data, familyName } = await gather(familyId);
  const base = buildFamilyBook(familyName, data, project.type, project.options ?? {});
  return applyProjectOverrides(base, {
    title: project.title,
    subtitle: project.subtitle,
    coverPhotoPath: project.cover_photo_path,
    hiddenChapters: project.hidden_chapters,
    chapterOrder: project.chapter_order,
  });
}

/**
 * Für die Vorschau/Bearbeitung: liefert ALLE Kapitel (geordnet, aber NICHT
 * ausgeblendet), damit ausgeblendete Kapitel wieder eingeblendet werden können.
 * `project.hidden_chapters` steuert die Anzeige im Editor.
 */
export async function getBookByProjectId(
  familyId: string,
  projectId: string,
): Promise<{ project: BookProject; book: FamilyBook } | null> {
  const project = await getBookProject(projectId);
  if (!project) return null;
  const { data, familyName } = await gather(familyId);
  const base = buildFamilyBook(familyName, data, project.type, project.options ?? {});
  const book = applyProjectOverrides(base, {
    title: project.title,
    subtitle: project.subtitle,
    coverPhotoPath: project.cover_photo_path,
    hiddenChapters: [], // im Editor alle Kapitel zeigen
    chapterOrder: project.chapter_order,
  });
  return { project, book };
}

// --- Export -----------------------------------------------------------

/**
 * Bereitet einen Export vor: erzeugt druckfertiges HTML, speichert eine
 * Version + den Exportstatus und gibt das HTML zurück. Der eigentliche
 * Druck/„PDF" erfolgt im Browser (window.print) bzw. wird simuliert.
 */
export async function exportBook(input: {
  familyId: string;
  projectId: string;
  format: BookExportFormat;
  createdBy: string;
}): Promise<{ html: string; book: FamilyBook; export: BookExport }> {
  const project = await getBookProject(input.projectId);
  if (!project) throw new Error('Buchprojekt nicht gefunden.');
  const book = await generateBook(input.familyId, project);
  const html = buildPrintableHtml(book);

  const exportRecord: BookExport = {
    id: `exp-${Date.now().toString(36)}`,
    project_id: input.projectId,
    format: input.format,
    status: 'ready',
    url: null,
    print_ready: input.format === 'print',
    created_at: new Date().toISOString(),
  };

  if (DEMO_MODE) {
    demoStore.updateBookProject(input.projectId, { status: 'exported' });
    return { html, book, export: exportRecord };
  }

  // Version-Snapshot + Exportstatus persistieren
  await supabase.from('book_versions').insert({
    project_id: input.projectId,
    snapshot: book as unknown as Record<string, unknown>,
    created_by: input.createdBy,
  });
  const { data, error } = await supabase
    .from('book_exports')
    .insert({
      project_id: input.projectId,
      format: input.format,
      status: 'ready',
      print_ready: input.format === 'print',
      created_by: input.createdBy,
    })
    .select('*')
    .single();
  if (error) throw error;
  await supabase.from('book_projects').update({ status: 'exported' }).eq('id', input.projectId);
  return { html, book, export: data as BookExport };
}
