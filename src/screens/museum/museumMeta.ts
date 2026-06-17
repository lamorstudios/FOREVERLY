import { Ionicons } from '@expo/vector-icons';
import type { ArtifactCategory } from '@/types/models';

type IoniconName = keyof typeof Ionicons.glyphMap;

export const ARTIFACT_META: Record<ArtifactCategory, { label: string; icon: IoniconName }> = {
  fotoalbum: { label: 'Fotoalbum', icon: 'images-outline' },
  schmuck: { label: 'Schmuckstück', icon: 'diamond-outline' },
  uhr: { label: 'Uhr', icon: 'watch-outline' },
  erbstueck: { label: 'Erbstück', icon: 'ribbon-outline' },
  fahrzeug: { label: 'Fahrzeug', icon: 'car-outline' },
  unternehmen: { label: 'Familienunternehmen', icon: 'business-outline' },
  haus: { label: 'Familienhaus', icon: 'home-outline' },
  sonstige: { label: 'Sonstiges Objekt', icon: 'cube-outline' },
};

export const ARTIFACT_ORDER: ArtifactCategory[] = [
  'fotoalbum', 'schmuck', 'uhr', 'erbstueck', 'fahrzeug', 'unternehmen', 'haus', 'sonstige',
];
