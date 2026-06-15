/**
 * Domänentypen für Foreverly – spiegeln das Datenbankschema wider.
 */

export type MemberRole = 'admin' | 'member';
export type ContentType = 'text' | 'photo' | 'audio';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export type ClosenessLevel = 'inner' | 'sehr_nah' | 'familie' | 'erweitert';
export type VisibilityLevel =
  | 'family'
  | 'inner'
  | 'sehr_nah'
  | 'selected'
  | 'branch'
  | 'private';

export type RelationshipType =
  | 'vater'
  | 'mutter'
  | 'sohn'
  | 'tochter'
  | 'bruder'
  | 'schwester'
  | 'oma'
  | 'opa'
  | 'tante'
  | 'onkel'
  | 'cousin'
  | 'cousine'
  | 'nichte'
  | 'neffe'
  | 'ehepartner'
  | 'lebenspartner'
  | 'stiefvater'
  | 'stiefmutter'
  | 'stiefkind'
  | 'adoptivkind'
  | 'pflegekind'
  | 'sonstige';

export type RelationshipCategory =
  | 'biological'
  | 'married'
  | 'patchwork'
  | 'adoption';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  name: string;
  image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  profile?: Profile;
}

export interface Invitation {
  id: string;
  family_id: string;
  code: string;
  role: MemberRole;
  email: string | null;
  status: InvitationStatus;
  invited_by: string;
  accepted_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
  // Phase 5 · Smart Invites
  person_id?: string | null;
  inviter_person_id?: string | null;
  relationship_type?: RelationshipType | null;
  suggested_closeness?: ClosenessLevel | null;
  message?: string | null;
}

export type SuggestionStatus = 'pending' | 'confirmed' | 'dismissed';

export interface RelationshipSuggestion {
  id: string;
  family_id: string;
  from_person_id: string;
  to_person_id: string;
  suggested_type: RelationshipType;
  suggested_category: RelationshipCategory;
  reason: string | null;
  status: SuggestionStatus;
  created_by: string | null;
  created_at: string;
}

// ===================== Phase 6 · Familienmomente & Events =====================

export type FamilyEventType =
  | 'grillfest'
  | 'geburtstag'
  | 'weihnachten'
  | 'hochzeit'
  | 'taufe'
  | 'einschulung'
  | 'urlaub'
  | 'feier'
  | 'sonstige';

export type RsvpStatus = 'yes' | 'maybe' | 'no';
export type MomentKind = 'text' | 'photo' | 'video' | 'audio';

export interface FamilyEvent {
  id: string;
  family_id: string;
  type: FamilyEventType;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  host_user_id: string | null;
  host_person_id: string | null;
  visibility: VisibilityLevel;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  participant_count?: number;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  person_id: string | null;
  user_id: string | null;
  rsvp: RsvpStatus | null;
  comment: string | null;
  bringing: string | null;
  responded_at: string | null;
  created_at: string;
  person?: Person;
}

export interface Moment {
  id: string;
  family_id: string;
  author_user_id: string | null;
  kind: MomentKind;
  text: string | null;
  storage_path: string | null;
  duration_seconds: number | null;
  visibility: VisibilityLevel;
  event_id: string | null;
  created_at: string;
  author?: Profile;
  comment_count?: number;
}

export interface MomentComment {
  id: string;
  moment_id: string;
  author_user_id: string | null;
  text: string;
  created_at: string;
  author?: Profile;
}

export interface ChronicleEntry {
  id: string;
  year: number;
  date: string | null;
  title: string;
  source_type: string;
  source_id: string | null;
}

export interface MemoryChallenge {
  key: string;
  title: string;
  description: string;
  prompt_type: 'photo' | 'audio' | 'memory';
  month: number;
}

export interface Person {
  id: string;
  family_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  birth_place: string | null;
  death_date: string | null;
  biography: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  family_id: string;
  from_person_id: string;
  to_person_id: string;
  type: RelationshipType;
  category: RelationshipCategory;
  created_by: string | null;
  created_at: string;
}

export interface Memory {
  id: string;
  family_id: string;
  person_id: string | null;
  author_id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  occurred_on: string | null;
  visibility?: VisibilityLevel;
  visibility_branch_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  family_id: string;
  memory_id: string | null;
  person_id: string | null;
  storage_path: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  uploaded_by: string;
  created_at: string;
}

