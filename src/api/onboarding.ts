/**
 * Onboarding · „Deine ersten Schritte".
 *
 * Ermittelt aus vorhandenen Daten, welche Einstiegs-Schritte ein Nutzer schon
 * erledigt hat. Dient als freundliche, motivierende Checkliste – kein Zwang.
 */

import { getProfile } from './profiles';
import { listMembers } from './families';
import { listMemories } from './memories';
import { listMyCapsules } from './timeCapsules';
import { listPersons } from './persons';

export type FirstStepKey = 'profile' | 'invite' | 'memory' | 'capsule' | 'tree';

export interface FirstStep {
  key: FirstStepKey;
  label: string;
  done: boolean;
}

export interface FirstSteps {
  steps: FirstStep[];
  doneCount: number;
  total: number;
  complete: boolean;
}

export async function getFirstSteps(familyId: string, userId: string): Promise<FirstSteps> {
  const [profile, members, memories, capsules, persons] = await Promise.all([
    getProfile(userId),
    listMembers(familyId),
    listMemories(familyId),
    listMyCapsules(familyId),
    listPersons(familyId),
  ]);

  const steps: FirstStep[] = [
    { key: 'profile', label: 'Profilbild hinzufügen', done: !!profile?.avatar_url },
    { key: 'invite', label: 'Erstes Familienmitglied einladen', done: members.length > 1 },
    { key: 'memory', label: 'Erste Erinnerung speichern', done: memories.length > 0 },
    { key: 'capsule', label: 'Erste Zeitkapsel erstellen', done: capsules.length > 0 },
    { key: 'tree', label: 'Familienbaum vervollständigen', done: persons.length >= 3 },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  return { steps, doneCount, total: steps.length, complete: doneCount === steps.length };
}
