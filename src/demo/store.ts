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
  PersonQuote,
  PersonTribute,
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
  ClosenessRating,
  ClosenessLevel,
  FamilyBranch,
  RelationshipSuggestion,
  FamilyEvent,
  FamilyEventType,
  EventParticipant,
  RsvpStatus,
  Moment,
  MomentKind,
  MomentComment,
  VisibilityLevel,
  Trustee,
  EstateInfo,
  EstateAudience,
  EstateCase,
  EstateConfirmation,
  LiveShare,
  LiveStatus,
  ShareDuration,
  SafetyAudience,
  SafetyTrip,
  SafetyTripKind,
  SafetyAlert,
  VaultEntry,
  LegacyItem,
  FarewellMessage,
  FilmProject,
  FilmKind,
  FilmMusicMood,
  FilmLock,
  FilmOptions,
  LifeStory,
  LifeStoryKind,
  FamilyWisdom,
  Artifact,
  ArtifactCategory,
  Feedback,
  FeedbackKind,
} from '@/types/models';
import { createSeedData, DEMO_FAMILY_ID, DEMO_USER_ID } from './demoData';
import type { DemoDataset } from './demoData';

/**
 * Datenspeicher für den Demo-/Testmodus.
 *
 * Lese-Operationen liefern die Daten; Schreib-Operationen verändern den Speicher.
 * Damit echte Testfamilien ihre Eingaben behalten, wird der Datensatz im Web
 * automatisch in `localStorage` gespeichert und beim Start wiederhergestellt –
 * die App „vergisst" nach einem Reload nichts mehr. (Auf nativen Geräten ohne
 * `localStorage` bleibt es ein In-Memory-Speicher.)
 *
 * Hinweis: Sehr große Foto-Uploads (Base64) können das `localStorage`-Limit
 * (~5 MB) sprengen; das Speichern ist daher fehlertolerant (try/catch).
 */
const PERSIST_KEY = 'famii.demo.v2';

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

function loadPersisted(): DemoDataset | null {
  try {
    if (!hasLocalStorage()) return null;
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoDataset;
    // Mindest-Plausibilität, sonst frische Seed-Daten verwenden.
    if (!parsed || !parsed.family || !Array.isArray(parsed.persons)) return null;
    return parsed;
  } catch {
    return null;
  }
}

let data: DemoDataset = loadPersisted() ?? createSeedData();
let counter = 1000;
const newId = (prefix: string) => `${prefix}-${counter++}`;
const nowIso = () => new Date().toISOString();

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist() {
  if (!hasLocalStorage()) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(data));
    } catch {
      // Speicher voll / nicht verfügbar – Daten bleiben zumindest im Speicher.
    }
  }, 400);
}

export function resetDemoData() {
  data = createSeedData();
  try {
    if (hasLocalStorage()) localStorage.removeItem(PERSIST_KEY);
  } catch {
    /* ignore */
  }
}

