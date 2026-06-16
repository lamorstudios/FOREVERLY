/**
 * Benutzerrollen & Rechte (Phase 15).
 * Saubere, zentrale Definition der Rollen und ihrer Berechtigungen.
 */

export type AppRole =
  | 'admin' // Familienadmin
  | 'member' // Familienmitglied
  | 'trustee' // Vertrauensperson (Nachlass)
  | 'inner' // Inner Circle
  | 'trusted' // Trusted Circle
  | 'guest'; // Gast (eingeschränkt)

export const ROLE_META: Record<AppRole, { label: string; description: string }> = {
  admin: { label: 'Familienadmin', description: 'Verwaltet Familie, Mitglieder und Einstellungen.' },
  member: { label: 'Familienmitglied', description: 'Erstellt Inhalte und sieht freigegebene Familieninhalte.' },
  trustee: { label: 'Vertrauensperson', description: 'Kann im Ernstfall die Nachlass-Freigabe bestätigen.' },
  inner: { label: 'Inner Circle', description: 'Sieht auch besonders private Inhalte.' },
  trusted: { label: 'Trusted Circle', description: 'Nachbarn/Pflege/Freunde – Sicherheit & Standort (wenn freigegeben).' },
  guest: { label: 'Gast', description: 'Eingeschränkter Lesezugriff auf wenige freigegebene Inhalte.' },
};

export type Permission =
  | 'family.manage'
  | 'members.invite'
  | 'members.remove'
  | 'content.create'
  | 'content.viewFamily'
  | 'content.viewInner'
  | 'estate.confirm'
  | 'safety.receiveSos'
  | 'settings.billing';

const MATRIX: Record<AppRole, Permission[]> = {
  admin: ['family.manage', 'members.invite', 'members.remove', 'content.create', 'content.viewFamily', 'content.viewInner', 'settings.billing'],
  member: ['members.invite', 'content.create', 'content.viewFamily'],
  inner: ['members.invite', 'content.create', 'content.viewFamily', 'content.viewInner'],
  trustee: ['content.viewFamily', 'estate.confirm', 'safety.receiveSos'],
  trusted: ['safety.receiveSos'],
  guest: ['content.viewFamily'],
};

/** Darf eine Rolle eine bestimmte Aktion ausführen? */
export function can(role: AppRole, permission: Permission): boolean {
  return MATRIX[role]?.includes(permission) ?? false;
}

export const ROLE_ORDER: AppRole[] = ['admin', 'member', 'inner', 'trustee', 'trusted', 'guest'];
