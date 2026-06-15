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
};
