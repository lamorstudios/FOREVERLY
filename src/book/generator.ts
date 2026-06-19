/**
 * Familienbuch-Generator – baut aus VORHANDENEN Familiendaten ein Buch.
 * Deterministisch, keine erfundenen Fakten. Inhalte stammen aus Profilen,
 * Erinnerungen, Fotos, Audios, freigegebenen Zeitkapseln, dem Kalender und
 * den Familienhistoriker-Zusammenfassungen (Biografien, Weisheiten, Timeline).
 */
import { fullName, formatDate } from '@/lib/format';
import {
  buildKnowledgeBase,
  extractWisdoms,
  buildTimeline,
  importantPeople,
  buildBiography,
  type FamilyData,
} from '@/historian/engine';
import type { Person, Memory } from '@/types/models';
import type { BookType, BookOptions } from '@/types/models';
import type { BookBlock, BookChapter, FamilyBook } from './types';

const KW = {
  reisen: ['urlaub', 'reise', 'reisen', 'italien', 'strand', 'see', 'meer', 'berge', 'ausflug', 'fahrt'],
  kindheit: ['kindheit', 'kind', 'geboren', 'einschulung', 'schule', 'schultag', 'klein'],
  jugend: ['jugend', 'ausbildung', 'studium', 'lehre', 'erste', 'jung'],
  liebe: ['liebe', 'hochzeit', 'heirat', 'verlobung', 'ehe', 'herz', 'familie'],
  ereignis: ['hochzeit', 'geburt', 'fest', 'jubiläum', 'jubilaum', 'weihnachten', 'taufe', 'einschulung', 'feier'],
};

function fold(s: string): string {
  return s.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');
}
function matches(text: string, words: string[]): boolean {
  const f = fold(text);
  return words.some((w) => f.includes(fold(w)));
}
function memText(m: Memory): string {
  return `${m.title} ${m.description ?? ''}`;
}
function personYears(p: Person): string {
  const b = p.birth_date ? new Date(p.birth_date).getFullYear() : null;
  const d = p.death_date ? new Date(p.death_date).getFullYear() : null;
  if (b && d) return `${b} – ${d}`;
  if (b) return `*${b}`;
  if (d) return `† ${d}`;
  return '';
}

