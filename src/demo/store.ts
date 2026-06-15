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
  MemberStatus,
  StatusLevel,
  AppNotification,
  EmergencyContact,
  EmergencyEvent,
  CalendarEvent,
  CalendarEventType,
  FamilyDocument,
  DocumentKind,
  BookProject,
  BookType,
  BookOptions,
  TrustedContact,
  TrustedRole,
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

  // --- Phase 2: Familienstatus ---
  listStatuses(): MemberStatus[] {
    return data.statuses.map((s) => ({
      ...s,
      person: data.persons.find((p) => p.id === s.person_id),
    }));
  },
  setStatus(
    familyId: string,
    personId: string,
    level: StatusLevel,
    message: string | null,
    updatedBy: string,
  ): MemberStatus {
    const existing = data.statuses.find((s) => s.person_id === personId);
    if (existing) {
      existing.level = level;
      existing.message = message;
      existing.updated_by = updatedBy;
      existing.updated_at = nowIso();
      return existing;
    }
    const s: MemberStatus = {
      id: newId('st'),
      family_id: familyId,
      person_id: personId,
      level,
      message,
      updated_by: updatedBy,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    data.statuses.push(s);
    return s;
  },

  // --- Phase 2: Benachrichtigungen ---
  listNotifications(): AppNotification[] {
    return [...data.notifications].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
  },
  unreadNotificationCount(): number {
    return data.notifications.filter((n) => !n.is_read).length;
  },
  addNotification(input: {
    familyId: string;
    actorUserId: string;
    category: AppNotification['category'];
    title: string;
    body?: string | null;
    data?: Record<string, unknown>;
  }): AppNotification {
    const n: AppNotification = {
      id: newId('nt'),
      family_id: input.familyId,
      recipient_user_id: null,
      actor_user_id: input.actorUserId,
      category: input.category,
      title: input.title,
      body: input.body ?? null,
      data: input.data ?? {},
      is_read: false,
      created_at: nowIso(),
    };
    data.notifications.unshift(n);
    return n;
  },
  markNotificationRead(id: string): void {
    const n = data.notifications.find((x) => x.id === id);
    if (n) n.is_read = true;
  },
  markAllNotificationsRead(): void {
    data.notifications.forEach((n) => (n.is_read = true));
  },

  // --- Phase 2: Notfallkontakte ---
  listEmergencyContacts(): EmergencyContact[] {
    return [...data.emergencyContacts].sort((a, b) => a.priority - b.priority);
  },
  createEmergencyContact(input: {
    familyId: string;
    name: string;
    relation?: string | null;
    phone?: string | null;
    note?: string | null;
    personId?: string | null;
    createdBy: string;
  }): EmergencyContact {
    const c: EmergencyContact = {
      id: newId('ec'),
      family_id: input.familyId,
      person_id: input.personId ?? null,
      name: input.name,
      relation: input.relation ?? null,
      phone: input.phone ?? null,
      note: input.note ?? null,
      priority: data.emergencyContacts.length,
      created_by: input.createdBy,
      created_at: nowIso(),
    };
    data.emergencyContacts.push(c);
    return c;
  },
  deleteEmergencyContact(id: string): void {
    data.emergencyContacts = data.emergencyContacts.filter((c) => c.id !== id);
  },

  // --- Phase 2: Notfallereignisse ---
  listEmergencyEvents(): EmergencyEvent[] {
    return [...data.emergencyEvents].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
  },
  triggerEmergency(input: {
    familyId: string;
    triggeredBy: string;
    latitude?: number | null;
    longitude?: number | null;
    locationLabel?: string | null;
    message?: string | null;
  }): EmergencyEvent {
    const e: EmergencyEvent = {
      id: newId('ev'),
      family_id: input.familyId,
      triggered_by: input.triggeredBy,
      state: 'active',
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      location_label: input.locationLabel ?? null,
      message: input.message ?? null,
      created_at: nowIso(),
      resolved_at: null,
      resolved_by: null,
    };
    data.emergencyEvents.unshift(e);
    this.addNotification({
      familyId: input.familyId,
      actorUserId: input.triggeredBy,
      category: 'emergency',
      title: '🚨 Notfall ausgelöst',
      body: input.locationLabel
        ? `Standort: ${input.locationLabel}`
        : 'Ein Familienmitglied benötigt Hilfe.',
      data: { eventId: e.id },
    });
    return e;
  },
  resolveEmergency(id: string, resolvedBy: string): void {
    const e = data.emergencyEvents.find((x) => x.id === id);
    if (e) {
      e.state = 'resolved';
      e.resolved_at = nowIso();
      e.resolved_by = resolvedBy;
    }
  },

  // --- Phase 2: Familienkalender ---
  listCalendarEvents(): CalendarEvent[] {
    return [...data.calendarEvents].sort((a, b) =>
      a.event_date.localeCompare(b.event_date),
    );
  },
  getCalendarEvent(id: string): CalendarEvent | null {
    return data.calendarEvents.find((e) => e.id === id) ?? null;
  },
  createCalendarEvent(input: {
    familyId: string;
    type: CalendarEventType;
    title: string;
    description?: string | null;
    eventDate: string;
    eventTime?: string | null;
    isAnnual?: boolean;
    forWholeFamily?: boolean;
    participantIds?: string[];
    createdBy: string;
  }): CalendarEvent {
    const e: CalendarEvent = {
      id: newId('cal'),
      family_id: input.familyId,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      event_date: input.eventDate,
      event_time: input.eventTime ?? null,
      is_annual: input.isAnnual ?? false,
      for_whole_family: input.forWholeFamily ?? false,
      created_by: input.createdBy,
      created_at: nowIso(),
      updated_at: nowIso(),
      participant_ids: input.participantIds ?? [],
    };
    data.calendarEvents.push(e);
    return e;
  },
  deleteCalendarEvent(id: string): void {
    data.calendarEvents = data.calendarEvents.filter((e) => e.id !== id);
  },

  // --- Phase 2: Dokumentenübersicht ---
  listDocuments(): FamilyDocument[] {
    return [...data.documents];
  },
  upsertDocument(input: {
    id?: string;
    familyId: string;
    kind: DocumentKind;
    title: string;
    isAvailable: boolean;
    location?: string | null;
    note?: string | null;
    contactPerson?: string | null;
    createdBy: string;
  }): FamilyDocument {
    if (input.id) {
      const existing = data.documents.find((d) => d.id === input.id);
      if (existing) {
        existing.kind = input.kind;
        existing.title = input.title;
        existing.is_available = input.isAvailable;
        existing.location = input.location ?? null;
        existing.note = input.note ?? null;
        existing.contact_person = input.contactPerson ?? null;
        existing.updated_at = nowIso();
        return existing;
      }
    }
    const d: FamilyDocument = {
      id: newId('doc'),
      family_id: input.familyId,
      kind: input.kind,
      title: input.title,
      is_available: input.isAvailable,
      location: input.location ?? null,
      note: input.note ?? null,
      contact_person: input.contactPerson ?? null,
      contact_person_id: null,
      created_by: input.createdBy,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    data.documents.push(d);
    return d;
  },
  deleteDocument(id: string): void {
    data.documents = data.documents.filter((d) => d.id !== id);
  },

  // --- Phase 4: Familienbuch ---
  listBookProjects(): BookProject[] {
    return [...data.bookProjects].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
  },
  getBookProject(id: string): BookProject | null {
    return data.bookProjects.find((b) => b.id === id) ?? null;
  },
  createBookProject(input: {
    familyId: string;
    type: BookType;
    title: string;
    subtitle: string | null;
    coverPhotoPath: string | null;
    options: BookOptions;
    createdBy: string;
  }): BookProject {
    const project: BookProject = {
      id: newId('book'),
      family_id: input.familyId,
      type: input.type,
      title: input.title,
      subtitle: input.subtitle,
      cover_photo_path: input.coverPhotoPath,
      hidden_chapters: [],
      chapter_order: [],
      options: input.options,
      status: 'ready',
      created_by: input.createdBy,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    data.bookProjects.unshift(project);
    return project;
  },
  updateBookProject(id: string, patch: Partial<BookProject>): BookProject {
    const idx = data.bookProjects.findIndex((b) => b.id === id);
    data.bookProjects[idx] = {
      ...data.bookProjects[idx]!,
      ...patch,
      updated_at: nowIso(),
    };
    return data.bookProjects[idx]!;
  },
  deleteBookProject(id: string): void {
    data.bookProjects = data.bookProjects.filter((b) => b.id !== id);
  },

  // --- Trusted Circle / Vertrauenskreis ---
  listTrustedContacts(personId?: string): TrustedContact[] {
    let list = [...data.trustedContacts];
    if (personId) list = list.filter((c) => c.person_id === personId);
    return list
      .map((c) => ({
        ...c,
        person: data.persons.find((p) => p.id === c.person_id),
      }))
      .sort((a, b) => Number(b.is_emergency) - Number(a.is_emergency));
  },
  createTrustedContact(input: {
    familyId: string;
    personId: string | null;
    name: string;
    role: TrustedRole;
    phone?: string | null;
    email?: string | null;
    location?: string | null;
    note?: string | null;
    availability?: string | null;
    isEmergency?: boolean;
    createdBy: string;
  }): TrustedContact {
    const c: TrustedContact = {
      id: newId('tc'),
      family_id: input.familyId,
      person_id: input.personId,
      name: input.name,
      role: input.role,
      phone: input.phone ?? null,
      email: input.email ?? null,
      location: input.location ?? null,
      note: input.note ?? null,
      availability: input.availability ?? null,
      is_emergency: input.isEmergency ?? false,
      created_by: input.createdBy,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    data.trustedContacts.push(c);
    return c;
  },
  updateTrustedContact(id: string, patch: Partial<TrustedContact>): TrustedContact {
    const idx = data.trustedContacts.findIndex((c) => c.id === id);
    data.trustedContacts[idx] = {
      ...data.trustedContacts[idx]!,
      ...patch,
      updated_at: nowIso(),
    };
    return data.trustedContacts[idx]!;
  },
  deleteTrustedContact(id: string): void {
    data.trustedContacts = data.trustedContacts.filter((c) => c.id !== id);
  },
};
