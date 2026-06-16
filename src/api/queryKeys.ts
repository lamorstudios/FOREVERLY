/** Zentrale React-Query Schlüssel für konsistentes Caching/Invalidieren. */
export const qk = {
  profile: (userId: string) => ['profile', userId] as const,
  families: () => ['families'] as const,
  family: (id: string) => ['family', id] as const,
  members: (familyId: string) => ['members', familyId] as const,
  invitations: (familyId: string) => ['invitations', familyId] as const,
  persons: (familyId: string) => ['persons', familyId] as const,
  person: (id: string) => ['person', id] as const,
  relationships: (familyId: string) => ['relationships', familyId] as const,
  memories: (familyId: string, personId?: string) =>
    ['memories', familyId, personId ?? 'all'] as const,
  photos: (familyId: string, personId?: string) =>
    ['photos', familyId, personId ?? 'all'] as const,
  audios: (familyId: string, personId?: string) =>
    ['audios', familyId, personId ?? 'all'] as const,
  capsules: (familyId: string) => ['capsules', familyId] as const,
  capsule: (id: string) => ['capsule', id] as const,
  upcomingCapsules: () => ['capsules', 'upcoming'] as const,
  activities: (familyId: string) => ['activities', familyId] as const,
  signedUrl: (bucket: string, path: string) =>
    ['signedUrl', bucket, path] as const,
  // Phase 2
  statuses: (familyId: string) => ['statuses', familyId] as const,
  notifications: (familyId: string) => ['notifications', familyId] as const,
  emergencyContacts: (familyId: string) => ['emergencyContacts', familyId] as const,
  emergencyEvents: (familyId: string) => ['emergencyEvents', familyId] as const,
  calendar: (familyId: string) => ['calendar', familyId] as const,
  calendarEvent: (id: string) => ['calendarEvent', id] as const,
  documents: (familyId: string) => ['documents', familyId] as const,
  // Phase 3 · Familienhistoriker
  historianAsk: (familyId: string, query: string) =>
    ['historian', 'ask', familyId, query] as const,
  historianSearch: (familyId: string, query: string) =>
    ['historian', 'search', familyId, query] as const,
  wisdoms: (familyId: string) => ['historian', 'wisdoms', familyId] as const,
  timeline: (familyId: string) => ['historian', 'timeline', familyId] as const,
  importantPeople: (familyId: string) =>
    ['historian', 'people', familyId] as const,
  personInsight: (familyId: string, personId: string) =>
    ['historian', 'insight', familyId, personId] as const,
  knowledgeGaps: (familyId: string) =>
    ['historian', 'gaps', familyId] as const,
  // Phase 4 · Familienbuch
  bookProjects: (familyId: string) => ['book', 'projects', familyId] as const,
  book: (familyId: string, projectId: string) =>
    ['book', 'generated', familyId, projectId] as const,
  // Trusted Circle / Vertrauenskreis
  trustedContacts: (familyId: string, personId?: string) =>
    ['trustedContacts', familyId, personId ?? 'all'] as const,
  // Phase 4.5 · Familiennähe & Zweige
  closeness: (familyId: string, userId: string) =>
    ['closeness', familyId, userId] as const,
  branches: (familyId: string) => ['branches', familyId] as const,
  // Phase 5 · Smart Invites
  smartInvites: (familyId: string) => ['smartInvites', familyId] as const,
  suggestions: (familyId: string) => ['suggestions', familyId] as const,
  // Phase 6 · Familienmomente & Events
  events: (familyId: string) => ['events', familyId] as const,
  event: (id: string) => ['event', id] as const,
  eventParticipants: (eventId: string) => ['eventParticipants', eventId] as const,
  moments: (familyId: string, scope: string) =>
    ['moments', familyId, scope] as const,
  moment: (id: string) => ['moment', id] as const,
  momentComments: (momentId: string) => ['momentComments', momentId] as const,
  chronicle: (familyId: string) => ['chronicle', familyId] as const,
  photoMemories: (familyId: string) => ['photoMemories', familyId] as const,
  // Trustee & Nachlass-Freigabe
  trustees: (ownerUserId: string) => ['trustees', ownerUserId] as const,
  estateInfo: (ownerUserId: string) => ['estateInfo', ownerUserId] as const,
  estateCases: (familyId: string) => ['estateCases', familyId] as const,
  estateCase: (id: string) => ['estateCase', id] as const,
  // Family Safety & Live Location
  liveShares: (familyId: string) => ['liveShares', familyId] as const,
  myLiveShare: (userId: string) => ['myLiveShare', userId] as const,
  safetyTrips: (familyId: string) => ['safetyTrips', familyId] as const,
  safetyTrip: (id: string) => ['safetyTrip', id] as const,
  safetyAlerts: (familyId: string) => ['safetyAlerts', familyId] as const,
  // Family Vault · Dokumente & Vermächtnis
  vaultEntries: (ownerUserId: string) => ['vaultEntries', ownerUserId] as const,
  legacyItems: (ownerUserId: string) => ['legacyItems', ownerUserId] as const,
  farewellMessages: (ownerUserId: string) => ['farewellMessages', ownerUserId] as const,
};
