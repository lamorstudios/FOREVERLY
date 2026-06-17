import { Ionicons } from '@expo/vector-icons';
import type { TrustedRole } from '@/types/models';

export interface TrustedRoleMeta {
  role: TrustedRole;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const TRUSTED_ROLES: Record<TrustedRole, TrustedRoleMeta> = {
  nachbar: { role: 'nachbar', label: 'Nachbar', icon: 'home-outline' },
  freund: { role: 'freund', label: 'Freund', icon: 'happy-outline' },
  hausmeister: { role: 'hausmeister', label: 'Hausmeister', icon: 'construct-outline' },
  pflegekontakt: { role: 'pflegekontakt', label: 'Pflegekontakt', icon: 'medkit-outline' },
  vereinsfreund: { role: 'vereinsfreund', label: 'Vereinsfreund', icon: 'people-outline' },
  hausarzt: { role: 'hausarzt', label: 'Hausarztkontakt', icon: 'pulse-outline' },
  sonstige: { role: 'sonstige', label: 'Sonstige Vertrauensperson', icon: 'person-outline' },
};

export const TRUSTED_ROLE_ORDER: TrustedRole[] = [
  'nachbar',
  'freund',
  'hausmeister',
  'pflegekontakt',
  'vereinsfreund',
  'hausarzt',
  'sonstige',
];
