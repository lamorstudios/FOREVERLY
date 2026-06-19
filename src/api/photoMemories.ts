import { listPersons } from './persons';
import { listPhotos } from './media';
import { fullName } from '@/lib/format';

export interface PhotoMemoryGap {
  personId: string;
  personName: string;
  message: string;
  suggestion: 'photo' | 'memory' | 'audio';
}

/**
 * Foto-Erinnerungen: analysiert vorhandene Fotos und schlägt neue
 * Erinnerungen vor, wo wenig dokumentiert ist (keine erfundenen Aussagen).
 */
export async function getPhotoMemoryGaps(familyId: string): Promise<PhotoMemoryGap[]> {
  const [persons, photos] = await Promise.all([
    listPersons(familyId),
    listPhotos(familyId),
  ]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const gaps: PhotoMemoryGap[] = [];

  for (const p of persons) {
    if (p.death_date) continue; // Verstorbene ausnehmen
    const name = fullName(p.first_name, p.last_name);
    const personPhotos = photos.filter((ph) => ph.person_id === p.id);
    const thisYear = personPhotos.filter(
      (ph) => new Date(ph.created_at).getFullYear() === currentYear,
    ).length;

    const latest = personPhotos
      .map((ph) => new Date(ph.created_at).getTime())
      .sort((a, b) => b - a)[0];
    const monthsSince = latest
      ? Math.floor((now.getTime() - latest) / (1000 * 60 * 60 * 24 * 30))
      : null;

    if (personPhotos.length === 0) {
      gaps.push({
        personId: p.id,
        personName: name,
        message: `Von ${name} gibt es noch keine Fotos in der Familie.`,
        suggestion: 'photo',
      });
    } else if (monthsSince !== null && monthsSince >= 6) {
      gaps.push({
        personId: p.id,
        personName: name,
        message: `${name} wurde seit ${monthsSince} Monaten auf keinem Familienfoto markiert.`,
        suggestion: 'photo',
      });
    } else if (thisYear <= 4) {
      gaps.push({
        personId: p.id,
        personName: name,
        message: `Von ${name} ${thisYear === 0 ? 'existieren dieses Jahr noch keine Fotos' : `existieren dieses Jahr nur ${thisYear} Foto${thisYear > 1 ? 's' : ''}`}.`,
        suggestion: 'photo',
      });
    }
  }

  return gaps;
}