export interface Audio {
  id: string;
  family_id: string;
  memory_id: string | null;
  person_id: string | null;
  storage_path: string;
  title: string | null;
  duration_seconds: number | null;
  recorded_by: string;
  created_at: string;
}

export interface TimeCapsule {
  id: string;
  family_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  text_content: string | null;
  storage_path: string | null;
  open_at: string;
  is_opened: boolean;
  visibility?: VisibilityLevel;
  visibility_branch_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeCapsuleRecipient {
  id: string;
  capsule_id: string;
  person_id: string | null;
  user_id: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  family_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string | null;
  created_at: string;
  actor?: Profile;
}

export interface UpcomingCapsule {
  id: string;
  family_id: string;
  title: string;
  open_at: string;
}

// ===================== Phase 2 =====================

export type StatusLevel = 'gut' | 'okay' | 'allein' | 'unwohl' | 'hilfe';

export type CalendarEventType =
  | 'geburtstag'
  | 'jahrestag'
  | 'arzttermin'
  | 'familienereignis'
  | 'erinnerung';

export type DocumentKind =
  | 'testament'
  | 'patientenverfuegung'
  | 'vorsorgevollmacht'
  | 'versicherung'
  | 'sonstige';

export type EmergencyState = 'active' | 'resolved';

export interface MemberStatus {
  id: string;
  family_id: string;
  person_id: string;
  level: StatusLevel;
  message: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  person?: Person;
}

export interface AppNotification {
  id: string;
  family_id: string;
  recipient_user_id: string | null;
  actor_user_id: string | null;
  category: 'status' | 'emergency' | 'calendar' | 'info';
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  family_id: string;
  person_id: string | null;
  name: string;
  relation: string | null;
  phone: string | null;
  note: string | null;
  priority: number;
  created_by: string | null;
  created_at: string;
}

export interface EmergencyEvent {
  id: string;
  family_id: string;
  triggered_by: string | null;
  state: EmergencyState;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  message: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface CalendarEvent {
  id: string;
  family_id: string;
  type: CalendarEventType;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  is_annual: boolean;
  for_whole_family: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  participant_ids?: string[];
}

export interface FamilyDocument {
  id: string;
  family_id: string;
  kind: DocumentKind;
  title: string;
  is_available: boolean;
  location: string | null;
  note: string | null;
  contact_person: string | null;
  contact_person_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ===================== Phase 4 · Familienbuch =====================

export type BookType =
  | 'komplett'
  | 'person'
  | 'oma_opa'
  | 'jahr'
  | 'erinnerungen'
  | 'lebensweisheiten';

export type BookExportFormat = 'pdf' | 'print' | 'share';
export type BookExportStatus = 'pending' | 'ready' | 'failed';

export interface BookOptions {
  personId?: string;
  year?: number;
}

export interface BookProject {
  id: string;
  family_id: string;
  type: BookType;
  title: string;
  subtitle: string | null;
  cover_photo_path: string | null;
  hidden_chapters: string[];
  chapter_order: string[];
  options: BookOptions;
  status: 'draft' | 'ready' | 'exported';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookExport {
  id: string;
  project_id: string;
  format: BookExportFormat;
  status: BookExportStatus;
  url: string | null;
  print_ready: boolean;
  created_at: string;
}

// ===================== Inner Circle & Familiennähe (Phase 4.5) =====================

export interface ClosenessRating {
  id: string;
  family_id: string;
  rater_user_id: string;
  person_id: string;
  level: ClosenessLevel;
  created_at: string;
  updated_at: string;
}

export interface BranchMember {
  id: string;
  branch_id: string;
  person_id: string;
}

export interface FamilyBranch {
  id: string;
  family_id: string;
  name: string;
  color: string | null;
  created_by: string | null;
  created_at: string;
  member_ids?: string[];
}

// ===================== Trusted Circle / Vertrauenskreis =====================

export type TrustedRole =
  | 'nachbar'
  | 'freund'
  | 'hausmeister'
  | 'pflegekontakt'
  | 'vereinsfreund'
  | 'hausarzt'
  | 'sonstige';

export interface TrustedContact {
  id: string;
  family_id: string;
  person_id: string | null;
  name: string;
  role: TrustedRole;
  phone: string | null;
  email: string | null;
  location: string | null;
  note: string | null;
  availability: string | null;
  is_emergency: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  person?: Person;
}
