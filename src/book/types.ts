import type { BookType } from '@/types/models';

/** Inhaltsbausteine einer Buchseite (renderbar + exportierbar). */
export type BookBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'photo'; path: string; caption?: string }
  | { type: 'photoGrid'; photos: { path: string; caption?: string }[] }
  | {
      type: 'person';
      personId: string;
      name: string;
      years?: string;
      bio?: string;
      avatarPath?: string | null;
    }
  | { type: 'timeline'; entries: { year: number; label: string }[] }
  | { type: 'audio'; title: string; personName?: string }
  | { type: 'note'; text: string };

export interface BookChapter {
  /** Stabiler Schlüssel (für Sortierung/Ausblenden). */
  key: string;
  title: string;
  blocks: BookBlock[];
  /** Standardmäßig ausgeblendet (z.B. weil leer). */
  defaultHidden?: boolean;
}

export interface FamilyBook {
  type: BookType;
  title: string;
  subtitle: string | null;
  coverPhotoPath: string | null;
  chapters: BookChapter[];
}

export const BOOK_TYPE_LABEL: Record<BookType, string> = {
  komplett: 'Familienbuch komplett',
  person: 'Buch über eine Person',
  oma_opa: 'Buch über Oma & Opa',
  jahr: 'Jahresbuch',
  erinnerungen: 'Erinnerungsbuch',
  lebensweisheiten: 'Lebensweisheiten-Buch',
};

export const BOOK_TYPE_DESCRIPTION: Record<BookType, string> = {
  komplett: 'Die ganze Geschichte eurer Familie in einem Band.',
  person: 'Ein liebevolles Porträt einer einzelnen Person.',
  oma_opa: 'Die Geschichte von Oma und Opa.',
  jahr: 'Ein besonderes Jahr im Rückblick.',
  erinnerungen: 'Alle Erinnerungen und Fotos gesammelt.',
  lebensweisheiten: 'Die schönsten Weisheiten eurer Familie.',
};