export function buildFamilyBook(
  familyName: string,
  data: FamilyData,
  type: BookType,
  options: BookOptions,
): FamilyBook {
  const kb = buildKnowledgeBase(data);
  const wisdoms = extractWisdoms(kb);
  const timeline = buildTimeline(kb);
  const personById = new Map(data.persons.map((p) => [p.id, p]));
  const nameOf = (id?: string | null) =>
    id && personById.has(id)
      ? fullName(personById.get(id)!.first_name, personById.get(id)!.last_name)
      : '';

  const coverPhotoPath = data.photos[0]?.storage_path ?? null;
  const openedCapsules = data.capsules.filter((c) => c.is_opened);

  // --- gemeinsame Bausteine ---
  const photoGrid = (photos = data.photos): BookChapter => ({
    key: 'fotogalerie',
    title: 'Fotogalerie',
    blocks: photos.length
      ? [{ type: 'photoGrid', photos: photos.map((p) => ({ path: p.storage_path, caption: p.caption ?? undefined })) }]
      : [{ type: 'note', text: 'Noch keine Fotos vorhanden.' }],
    defaultHidden: photos.length === 0,
  });

  const memoriesChapter = (mems = data.memories, key = 'erinnerungen', title = 'Erinnerungen der Familie'): BookChapter => ({
    key,
    title,
    blocks: mems.length
      ? mems.flatMap((m): BookBlock[] => {
          const blocks: BookBlock[] = [{ type: 'paragraph', text: `${m.title}${m.occurred_on ? ` (${formatDate(m.occurred_on)})` : ''}${m.description ? ` – ${m.description}` : ''}` }];
          const photo = data.photos.find((p) => p.memory_id === m.id);
          if (photo) blocks.push({ type: 'photo', path: photo.storage_path, caption: photo.caption ?? undefined });
          return blocks;
        })
      : [{ type: 'note', text: 'Noch keine Erinnerungen vorhanden.' }],
    defaultHidden: mems.length === 0,
  });

  const wisdomsChapter = (entries = wisdoms): BookChapter => ({
    key: 'lebensweisheiten',
    title: 'Lebensweisheiten',
    blocks: entries.length
      ? entries.map((w): BookBlock => ({ type: 'quote', text: w.text, attribution: nameOf(w.source.personId) || w.source.label }))
      : [{ type: 'note', text: 'Noch keine Lebensweisheiten gesammelt.' }],
    defaultHidden: entries.length === 0,
  });

  const capsulesChapter = (): BookChapter => ({
    key: 'zeitkapseln',
    title: 'Zeitkapseln',
    blocks: openedCapsules.length
      ? openedCapsules.flatMap((c): BookBlock[] => [
          { type: 'paragraph', text: c.title },
          { type: 'quote', text: c.text_content ?? c.description ?? '' },
        ])
      : [{ type: 'note', text: 'Es wurden noch keine Zeitkapseln geöffnet.' }],
    defaultHidden: openedCapsules.length === 0,
  });

  const personChapter = (p: Person, key: string): BookChapter => {
    const blocks: BookBlock[] = [
      { type: 'person', personId: p.id, name: fullName(p.first_name, p.last_name), years: personYears(p), bio: buildBiography(kb, p), avatarPath: p.avatar_url },
    ];
    const mems = data.memories.filter((m) => m.person_id === p.id);
    mems.forEach((m) => blocks.push({ type: 'paragraph', text: `${m.title}${m.description ? ` – ${m.description}` : ''}` }));
    const photos = data.photos.filter((ph) => ph.person_id === p.id);
    if (photos.length) blocks.push({ type: 'photoGrid', photos: photos.map((ph) => ({ path: ph.storage_path, caption: ph.caption ?? undefined })) });
    data.audios.filter((a) => a.person_id === p.id).forEach((a) => blocks.push({ type: 'audio', title: a.title ?? 'Audioaufnahme', personName: fullName(p.first_name, p.last_name) }));
    return { key, title: fullName(p.first_name, p.last_name), blocks };
  };

  const foreword = (text: string): BookChapter => {
    const topWisdom = wisdoms[0];
    const blocks: BookBlock[] = [{ type: 'paragraph', text }];
    if (topWisdom) blocks.push({ type: 'quote', text: topWisdom.text, attribution: nameOf(topWisdom.source.personId) || topWisdom.source.label });
    return { key: 'vorwort', title: 'Vorwort', blocks };
  };

  const familyTree = (): BookChapter => ({
    key: 'familienbaum',
    title: 'Familienbaum',
    blocks: data.persons.length
      ? data.persons.map((p): BookBlock => ({ type: 'person', personId: p.id, name: fullName(p.first_name, p.last_name), years: personYears(p), bio: buildBiography(kb, p), avatarPath: p.avatar_url }))
      : [{ type: 'note', text: 'Noch keine Personen im Familiennetzwerk.' }],
  });

  const filterMems = (words: string[]) => data.memories.filter((m) => matches(memText(m), words));

  const themedChapter = (key: string, title: string, words: string[]): BookChapter => {
    const mems = filterMems(words);
    return {
      key,
      title,
      blocks: mems.length
        ? mems.flatMap((m): BookBlock[] => {
            const out: BookBlock[] = [{ type: 'paragraph', text: `${m.title}${m.description ? ` – ${m.description}` : ''}` }];
            const photo = data.photos.find((p) => p.memory_id === m.id);
            if (photo) out.push({ type: 'photo', path: photo.storage_path, caption: photo.caption ?? undefined });
            return out;
          })
        : [{ type: 'note', text: 'Für dieses Kapitel liegen noch keine Inhalte vor.' }],
      defaultHidden: mems.length === 0,
    };
  };

  // --- Buchtypen ---
  if (type === 'person' && options.personId) {
    const p = personById.get(options.personId);
    const name = p ? fullName(p.first_name, p.last_name) : 'Person';
    return {
      type,
      title: name,
      subtitle: 'Ein Porträt',
      coverPhotoPath: (p && data.photos.find((ph) => ph.person_id === p.id)?.storage_path) ?? coverPhotoPath,
      chapters: p
        ? [
            foreword(`Dieses Buch erzählt die Geschichte von ${name}.`),
            personChapter(p, 'portraet'),
            wisdomsChapter(wisdoms.filter((w) => w.source.personId === p.id)),
          ]
        : [foreword('Diese Person wurde nicht gefunden.')],
    };
  }

  if (type === 'oma_opa') {
    const grandIds = new Set(
      data.relationships.filter((r) => r.type === 'oma' || r.type === 'opa').map((r) => r.to_person_id),
    );
    let grands = data.persons.filter((p) => grandIds.has(p.id));
    if (grands.length === 0) {
      grands = [...data.persons].filter((p) => p.birth_date).sort((a, b) => (a.birth_date! < b.birth_date! ? -1 : 1)).slice(0, 2);
    }
    return {
      type,
      title: 'Oma & Opa',
      subtitle: 'Ihre Geschichte',
      coverPhotoPath,
      chapters: [
        foreword('Dieses Buch ist Oma und Opa gewidmet – mit Dankbarkeit für alles, was sie der Familie geschenkt haben.'),
        ...grands.map((p, i) => personChapter(p, `grand-${i}`)),
        wisdomsChapter(wisdoms.filter((w) => grands.some((g) => g.id === w.source.personId))),
        photoGrid(data.photos.filter((ph) => grands.some((g) => g.id === ph.person_id))),
      ],
    };
  }

  if (type === 'jahr') {
    const year = options.year ?? new Date().getFullYear();
    const yMems = data.memories.filter((m) => (m.occurred_on ?? m.created_at).startsWith(String(year)));
    const yPhotos = data.photos.filter((p) => p.created_at.startsWith(String(year)));
    return {
      type,
      title: `Jahresbuch ${year}`,
      subtitle: familyName,
      coverPhotoPath: yPhotos[0]?.storage_path ?? coverPhotoPath,
      chapters: [
        foreword(`Ein Rückblick auf das Jahr ${year} der ${familyName}.`),
        memoriesChapter(yMems, 'erinnerungen', `Erinnerungen ${year}`),
        photoGrid(yPhotos),
      ],
    };
  }

  if (type === 'erinnerungen') {
    return {
      type,
      title: 'Unsere Erinnerungen',
      subtitle: familyName,
      coverPhotoPath,
      chapters: [
        foreword(`Eine Sammlung der schönsten Erinnerungen der ${familyName}.`),
        memoriesChapter(),
        photoGrid(),
      ],
    };
  }

  if (type === 'lebensweisheiten') {
    return {
      type,
      title: 'Lebensweisheiten',
      subtitle: familyName,
      coverPhotoPath,
      chapters: [
        foreword('Die Worte, die in unserer Familie weitergegeben werden.'),
        wisdomsChapter(),
      ],
    };
  }

  // komplett (Standard)
  return {
    type: 'komplett',
    title: `Die Geschichte der ${familyName}`,
    subtitle: 'Ein Familienbuch',
    coverPhotoPath,
    chapters: [
      foreword(
        `Dies ist die Geschichte der ${familyName}. Sie versammelt ${data.persons.length} Personen, ` +
          `${data.memories.length} Erinnerungen, ${data.photos.length} Fotos und ${data.audios.length} Audioaufnahmen – ` +
          `bewahrt für kommende Generationen.`,
      ),
      familyTree(),
      themedChapter('kindheit', 'Kindheit', KW.kindheit),
      themedChapter('jugend', 'Jugend', KW.jugend),
      themedChapter('liebe_familie', 'Liebe & Familie', KW.liebe),
      themedChapter('reisen', 'Reisen', KW.reisen),
      themedChapter('ereignisse', 'Besondere Ereignisse', KW.ereignis),
      wisdomsChapter(),
      { key: 'zeitleiste', title: 'Zeitleiste', blocks: timeline.length ? [{ type: 'timeline', entries: timeline.map((t) => ({ year: t.year, label: t.label })) }] : [{ type: 'note', text: 'Noch keine datierten Ereignisse.' }], defaultHidden: timeline.length === 0 },
      photoGrid(),
      memoriesChapter(),
      capsulesChapter(),
    ],
  };
}

/** Wendet Projekt-Einstellungen (Titel, Untertitel, Cover, Reihenfolge, Ausblenden) auf ein generiertes Buch an. */
export function applyProjectOverrides(
  book: FamilyBook,
  overrides: {
    title?: string;
    subtitle?: string | null;
    coverPhotoPath?: string | null;
    hiddenChapters: string[];
    chapterOrder: string[];
  },
): FamilyBook {
  let chapters = book.chapters.filter((c) => !overrides.hiddenChapters.includes(c.key));
  if (overrides.chapterOrder.length) {
    const index = new Map(overrides.chapterOrder.map((k, i) => [k, i]));
    chapters = [...chapters].sort(
      (a, b) => (index.get(a.key) ?? 999) - (index.get(b.key) ?? 999),
    );
  }
  return {
    ...book,
    title: overrides.title ?? book.title,
    subtitle: overrides.subtitle !== undefined ? overrides.subtitle : book.subtitle,
    coverPhotoPath: overrides.coverPhotoPath !== undefined ? overrides.coverPhotoPath : book.coverPhotoPath,
    chapters,
  };
}
