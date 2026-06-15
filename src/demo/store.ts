import type {
  Activity,
  Audio,
  ContentType,
  Family,
  FamilyMember,
  Invitation,
  MemberRole,
  Memory,
  Person,
  Photo,
  Profile,
  Relationship,
  RelationshipCategory,
  RelationshipType,
  TimeCapsule,
  UpcomingCapsule,
} from '@/types/models';
import { createSeedData, DEMO_FAMILY_ID, DEMO_USER_ID } from './demoData';

/**
 * In-Memory-Datenspeicher für den Demo-Modus.
 *
 * Lese-Operationen liefern die Beispiel-Daten; Schreib-Operationen verändern
 * den Speicher zur Laufzeit (zurückgesetzt beim Neuladen der Seite). So fühlt
 * sich die Vorschau interaktiv an – ganz ohne Supabase.
 */
let data = createSeedData();
let counter = 1000;
const newId = (prefix: string) => `${prefix}-${counter++}`;
const nowIso = () => new Date().toISOString();

export function resetDemoData() {
  data = createSeedData();
}

export const demoStore = {
  // --- Profile ---
  getProfile(userId: string): Profile | null {
    return userId === DEMO_USER_ID ? data.profile : data.profile;
  },
  updateProfile(_userId: string, input: Partial<Profile>): Profile {
    data.profile = { ...data.profile, ...input, updated_at: nowIso() };
    return data.profile;
  },

  // --- Familien & Mitglieder ---
  listMyFamilies(): { family: Family; role: MemberRole }[] {
    return [{ family: data.family, role: 'admin' }];
  },
  getFamily(id: string): Family | null {
    return id === data.family.id ? data.family : null;
  },
  updateFamily(id: string, input: { name?: string; image_url?: string | null }): Family {
    if (id === data.family.id) {
      data.family = { ...data.family, ...input, updated_at: nowIso() };
    }
    return data.family;
  },
  listMembers(): FamilyMember[] {
    return data.members;
  },
  updateMemberRole(memberId: string, role: MemberRole): void {
    const m = data.members.find((x) => x.id === memberId);
    if (m) m.role = role;
  },
  removeMember(memberId: string): void {
    data.members = data.members.filter((x) => x.id !== memberId);
  },

  // --- Einladungen ---
  createInvitation(input: {
    familyId: string;
    invitedBy: string;
    role: MemberRole;
    email?: string | null;
  }): Invitation {
    const code = Array.from({ length: 8 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)],
    ).join('');
    const inv: Invitation = {
      id: newId('inv'),
      family_id: input.familyId,
      code,
      role: input.role,
      email: input.email ?? null,
      status: 'pending',
      invited_by: input.invitedBy,
      accepted_by: null,
      accepted_at: null,
      expires_at: new Date(Date.now() + 30 * 864e5).toISOString(),
      created_at: nowIso(),
    };
    data.invitations.unshift(inv);
    return inv;
  },
  listInvitations(): Invitation[] {
    return data.invitations;
  },
  revokeInvitation(id: string): void {
    const inv = data.invitations.find((x) => x.id === id);
    if (inv) inv.status = 'revoked';
  },
  acceptInvitation(): string {
    return DEMO_FAMILY_ID;
  },

  // --- Personen ---
  listPersons(): Person[] {
    return [...data.persons].sort((a, b) =>
      a.first_name.localeCompare(b.first_name),
    );
  },
  getPerson(id: string): Person | null {
    return data.persons.find((p) => p.id === id) ?? null;
  },
  createPerson(
    familyId: string,
    createdBy: string,
    input: Partial<Person> & { first_name: string },
  ): Person {
    const p: Person = {
      id: newId('p'),
      family_id: familyId,
      user_id: null,
      first_name: input.first_name,
      last_name: input.last_name ?? null,
      avatar_url: input.avatar_url ?? null,
      birth_date: input.birth_date ?? null,
      birth_place: input.birth_place ?? null,
      death_date: input.death_date ?? null,
      biography: input.biography ?? null,
      created_by: createdBy,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    data.persons.push(p);
    return p;
  },
  updatePerson(id: string, input: Partial<Person>): Person {
    const idx = data.persons.findIndex((p) => p.id === id);
    data.persons[idx] = { ...data.persons[idx]!, ...input, updated_at: nowIso() };
    return data.persons[idx]!;
  },
  deletePerson(id: string): void {
    data.persons = data.persons.filter((p) => p.id !== id);
    data.relationships = data.relationships.filter(
      (r) => r.from_person_id !== id && r.to_person_id !== id,
    );
  },

  // --- Beziehungen ---
  listRelationships(): Relationship[] {
    return data.relationships;
  },
  createRelationship(input: {
    family_id: string;
    from_person_id: string;
    to_person_id: string;
    type: RelationshipType;
    category: RelationshipCategory;
    created_by: string;
  }): Relationship {
    const r: Relationship = {
      id: newId('r'),
      ...input,
      created_at: nowIso(),
    };
    data.relationships.push(r);
    return r;
  },
  deleteRelationship(id: string): void {
    data.relationships = data.relationships.filter((r) => r.id !== id);
  },

  // --- Erinnerungen ---
  listMemories(_familyId: string, personId?: string): Memory[] {
    let list = [...data.memories];
    if (personId) list = list.filter((m) => m.person_id === personId);
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  getMemory(id: string): Memory | null {
    return data.memories.find((m) => m.id === id) ?? null;
  },
  createMemory(
    familyId: string,
    authorId: string,
    input: {
      title: string;
      description?: string | null;
      content_type: ContentType;
      person_id?: string | null;
      occurred_on?: string | null;
    },
  ): Memory {
    const m: Memory = {
      id: newId('m'),
      family_id: familyId,
      person_id: input.person_id ?? null,
      author_id: authorId,
      title: input.title,
      description: input.description ?? null,
      content_type: input.content_type,
      occurred_on: input.occurred_on ?? null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    data.memories.unshift(m);
    return m;
  },
  updateMemory(id: string, input: Partial<Memory>): Memory {
    const idx = data.memories.findIndex((m) => m.id === id);
    data.memories[idx] = { ...data.memories[idx]!, ...input, updated_at: nowIso() };
    return data.memories[idx]!;
  },
  deleteMemory(id: string): void {
    data.memories = data.memories.filter((m) => m.id !== id);
  },

  // --- Fotos ---
  listPhotos(
    _familyId: string,
    opts?: { personId?: string; memoryId?: string },
  ): Photo[] {
    let list = [...data.photos];
    if (opts?.personId) list = list.filter((p) => p.person_id === opts.personId);
    if (opts?.memoryId) list = list.filter((p) => p.memory_id === opts.memoryId);
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  uploadPhoto(input: {
    familyId: string;
    uploadedBy: string;
    localUri: string;
    caption?: string | null;
    personId?: string | null;
    memoryId?: string | null;
    width?: number | null;
    height?: number | null;
  }): Photo {
    const p: Photo = {
      id: newId('ph'),
      family_id: input.familyId,
      memory_id: input.memoryId ?? null,
      person_id: input.personId ?? null,
      storage_path: input.localUri, // im Demo direkt anzeigbare URL
      caption: input.caption ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      uploaded_by: input.uploadedBy,
      created_at: nowIso(),
    };
    data.photos.unshift(p);
    return p;
  },
  deletePhoto(id: string): void {
    data.photos = data.photos.filter((p) => p.id !== id);
  },

  // --- Audios ---
  listAudios(
    _familyId: string,
    opts?: { personId?: string; memoryId?: string },
  ): Audio[] {
    let list = [...data.audios];
    if (opts?.personId) list = list.filter((a) => a.person_id === opts.personId);
    if (opts?.memoryId) list = list.filter((a) => a.memory_id === opts.memoryId);
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  uploadAudio(input: {
    familyId: string;
    recordedBy: string;
    localUri: string;
    title?: string | null;
    durationSeconds?: number | null;
    personId?: string | null;
    memoryId?: string | null;
  }): Audio {
    const a: Audio = {
      id: newId('a'),
      family_id: input.familyId,
      memory_id: input.memoryId ?? null,
      person_id: input.personId ?? null,
      storage_path: input.localUri,
      title: input.title ?? null,
      duration_seconds: input.durationSeconds ?? null,
      recorded_by: input.recordedBy,
      created_at: nowIso(),
    };
    data.audios.unshift(a);
    return a;
  },
  deleteAudio(id: string): void {
    data.audios = data.audios.filter((a) => a.id !== id);
  },

  // --- Zeitkapseln ---
  listMyCapsules(): TimeCapsule[] {
    return [...data.capsules].sort((a, b) =>
      a.open_at.localeCompare(b.open_at),
    );
  },
  listUpcomingForMe(): UpcomingCapsule[] {
    const myCapsuleIds = data.recipients
      .filter((r) => r.user_id === DEMO_USER_ID)
      .map((r) => r.capsule_id);
    return data.capsules
      .filter((c) => myCapsuleIds.includes(c.id) && !c.is_opened)
      .sort((a, b) => a.open_at.localeCompare(b.open_at))
      .map((c) => ({
        id: c.id,
        family_id: c.family_id,
        title: c.title,
        open_at: c.open_at,
      }));
  },
  getCapsule(id: string): TimeCapsule | null {
    return data.capsules.find((c) => c.id === id) ?? null;
  },
  createCapsule(input: {
    familyId: string;
    creatorId: string;
    title: string;
    description?: string | null;
    contentType: ContentType;
    textContent?: string | null;
    mediaUri?: string | null;
    openAt: string;
    recipients: { personId?: string | null; userId?: string | null }[];
  }): TimeCapsule {
    const c: TimeCapsule = {
      id: newId('tc'),
      family_id: input.familyId,
      creator_id: input.creatorId,
      title: input.title,
      description: input.description ?? null,
      content_type: input.contentType,
      text_content: input.textContent ?? null,
      storage_path: input.mediaUri ?? null,
      open_at: input.openAt,
      is_opened: new Date(input.openAt).getTime() <= Date.now(),
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    data.capsules.unshift(c);
    input.recipients
      .filter((r) => r.personId || r.userId)
      .forEach((r) =>
        data.recipients.push({
          id: newId('tr'),
          capsule_id: c.id,
          person_id: r.personId ?? null,
          user_id: r.userId ?? null,
          created_at: nowIso(),
        }),
      );
    return c;
  },
  deleteCapsule(id: string): void {
    data.capsules = data.capsules.filter((c) => c.id !== id);
    data.recipients = data.recipients.filter((r) => r.capsule_id !== id);
  },

  // --- Aktivitäten ---
  listActivities(_familyId: string, limit = 30): Activity[] {
    return [...data.activities]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  },
  logActivity(input: {
    familyId: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    summary?: string | null;
  }): void {
    data.activities.unshift({
      id: newId('ac'),
      family_id: input.familyId,
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      summary: input.summary ?? null,
      created_at: nowIso(),
      actor: data.profile,
    });
  },
};