const demoStoreImpl = {
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
      is_memorial: input.is_memorial ?? false,
      traits: input.traits ?? null,
      created_by: createdBy,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    data.persons.push(p);
    return p;
  },
  setMemorial(id: string, value: boolean): Person {
    const idx = data.persons.findIndex((p) => p.id === id);
    data.persons[idx] = { ...data.persons[idx]!, is_memorial: value, updated_at: nowIso() };
    return data.persons[idx]!;
  },

  // --- Phase 16: Familienerbe – Zitate & Erinnerungen ---
  /** Anzeigename für eine Nutzer-ID (für „Hochgeladen von …"). */
  displayNameForUser(userId: string | null): string {
    if (!userId) return 'Familienmitglied';
    if (userId === data.profile.id || userId === DEMO_USER_ID) {
      return data.profile.full_name ?? 'Familienmitglied';
    }
    const person = data.persons.find((p) => p.user_id === userId);
    if (person) return [person.first_name, person.last_name].filter(Boolean).join(' ');
    return 'Familienmitglied';
  },
  /** Profilbild zu einer Nutzer-ID (für Autor-Avatare). */
  avatarForUser(userId: string | null): string | null {
    if (!userId) return null;
    if (userId === data.profile.id || userId === DEMO_USER_ID) return data.profile.avatar_url;
    const person = data.persons.find((p) => p.user_id === userId);
    return person?.avatar_url ?? null;
  },
  listQuotes(personId: string): PersonQuote[] {
    return data.quotes
      .filter((q) => q.person_id === personId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },
  listFamilyQuotes(familyId: string): PersonQuote[] {
    return data.quotes.filter((q) => q.family_id === familyId);
  },
  addQuote(input: {
    familyId: string;
    personId: string;
    text: string;
    context?: string | null;
    addedByUserId: string | null;
  }): PersonQuote {
    const q: PersonQuote = {
      id: newId('q'),
      family_id: input.familyId,
      person_id: input.personId,
      text: input.text,
      context: input.context ?? null,
      added_by_user_id: input.addedByUserId,
      added_by_name: this.displayNameForUser(input.addedByUserId),
      created_at: nowIso(),
    };
    data.quotes.push(q);
    return q;
  },
  deleteQuote(id: string): void {
    data.quotes = data.quotes.filter((q) => q.id !== id);
  },
  listTributes(personId: string): PersonTribute[] {
    return data.tributes
      .filter((t) => t.person_id === personId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  listFamilyTributes(familyId: string): PersonTribute[] {
    return data.tributes.filter((t) => t.family_id === familyId);
  },
  addTribute(input: {
    familyId: string;
    personId: string;
    text: string;
    authorUserId: string | null;
  }): PersonTribute {
    const t: PersonTribute = {
      id: newId('trib'),
      family_id: input.familyId,
      person_id: input.personId,
      text: input.text,
      author_user_id: input.authorUserId,
      author_name: this.displayNameForUser(input.authorUserId),
      created_at: nowIso(),
    };
    data.tributes.unshift(t);
    return t;
  },
  deleteTribute(id: string): void {
    data.tributes = data.tributes.filter((t) => t.id !== id);
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
      visibility?: Memory['visibility'];
      visibility_branch_id?: string | null;
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
      visibility: input.visibility ?? 'family',
      visibility_branch_id: input.visibility_branch_id ?? null,
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
    visibility?: TimeCapsule['visibility'];
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
      visibility: input.visibility ?? 'selected',
      visibility_branch_id: null,
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

  // --- Phase 4.5: Familiennähe ---
  listCloseness(): ClosenessRating[] {
    return [...data.closenessRatings];
  },
  setCloseness(familyId: string, raterUserId: string, personId: string, level: ClosenessLevel): ClosenessRating {
    const existing = data.closenessRatings.find(
      (c) => c.person_id === personId && c.rater_user_id === raterUserId,
    );
    if (existing) {
      existing.level = level;
      existing.updated_at = nowIso();
      return existing;
    }
    const r: ClosenessRating = {
      id: newId('cl'),
      family_id: familyId,
      rater_user_id: raterUserId,
      person_id: personId,
      level,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    data.closenessRatings.push(r);
    return r;
  },

  // --- Phase 4.5: Familienzweige ---
  listBranches(): FamilyBranch[] {
    return [...data.branches];
  },
  createBranch(familyId: string, name: string, color: string | null, createdBy: string): FamilyBranch {
    const b: FamilyBranch = {
      id: newId('br'),
      family_id: familyId,
      name,
      color,
      created_by: createdBy,
      created_at: nowIso(),
      member_ids: [],
    };
    data.branches.push(b);
    return b;
  },
  setBranchMembers(branchId: string, memberIds: string[]): FamilyBranch {
    const b = data.branches.find((x) => x.id === branchId)!;
    b.member_ids = memberIds;
    return b;
  },
  deleteBranch(id: string): void {
    data.branches = data.branches.filter((b) => b.id !== id);
  },

  // --- Phase 5: Smart Invites ---
  createSmartInvite(input: {
    familyId: string;
    invitedBy: string;
    role: MemberRole;
    personId: string | null;
    inviterPersonId: string | null;
    relationshipType: RelationshipType | null;
    suggestedCloseness: ClosenessLevel | null;
    message: string | null;
  }): Invitation {
    const code = Array.from({ length: 8 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)],
    ).join('');
    const inv: Invitation = {
      id: newId('inv'),
      family_id: input.familyId,
      code,
      role: input.role,
      email: null,
      status: 'pending',
      invited_by: input.invitedBy,
      accepted_by: null,
      accepted_at: null,
      expires_at: new Date(Date.now() + 30 * 864e5).toISOString(),
      created_at: nowIso(),
      person_id: input.personId,
      inviter_person_id: input.inviterPersonId,
      relationship_type: input.relationshipType,
      suggested_closeness: input.suggestedCloseness,
      message: input.message,
    };
    data.invitations.unshift(inv);
    return inv;
  },
  /** Simuliert die Annahme einer Einladung (Vorschau ohne echte Registrierung). */
  acceptSmartInviteDemo(code: string): Invitation | null {
    const inv = data.invitations.find((i) => i.code === code.trim().toUpperCase());
    if (!inv) return null;
    const guestId = `demo-guest-${inv.id}`;
    inv.status = 'accepted';
    inv.accepted_by = guestId;
    inv.accepted_at = nowIso();
    // Profil mit „neuem Konto" verknüpfen
    if (inv.person_id) {
      const person = data.persons.find((p) => p.id === inv.person_id);
      if (person && !person.user_id) person.user_id = guestId;
      // Beziehung Einladender -> Person automatisch anlegen
      if (inv.inviter_person_id && inv.relationship_type) {
        const exists = data.relationships.some(
          (r) => r.from_person_id === inv.inviter_person_id && r.to_person_id === inv.person_id && r.type === inv.relationship_type,
        );
        if (!exists) {
          data.relationships.push({
            id: newId('r'),
            family_id: inv.family_id,
            from_person_id: inv.inviter_person_id,
            to_person_id: inv.person_id,
            type: inv.relationship_type,
            category: 'biological',
            created_by: inv.invited_by,
            created_at: nowIso(),
          });
        }
      }
      // Familiennähe des Einladenden anwenden (kein Vollzugriff automatisch)
      if (inv.suggested_closeness && inv.person_id) {
        this.setCloseness(inv.family_id, inv.invited_by, inv.person_id, inv.suggested_closeness);
      }
    }
    return inv;
  },

  // --- Phase 5: Beziehungsvorschläge ---
  listSuggestions(): RelationshipSuggestion[] {
    return data.suggestions.filter((s) => s.status === 'pending');
  },
  addSuggestions(
    candidates: {
      family_id: string;
      from_person_id: string;
      to_person_id: string;
      suggested_type: RelationshipType;
      suggested_category: RelationshipCategory;
      reason: string;
      created_by: string;
    }[],
  ): RelationshipSuggestion[] {
    const added: RelationshipSuggestion[] = [];
    for (const c of candidates) {
      const dup = data.suggestions.some(
        (s) => s.from_person_id === c.from_person_id && s.to_person_id === c.to_person_id,
      );
      if (dup) continue;
      const s: RelationshipSuggestion = {
        id: newId('sug'),
        family_id: c.family_id,
        from_person_id: c.from_person_id,
        to_person_id: c.to_person_id,
        suggested_type: c.suggested_type,
        suggested_category: c.suggested_category,
        reason: c.reason,
        status: 'pending',
        created_by: c.created_by,
        created_at: nowIso(),
      };
      data.suggestions.push(s);
      added.push(s);
    }
    return added;
  },
  updateSuggestion(id: string, patch: Partial<RelationshipSuggestion>): RelationshipSuggestion {
    const idx = data.suggestions.findIndex((s) => s.id === id);
    data.suggestions[idx] = { ...data.suggestions[idx]!, ...patch };
    return data.suggestions[idx]!;
  },
  confirmSuggestion(id: string): RelationshipSuggestion | null {
    const s = data.suggestions.find((x) => x.id === id);
    if (!s) return null;
    s.status = 'confirmed';
    this.createRelationship({
      family_id: s.family_id,
      from_person_id: s.from_person_id,
      to_person_id: s.to_person_id,
      type: s.suggested_type,
      category: s.suggested_category,
      created_by: s.created_by ?? '',
    });
    return s;
  },

  // --- Phase 6: Familienevents ---
  listEvents(): FamilyEvent[] {
    return [...data.events]
      .map((e) => ({
        ...e,
        participant_count: data.eventParticipants.filter((p) => p.event_id === e.id).length,
      }))
      .sort((a, b) => b.event_date.localeCompare(a.event_date));
  },
  getEvent(id: string): FamilyEvent | null {
    return data.events.find((e) => e.id === id) ?? null;
  },
  createEvent(input: {
    familyId: string;
    type: FamilyEventType;
    title: string;
    description?: string | null;
    eventDate: string;
    eventTime?: string | null;
    location?: string | null;
    visibility?: VisibilityLevel;
    hostUserId: string;
    hostPersonId?: string | null;
    participantPersonIds?: string[];
    createdBy: string;
  }): FamilyEvent {
    const e: FamilyEvent = {
      id: newId('ev'),
      family_id: input.familyId,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      event_date: input.eventDate,
      event_time: input.eventTime ?? null,
      location: input.location ?? null,
      host_user_id: input.hostUserId,
      host_person_id: input.hostPersonId ?? null,
      visibility: input.visibility ?? 'family',
      created_by: input.createdBy,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    data.events.unshift(e);
    for (const pid of input.participantPersonIds ?? []) {
      const person = data.persons.find((p) => p.id === pid);
      data.eventParticipants.push({
        id: newId('ep'),
        event_id: e.id,
        person_id: pid,
        user_id: person?.user_id ?? null,
        rsvp: null,
        comment: null,
        bringing: null,
        responded_at: null,
        created_at: nowIso(),
      });
    }
    return e;
  },
  deleteEvent(id: string): void {
    data.events = data.events.filter((e) => e.id !== id);
    data.eventParticipants = data.eventParticipants.filter((p) => p.event_id !== id);
    data.moments = data.moments.filter((m) => m.event_id !== id);
  },
  listParticipants(eventId: string): EventParticipant[] {
    return data.eventParticipants
      .filter((p) => p.event_id === eventId)
      .map((p) => ({ ...p, person: data.persons.find((x) => x.id === p.person_id) }));
  },
  setRsvp(input: {
    eventId: string;
    personId: string;
    userId: string;
    rsvp: RsvpStatus;
    comment?: string | null;
    bringing?: string | null;
  }): EventParticipant {
    let p = data.eventParticipants.find(
      (x) => x.event_id === input.eventId && x.person_id === input.personId,
    );
    if (!p) {
      p = {
        id: newId('ep'),
        event_id: input.eventId,
        person_id: input.personId,
        user_id: input.userId,
        rsvp: null,
        comment: null,
        bringing: null,
        responded_at: null,
        created_at: nowIso(),
      };
      data.eventParticipants.push(p);
    }
    p.rsvp = input.rsvp;
    p.comment = input.comment ?? p.comment;
    p.bringing = input.bringing ?? p.bringing;
    p.responded_at = nowIso();
    return p;
  },

  // --- Phase 6: Familienmomente (Feed + Album) ---
  listMoments(opts?: { eventId?: string | null; feedOnly?: boolean }): Moment[] {
    let list = [...data.moments];
    if (opts?.eventId) list = list.filter((m) => m.event_id === opts.eventId);
    else if (opts?.feedOnly) list = list.filter((m) => !m.event_id);
    return list
      .map((m) => ({
        ...m,
        author: resolveAuthor(m.author_user_id),
        comment_count: data.momentComments.filter((c) => c.moment_id === m.id).length,
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  getMoment(id: string): Moment | null {
    const m = data.moments.find((x) => x.id === id);
    return m ? { ...m, author: resolveAuthor(m.author_user_id) } : null;
  },
  createMoment(input: {
    familyId: string;
    authorUserId: string;
    kind: MomentKind;
    text?: string | null;
    storagePath?: string | null;
    durationSeconds?: number | null;
    visibility?: VisibilityLevel;
    eventId?: string | null;
  }): Moment {
    const m: Moment = {
      id: newId('mo'),
      family_id: input.familyId,
      author_user_id: input.authorUserId,
      kind: input.kind,
      text: input.text ?? null,
      storage_path: input.storagePath ?? null,
      duration_seconds: input.durationSeconds ?? null,
      visibility: input.visibility ?? 'family',
      event_id: input.eventId ?? null,
      created_at: nowIso(),
    };
    data.moments.unshift(m);
    return { ...m, author: resolveAuthor(m.author_user_id) };
  },
  deleteMoment(id: string): void {
    data.moments = data.moments.filter((m) => m.id !== id);
    data.momentComments = data.momentComments.filter((c) => c.moment_id !== id);
  },
  listMomentComments(momentId: string): MomentComment[] {
    return data.momentComments
      .filter((c) => c.moment_id === momentId)
      .map((c) => ({ ...c, author: resolveAuthor(c.author_user_id) }))
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },
  addMomentComment(momentId: string, authorUserId: string, text: string): MomentComment {
    const c: MomentComment = {
      id: newId('mc'),
      moment_id: momentId,
      author_user_id: authorUserId,
      text,
      created_at: nowIso(),
    };
    data.momentComments.push(c);
    return { ...c, author: resolveAuthor(authorUserId) };
  },

  // ===================== Trustee & Nachlass-Freigabe =====================
  listTrustees(ownerUserId: string): Trustee[] {
    return data.trustees.filter((t) => t.owner_user_id === ownerUserId);
  },
  createTrustee(input: {
    familyId: string;
    ownerUserId: string;
    personId: string | null;
    name: string;
    relation: string;
    phone?: string | null;
    email?: string | null;
    role?: string | null;
    canConfirmDeath?: boolean;
  }): Trustee {
    const t: Trustee = {
      id: newId('tr'),
      family_id: input.familyId,
      owner_user_id: input.ownerUserId,
      person_id: input.personId,
      name: input.name,
      relation: input.relation,
      phone: input.phone ?? null,
      email: input.email ?? null,
      role: input.role ?? input.relation,
      can_confirm_death: input.canConfirmDeath ?? true,
      created_at: nowIso(),
    };
    data.trustees.push(t);
    return t;
  },
  updateTrustee(id: string, patch: Partial<Trustee>): Trustee {
    const t = data.trustees.find((x) => x.id === id);
    if (!t) throw new Error('Trustee nicht gefunden');
    Object.assign(t, patch);
    return t;
  },
  deleteTrustee(id: string): void {
    data.trustees = data.trustees.filter((x) => x.id !== id);
  },

  getEstateInfo(ownerUserId: string): EstateInfo | null {
    return data.estateInfos.find((e) => e.owner_user_id === ownerUserId) ?? null;
  },
  upsertEstateInfo(ownerUserId: string, familyId: string, patch: Partial<EstateInfo>): EstateInfo {
    let info = data.estateInfos.find((e) => e.owner_user_id === ownerUserId);
    if (info) {
      Object.assign(info, patch, { updated_at: nowIso() });
    } else {
      info = {
        id: newId('est'),
        family_id: familyId,
        owner_user_id: ownerUserId,
        has_will: false,
        will_location: null,
        has_patient_decree: false,
        patient_decree_location: null,
        has_power_of_attorney: false,
        power_of_attorney_location: null,
        has_insurance: false,
        insurance_location: null,
        contact_person: null,
        contact_person_id: null,
        personal_notes: null,
        farewell_message: null,
        media_path: null,
        release_audience: 'trustees' as EstateAudience,
        recipient_person_ids: [],
        required_confirmations: 2,
        updated_at: nowIso(),
        ...patch,
      };
      data.estateInfos.push(info);
    }
    return info;
  },

  listEstateCases(familyId: string): EstateCase[] {
    return data.estateCases
      .filter((c) => c.family_id === familyId)
      .map((c) => ({
        ...c,
        confirmations: data.estateConfirmations.filter((x) => x.case_id === c.id),
      }))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  getEstateCase(id: string): EstateCase | null {
    const c = data.estateCases.find((x) => x.id === id);
    if (!c) return null;
    return { ...c, confirmations: data.estateConfirmations.filter((x) => x.case_id === id) };
  },
  reportDeath(input: {
    familyId: string;
    subjectUserId: string;
    subjectPersonId: string | null;
    reportedByUserId: string | null;
    reportedByTrusteeId: string | null;
    reportedByName: string;
    note?: string | null;
  }): EstateCase {
    const info = data.estateInfos.find((e) => e.owner_user_id === input.subjectUserId);
    const required = info?.required_confirmations ?? 2;
    const c: EstateCase = {
      id: newId('case'),
      family_id: input.familyId,
      subject_user_id: input.subjectUserId,
      subject_person_id: input.subjectPersonId,
      reported_by_user_id: input.reportedByUserId,
      reported_by_trustee_id: input.reportedByTrusteeId,
      reported_by_name: input.reportedByName,
      status: 'awaiting',
      required_confirmations: required,
      note: input.note ?? null,
      created_at: nowIso(),
      updated_at: nowIso(),
      released_at: null,
    };
    data.estateCases.unshift(c);
    // Benachrichtigung für die Familie (Missbrauchsschutz: Melder protokolliert)
    data.notifications.unshift({
      id: newId('nt'),
      family_id: input.familyId,
      recipient_user_id: null,
      actor_user_id: input.reportedByUserId,
      category: 'info',
      title: 'Nachlass-Freigabe angestoßen',
      body: `${input.reportedByName} hat eine Nachlass-Freigabe angestoßen. Vertrauenspersonen werden um Bestätigung gebeten.`,
      data: { caseId: c.id },
      is_read: false,
      created_at: nowIso(),
    });
    return { ...c, confirmations: [] };
  },
  confirmEstateCase(input: {
    caseId: string;
    trusteeId: string | null;
    confirmerName: string;
    decision: 'confirm' | 'reject';
    note?: string | null;
  }): EstateCase {
    const c = data.estateCases.find((x) => x.id === input.caseId);
    if (!c) throw new Error('Fall nicht gefunden');
    // Doppelte Bestätigung derselben Vertrauensperson verhindern.
    const already = data.estateConfirmations.find(
      (x) => x.case_id === c.id && x.trustee_id && x.trustee_id === input.trusteeId,
    );
    if (!already) {
      data.estateConfirmations.push({
        id: newId('conf'),
        case_id: c.id,
        trustee_id: input.trusteeId,
        confirmer_name: input.confirmerName,
        decision: input.decision,
        note: input.note ?? null,
        created_at: nowIso(),
      });
    }
    const confirms = data.estateConfirmations.filter(
      (x) => x.case_id === c.id && x.decision === 'confirm',
    ).length;
    const rejects = data.estateConfirmations.filter(
      (x) => x.case_id === c.id && x.decision === 'reject',
    ).length;
    if (input.decision === 'reject' && rejects > 0) {
      c.status = 'rejected';
    } else if (confirms >= c.required_confirmations) {
      c.status = 'released';
      c.released_at = c.released_at ?? nowIso();
    }
    c.updated_at = nowIso();
    return this.getEstateCase(c.id)!;
  },
  revokeEstateCase(caseId: string): EstateCase {
    const c = data.estateCases.find((x) => x.id === caseId);
    if (!c) throw new Error('Fall nicht gefunden');
    c.status = 'rejected';
    c.released_at = null;
    c.updated_at = nowIso();
    return this.getEstateCase(c.id)!;
  },

  // ===================== Family Safety & Live Location =====================
  getMyLiveShare(userId: string): LiveShare | null {
    return data.liveShares.find((s) => s.user_id === userId) ?? null;
  },
  listLiveShares(familyId: string): LiveShare[] {
    return data.liveShares
      .filter((s) => s.family_id === familyId && s.active)
      .map((s) => ({ ...s, person: data.persons.find((p) => p.id === s.person_id) }));
  },
  setLiveShare(input: {
    familyId: string;
    userId: string;
    personId: string | null;
    status: LiveStatus;
    statusLabel?: string | null;
    placeLabel?: string | null;
    battery?: number | null;
    audience: SafetyAudience;
    recipientPersonIds?: string[];
    duration: ShareDuration;
    expiresAt?: string | null;
  }): LiveShare {
    let s = data.liveShares.find((x) => x.user_id === input.userId);
    const patch: Partial<LiveShare> = {
      family_id: input.familyId,
      person_id: input.personId,
      active: input.duration !== 'off',
      status: input.status,
      status_label: input.statusLabel ?? null,
      place_label: input.placeLabel ?? null,
      battery: input.battery ?? null,
      audience: input.audience,
      recipient_person_ids: input.recipientPersonIds ?? [],
      duration: input.duration,
      expires_at: input.expiresAt ?? null,
      updated_at: nowIso(),
    };
    if (s) {
      Object.assign(s, patch);
    } else {
      s = { id: newId('ls'), user_id: input.userId, latitude: null, longitude: null, ...patch } as LiveShare;
      data.liveShares.push(s);
    }
    return s;
  },
  stopLiveShare(userId: string): void {
    const s = data.liveShares.find((x) => x.user_id === userId);
    if (s) {
      s.active = false;
      s.duration = 'off';
      s.updated_at = nowIso();
    }
  },

  listSafetyTrips(familyId: string): SafetyTrip[] {
    return data.safetyTrips
      .filter((t) => t.family_id === familyId)
      .map((t) => ({ ...t, person: data.persons.find((p) => p.id === t.person_id) }))
      .sort((a, b) => (a.started_at < b.started_at ? 1 : -1));
  },
  getSafetyTrip(id: string): SafetyTrip | null {
    const t = data.safetyTrips.find((x) => x.id === id);
    if (!t) return null;
    return { ...t, person: data.persons.find((p) => p.id === t.person_id) };
  },
  startTrip(input: {
    familyId: string;
    userId: string;
    personId: string | null;
    kind: SafetyTripKind;
    destinationLabel: string;
    eta?: string | null;
    audience: SafetyAudience;
    recipientPersonIds?: string[];
    battery?: number | null;
  }): SafetyTrip {
    const t: SafetyTrip = {
      id: newId('trip'),
      family_id: input.familyId,
      user_id: input.userId,
      person_id: input.personId,
      kind: input.kind,
      destination_label: input.destinationLabel,
      eta: input.eta ?? null,
      status: 'active',
      audience: input.audience,
      recipient_person_ids: input.recipientPersonIds ?? [],
      battery: input.battery ?? null,
      started_at: nowIso(),
      arrived_at: null,
      updated_at: nowIso(),
    };
    data.safetyTrips.unshift(t);
    return this.getSafetyTrip(t.id)!;
  },
  arriveTrip(id: string): SafetyTrip {
    const t = data.safetyTrips.find((x) => x.id === id);
    if (!t) throw new Error('Trip nicht gefunden');
    t.status = 'arrived';
    t.arrived_at = nowIso();
    t.updated_at = nowIso();
    const person = data.persons.find((p) => p.id === t.person_id);
    const name = person ? [person.first_name, person.last_name].filter(Boolean).join(' ') : 'Familienmitglied';
    data.notifications.unshift({
      id: newId('nt'), family_id: t.family_id, recipient_user_id: null, actor_user_id: t.user_id,
      category: 'info', title: 'Sicher angekommen',
      body: `${name} ist sicher angekommen (${t.destination_label}).`,
      data: { tripId: t.id }, is_read: false, created_at: nowIso(),
    });
    return this.getSafetyTrip(t.id)!;
  },
  cancelTrip(id: string): SafetyTrip {
    const t = data.safetyTrips.find((x) => x.id === id);
    if (!t) throw new Error('Trip nicht gefunden');
    t.status = 'cancelled';
    t.updated_at = nowIso();
    return this.getSafetyTrip(t.id)!;
  },

  listSafetyAlerts(familyId: string): SafetyAlert[] {
    return data.safetyAlerts
      .filter((a) => a.family_id === familyId)
      .map((a) => ({ ...a, person: data.persons.find((p) => p.id === a.person_id) }))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  triggerSos(input: {
    familyId: string;
    userId: string;
    personId: string | null;
    message?: string | null;
    placeLabel?: string | null;
    battery?: number | null;
  }): SafetyAlert {
    const a: SafetyAlert = {
      id: newId('sos'),
      family_id: input.familyId,
      user_id: input.userId,
      person_id: input.personId,
      message: input.message ?? null,
      place_label: input.placeLabel ?? null,
      latitude: null,
      longitude: null,
      battery: input.battery ?? null,
      status: 'active',
      created_at: nowIso(),
      resolved_at: null,
    };
    data.safetyAlerts.unshift(a);
    const senderPerson = data.persons.find((p) => p.id === input.personId);
    const senderName = senderPerson
      ? [senderPerson.first_name, senderPerson.last_name].filter(Boolean).join(' ')
      : this.displayNameForUser(input.userId);
    // Benachrichtigung an Vertrauenspersonen / Familie (Inner & Trusted Circle, Notfallkontakte).
    data.notifications.unshift({
      id: newId('nt'), family_id: input.familyId, recipient_user_id: null, actor_user_id: input.userId,
      category: 'emergency', title: `🚨 SOS von ${senderName}`,
      body: input.message
        ? `${input.message} · Standort und Uhrzeit sind verfügbar.`
        : 'Standort und Uhrzeit sind verfügbar.',
      data: { type: 'sos', route: 'Sos', alertId: a.id }, is_read: false, created_at: nowIso(),
    });
    // Bestätigung für den auslösenden Nutzer.
    data.notifications.unshift({
      id: newId('nt'), family_id: input.familyId, recipient_user_id: input.userId, actor_user_id: input.userId,
      category: 'emergency', title: '🚨 Dein SOS wurde gesendet.',
      body: 'Deine Vertrauenspersonen wurden benachrichtigt. Tippe für Details.',
      data: { type: 'sos', route: 'Sos', alertId: a.id }, is_read: false, created_at: nowIso(),
    });
    return { ...a, person: data.persons.find((p) => p.id === a.person_id) };
  },
  resolveSos(id: string): SafetyAlert {
    const a = data.safetyAlerts.find((x) => x.id === id);
    if (!a) throw new Error('Meldung nicht gefunden');
    a.status = 'resolved';
    a.resolved_at = nowIso();
    return { ...a, person: data.persons.find((p) => p.id === a.person_id) };
  },

  // ===================== Family Vault =====================
  listVaultEntries(ownerUserId: string): VaultEntry[] {
    return data.vaultEntries.filter((v) => v.owner_user_id === ownerUserId);
  },
  saveVaultEntry(input: Partial<VaultEntry> & { id?: string; familyId: string; ownerUserId: string }): VaultEntry {
    if (input.id) {
      const e = data.vaultEntries.find((v) => v.id === input.id);
      if (!e) throw new Error('Eintrag nicht gefunden');
      Object.assign(e, input, { updated_at: nowIso() });
      return e;
    }
    const e: VaultEntry = {
      id: newId('v'),
      family_id: input.familyId,
      owner_user_id: input.ownerUserId,
      category: input.category ?? 'sonstige',
      title: input.title ?? 'Dokument',
      description: input.description ?? null,
      location: input.location ?? null,
      contact_person: input.contact_person ?? null,
      contact_person_id: input.contact_person_id ?? null,
      has_document: input.has_document ?? false,
      release_audience: input.release_audience ?? 'trustees',
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    data.vaultEntries.push(e);
    return e;
  },
  deleteVaultEntry(id: string): void {
    data.vaultEntries = data.vaultEntries.filter((v) => v.id !== id);
  },

  listLegacyItems(ownerUserId: string): LegacyItem[] {
    return data.legacyItems.filter((l) => l.owner_user_id === ownerUserId);
  },
  saveLegacyItem(input: Partial<LegacyItem> & { id?: string; familyId: string; ownerUserId: string }): LegacyItem {
    if (input.id) {
      const e = data.legacyItems.find((l) => l.id === input.id);
      if (!e) throw new Error('Eintrag nicht gefunden');
      Object.assign(e, input, { updated_at: nowIso() });
      return e;
    }
    const e: LegacyItem = {
      id: newId('lg'),
      family_id: input.familyId,
      owner_user_id: input.ownerUserId,
      kind: input.kind ?? 'erinnerung',
      title: input.title ?? '',
      content: input.content ?? '',
      for_audience: input.for_audience ?? 'inner',
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    data.legacyItems.push(e);
    return e;
  },
  deleteLegacyItem(id: string): void {
    data.legacyItems = data.legacyItems.filter((l) => l.id !== id);
  },

  listFarewellMessages(ownerUserId: string): FarewellMessage[] {
    return data.farewellMessages.filter((m) => m.owner_user_id === ownerUserId);
  },
  saveFarewellMessage(input: Partial<FarewellMessage> & { id?: string; familyId: string; ownerUserId: string }): FarewellMessage {
    if (input.id) {
      const e = data.farewellMessages.find((m) => m.id === input.id);
      if (!e) throw new Error('Nachricht nicht gefunden');
      Object.assign(e, input, { updated_at: nowIso() });
      return e;
    }
    const e: FarewellMessage = {
      id: newId('fw'),
      family_id: input.familyId,
      owner_user_id: input.ownerUserId,
      kind: input.kind ?? 'text',
      title: input.title ?? '',
      recipient: input.recipient ?? 'inner',
      content: input.content ?? null,
      media_path: input.media_path ?? null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    data.farewellMessages.push(e);
    return e;
  },
  deleteFarewellMessage(id: string): void {
    data.farewellMessages = data.farewellMessages.filter((m) => m.id !== id);
  },

  // ===================== Familienfilm =====================
  listFilmProjects(familyId: string): FilmProject[] {
    return data.filmProjects
      .filter((f) => f.family_id === familyId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  getFilmProject(id: string): FilmProject | null {
    return data.filmProjects.find((f) => f.id === id) ?? null;
  },
  createFilmProject(input: {
    familyId: string;
    ownerUserId: string;
    kind: FilmKind;
    title: string;
    subtitle?: string | null;
    music?: FilmMusicMood;
    lock?: FilmLock;
    visibility?: VisibilityLevel;
    options: FilmOptions;
    auto?: boolean;
  }): FilmProject {
    const lock = input.lock ?? 'none';
    const open = new Date();
    let openAt: string | null = null;
    if (lock === 'years5') { open.setFullYear(open.getFullYear() + 5); openAt = open.toISOString(); }
    else if (lock === 'years10') { open.setFullYear(open.getFullYear() + 10); openAt = open.toISOString(); }
    else if (lock === 'years20') { open.setFullYear(open.getFullYear() + 20); openAt = open.toISOString(); }
    const f: FilmProject = {
      id: newId('film'),
      family_id: input.familyId,
      owner_user_id: input.ownerUserId,
      kind: input.kind,
      title: input.title,
      subtitle: input.subtitle ?? null,
      music: input.music ?? 'emotional',
      lock,
      open_at: openAt,
      visibility: input.visibility ?? 'family',
      options: input.options,
      hidden_chapters: [],
      cover_path: null,
      auto: input.auto ?? false,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    data.filmProjects.unshift(f);
    return f;
  },
  updateFilmProject(id: string, patch: Partial<FilmProject>): FilmProject {
    const f = data.filmProjects.find((x) => x.id === id);
    if (!f) throw new Error('Film nicht gefunden');
    Object.assign(f, patch, { updated_at: nowIso() });
    return f;
  },
  deleteFilmProject(id: string): void {
    data.filmProjects = data.filmProjects.filter((f) => f.id !== id);
  },

  // ===================== Legacy AI · Familienstimmen =====================
  setPersonLegend(personId: string, value: boolean): void {
    const p = data.persons.find((x) => x.id === personId);
    if (p) p.is_legend = value;
  },
  listLifeStories(personId: string): LifeStory[] {
    return data.lifeStories
      .filter((s) => s.person_id === personId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  addLifeStory(input: {
    familyId: string;
    personId: string;
    question: string;
    kind: LifeStoryKind;
    content?: string | null;
    mediaUri?: string | null;
    isFutureQuestion?: boolean;
  }): LifeStory {
    const s: LifeStory = {
      id: newId('ls'),
      family_id: input.familyId,
      person_id: input.personId,
      question: input.question,
      kind: input.kind,
      content: input.content ?? null,
      media_path: input.mediaUri ?? null,
      is_future_question: input.isFutureQuestion ?? false,
      created_at: nowIso(),
    };
    data.lifeStories.unshift(s);
    return s;
  },
  listFamilyLifeStories(familyId: string): LifeStory[] {
    return data.lifeStories
      .filter((s) => s.family_id === familyId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  listFamilyWisdoms(familyId: string): FamilyWisdom[] {
    return data.familyWisdoms
      .filter((w) => w.family_id === familyId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  addFamilyWisdom(input: { familyId: string; text: string; authorPersonId?: string | null }): FamilyWisdom {
    const w: FamilyWisdom = {
      id: newId('fw'),
      family_id: input.familyId,
      text: input.text,
      author_person_id: input.authorPersonId ?? null,
      created_at: nowIso(),
    };
    data.familyWisdoms.unshift(w);
    return w;
  },

  // ===================== Familienmuseum · Artefakte =====================
  listArtifacts(familyId: string): Artifact[] {
    return data.artifacts
      .filter((a) => a.family_id === familyId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  saveArtifact(input: {
    id?: string;
    familyId: string;
    category: ArtifactCategory;
    title: string;
    description?: string | null;
    story?: string | null;
    ownerPersonId?: string | null;
    location?: string | null;
    year?: number | null;
    createdBy: string;
  }): Artifact {
    if (input.id) {
      const a = data.artifacts.find((x) => x.id === input.id);
      if (!a) throw new Error('Artefakt nicht gefunden');
      Object.assign(a, {
        category: input.category, title: input.title, description: input.description ?? null,
        story: input.story ?? null, owner_person_id: input.ownerPersonId ?? null,
        location: input.location ?? null, year: input.year ?? null,
      });
      return a;
    }
    const a: Artifact = {
      id: newId('art'),
      family_id: input.familyId,
      category: input.category,
      title: input.title,
      description: input.description ?? null,
      story: input.story ?? null,
      owner_person_id: input.ownerPersonId ?? null,
      location: input.location ?? null,
      year: input.year ?? null,
      photo_path: null,
      created_by: input.createdBy,
      created_at: nowIso(),
    };
    data.artifacts.unshift(a);
    return a;
  },
  deleteArtifact(id: string): void {
    data.artifacts = data.artifacts.filter((a) => a.id !== id);
  },

  // ===================== Feedback =====================
  createFeedback(input: { familyId: string; userId: string | null; kind: FeedbackKind; message: string }): Feedback {
    const f: Feedback = {
      id: newId('fb'),
      family_id: input.familyId,
      user_id: input.userId,
      kind: input.kind,
      message: input.message,
      created_at: nowIso(),
    };
    data.feedback.unshift(f);
    return f;
  },

  /** DSGVO: vollständiger Datenexport der Familie (Demo-Dump). */
  exportData(): unknown {
    return JSON.parse(JSON.stringify(data));
  },
};

/**
 * Exportierter Store: jeder Methodenaufruf speichert den Datensatz anschließend
 * (debounced) persistent, damit nach einem Reload nichts verloren geht.
 */
export const demoStore: typeof demoStoreImpl = new Proxy(demoStoreImpl, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (typeof value === 'function') {
      return (...args: unknown[]) => {
        const result = (value as (...a: unknown[]) => unknown).apply(target, args);
        schedulePersist();
        return result;
      };
    }
    return value;
  },
});

/** Ermittelt ein Profil zu einer Nutzer-ID (Demo). */
function resolveAuthor(userId: string | null): Profile | undefined {
  if (!userId) return undefined;
  if (userId === data.profile.id) return data.profile;
  const person = data.persons.find((p) => p.user_id === userId);
  if (person) {
    return {
      id: userId,
      email: null,
      full_name: [person.first_name, person.last_name].filter(Boolean).join(' '),
      avatar_url: person.avatar_url,
      bio: null,
      created_at: person.created_at,
      updated_at: person.updated_at,
    };
  }
  return {
    id: userId,
    email: null,
    full_name: 'Familienmitglied',
    avatar_url: null,
    bio: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}
