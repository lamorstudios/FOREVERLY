/**
 * Domänentypen für FAMII – spiegeln das Datenbankschema wider.
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
  /** Phase 8: Transkription/Analyse von Audio-/Videomomenten. */
  transcript?: string | null;
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
  /** Phase 12: als „Familienlegende" markiert (eigene Legacy-Seite). */
  is_legend?: boolean;
  /**
   * Phase 16 · Ehrenmitglied / Familienerbe: respektvolles Gedenkprofil für
   * (meist bereits verstorbene) Familienmitglieder. Kein Trauerbereich,
   * sondern Bewahrung der Familiengeschichte.
   */
  is_memorial?: boolean;
  /** Phase 16: Besonderheiten dieser Person (frei beschreibbar). */
  traits?: string | null;
}

// ===================== Phase 16 · Ehrenmitglieder & Familienerbe =====================

/** Ein oft gesagter Satz / Spruch einer Person („Was sie oft gesagt hat"). */
export interface PersonQuote {
  id: string;
  family_id: string;
  person_id: string;
  text: string;
  /** Optionaler Anlass/Kontext („sagte er beim Kaffee"). */
  context: string | null;
  /** Wer den Spruch beigetragen hat (Nachvollziehbarkeit). */
  added_by_user_id: string | null;
  added_by_name: string;
  created_at: string;
}

/** Eine Erinnerung/Geschichte, die ein Familienmitglied an die Person hinterlässt. */
export interface PersonTribute {
  id: string;
  family_id: string;
  person_id: string;
  text: string;
  author_user_id: string | null;
  author_name: string;
  created_at: string;
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
  /** Phase 8: automatische Transkription (durchsuchbar). */
  transcript?: string | null;
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
  /** Phase 7: erst nach erfolgreicher Nachlassfreigabe öffnen. */
  open_on_death?: boolean;
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

// ===================== Trustee & Nachlass-Freigabe =====================

/** Vertrauensperson, die einen Todesfall bestätigen darf. */
export interface Trustee {
  id: string;
  family_id: string;
  owner_user_id: string; // wem diese Vertrauensperson zugeordnet ist
  person_id: string | null; // verknüpftes FAMII-Profil (optional)
  name: string;
  relation: string; // z.B. „Bruder", „Mutter", „Notar-Kontakt"
  phone: string | null;
  email: string | null;
  role: string | null; // freie Rollenbeschreibung
  can_confirm_death: boolean;
  created_at: string;
}

/** Wer darf den freigegebenen Nachlassbereich sehen? */
export type EstateAudience =
  | 'children' // alle Kinder
  | 'spouse' // Ehepartner
  | 'inner' // Inner Circle
  | 'trustees' // Vertrauenspersonen
  | 'selected'; // ausgewählte Empfänger

/** Hinterlegte Nachlasshinweise (keine sensiblen Zugangsdaten!). */
export interface EstateInfo {
  id: string;
  family_id: string;
  owner_user_id: string;
  has_will: boolean;
  will_location: string | null;
  has_patient_decree: boolean;
  patient_decree_location: string | null;
  has_power_of_attorney: boolean;
  power_of_attorney_location: string | null;
  has_insurance: boolean;
  insurance_location: string | null;
  contact_person: string | null;
  contact_person_id: string | null;
  personal_notes: string | null;
  farewell_message: string | null;
  media_path: string | null; // optionale Audio-/Video-Botschaft
  release_audience: EstateAudience;
  recipient_person_ids: string[]; // bei „selected"
  required_confirmations: number; // Standard 2
  updated_at: string;
}

export type EstateCaseStatus = 'awaiting' | 'released' | 'rejected';

/** Freigabeprozess nach Meldung eines Todesfalls. */
export interface EstateCase {
  id: string;
  family_id: string;
  subject_user_id: string; // Besitzer des Nachlasses
  subject_person_id: string | null;
  reported_by_user_id: string | null;
  reported_by_trustee_id: string | null;
  reported_by_name: string;
  status: EstateCaseStatus;
  required_confirmations: number;
  note: string | null;
  created_at: string;
  updated_at: string;
  released_at: string | null;
  confirmations?: EstateConfirmation[];
}

export interface EstateConfirmation {
  id: string;
  case_id: string;
  trustee_id: string | null;
  confirmer_name: string;
  decision: 'confirm' | 'reject';
  note: string | null;
  created_at: string;
}

// ===================== Family Safety & Live Location =====================

/** Wer darf etwas sehen (Standort, Heimweg, SOS). */
export type SafetyAudience = 'inner' | 'trusted' | 'family' | 'selected';

/** Dauer einer Standortfreigabe. */
export type ShareDuration = 'off' | '1h' | 'today' | 'custom' | 'permanent';

/** Aktivitäts-/Ortsstatus auf der Familienkarte. */
export type LiveStatus =
  | 'home'
  | 'moving'
  | 'work'
  | 'school'
  | 'doctor'
  | 'vacation'
  | 'custom';

/** Freiwillige Live-Standortfreigabe einer Person (Standard: deaktiviert). */
export interface LiveShare {
  id: string;
  family_id: string;
  user_id: string;
  person_id: string | null;
  active: boolean;
  status: LiveStatus;
  status_label: string | null; // benutzerdefinierter Status
  place_label: string | null; // z.B. „Zuhause", „Praxis Dr. Wagner"
  latitude: number | null;
  longitude: number | null;
  battery: number | null; // 0–100
  audience: SafetyAudience;
  recipient_person_ids: string[];
  duration: ShareDuration;
  expires_at: string | null; // automatische Beendigung
  updated_at: string;
  person?: Person;
}

/** „Heimweg teilen" / „Sicher angekommen". */
export type SafetyTripKind = 'heimweg' | 'safe_arrival';
export type SafetyTripStatus = 'active' | 'arrived' | 'cancelled';

export interface SafetyTrip {
  id: string;
  family_id: string;
  user_id: string;
  person_id: string | null;
  kind: SafetyTripKind;
  destination_label: string;
  eta: string | null; // ISO-Zeitpunkt der erwarteten Ankunft
  status: SafetyTripStatus;
  audience: SafetyAudience;
  recipient_person_ids: string[];
  battery: number | null;
  started_at: string;
  arrived_at: string | null;
  updated_at: string;
  person?: Person;
}

/** SOS-Notfallmeldung mit letzter bekannter Position. */
export interface SafetyAlert {
  id: string;
  family_id: string;
  user_id: string;
  person_id: string | null;
  message: string | null;
  place_label: string | null;
  latitude: number | null;
  longitude: number | null;
  battery: number | null;
  status: 'active' | 'resolved';
  created_at: string;
  resolved_at: string | null;
  person?: Person;
}

// ===================== Family Vault · Dokumente & Vermächtnis =====================

export type VaultCategory =
  | 'testament'
  | 'patientenverfuegung'
  | 'vorsorgevollmacht'
  | 'versicherung'
  | 'immobilie'
  | 'mietvertrag'
  | 'fahrzeug'
  | 'notar'
  | 'sonstige';

/** Eintrag im Family Vault – nur Hinweise/Orte, KEINE Zugangsdaten. */
export interface VaultEntry {
  id: string;
  family_id: string;
  owner_user_id: string;
  category: VaultCategory;
  title: string;
  description: string | null;
  location: string | null; // „Ordner befindet sich…"
  contact_person: string | null; // „Kontaktperson ist…"
  contact_person_id: string | null;
  has_document: boolean; // optional späterer Upload, im MVP nur Hinweis
  release_audience: EstateAudience;
  created_at: string;
  updated_at: string;
}

export type LegacyKind =
  | 'wert' // Familienwerte
  | 'lektion' // Lebenslektionen
  | 'geschichte' // Familiengeschichten
  | 'rezept' // Lieblingsrezepte
  | 'ort' // Familienorte
  | 'erinnerung'; // Erinnerungen

/** „Was ich hinterlassen möchte" – fließt später in Buch/Historiker/Film ein. */
export interface LegacyItem {
  id: string;
  family_id: string;
  owner_user_id: string;
  kind: LegacyKind;
  title: string;
  content: string;
  for_audience: EstateAudience;
  created_at: string;
  updated_at: string;
}

export type FarewellKind = 'text' | 'audio' | 'video';
export type FarewellRecipient = 'spouse' | 'children' | 'grandchildren' | 'inner' | 'selected';

/** Abschiedsnachricht – erst nach erfolgreicher Nachlassfreigabe sichtbar. */
export interface FarewellMessage {
  id: string;
  family_id: string;
  owner_user_id: string;
  kind: FarewellKind;
  title: string;
  recipient: FarewellRecipient;
  content: string | null; // Text bzw. Beschreibung
  media_path: string | null; // optionale Audio-/Video-Datei
  created_at: string;
  updated_at: string;
}

// ===================== Familienfilm & Vermächtnis-Filme =====================

export type FilmKind = 'event' | 'year' | 'person' | 'legacy' | 'documentary';
export type FilmMusicMood = 'emotional' | 'nostalgisch' | 'froehlich' | 'feierlich' | 'dokumentarisch';
export type FilmLock = 'none' | 'years5' | 'years10' | 'years20' | 'death';

export interface FilmOptions {
  personId?: string;
  year?: number;
  eventId?: string;
}

/** Gespeichertes Filmprojekt (die KI „rendert" daraus ein Storyboard). */
export interface FilmProject {
  id: string;
  family_id: string;
  owner_user_id: string;
  kind: FilmKind;
  title: string;
  subtitle: string | null;
  music: FilmMusicMood;
  lock: FilmLock;
  open_at: string | null; // bei Zeitkapsel-Filmen
  visibility: VisibilityLevel;
  options: FilmOptions;
  hidden_chapters: string[];
  cover_path: string | null;
  auto: boolean; // automatisch vorgeschlagen/erzeugt
  created_at: string;
  updated_at: string;
}

// --- Laufzeit (Storyboard, aus echten Inhalten erzeugt) ---
export type FilmSceneType = 'title' | 'photo' | 'video' | 'audio' | 'text';

export interface FilmScene {
  id: string;
  type: FilmSceneType;
  title?: string | null;
  caption?: string | null;
  mediaPath?: string | null;
  transcript?: string | null; // Originalstimme/Untertitel
  personName?: string | null;
  date?: string | null;
}

export interface FilmChapter {
  key: string;
  title: string;
  scenes: FilmScene[];
}

export interface GeneratedFilm {
  chapters: FilmChapter[];
  sceneCount: number;
  durationSec: number;
  hasOriginalVoices: boolean;
}

// ===================== Legacy AI · Familienstimmen =====================

export type LifeStoryKind = 'text' | 'audio' | 'video';

/** Antwort auf ein Lebensinterview / eine Zukunftsfrage (echte Inhalte). */
export interface LifeStory {
  id: string;
  family_id: string;
  person_id: string;
  question: string;
  kind: LifeStoryKind;
  content: string | null; // Text bzw. Begleittext
  media_path: string | null; // Audio/Video (optional)
  is_future_question: boolean; // Zeitkapsel-Frage für die Zukunft
  created_at: string;
}

/** Kurze, gesammelte Familienweisheit (für Buch/Film wiederverwendbar). */
export interface FamilyWisdom {
  id: string;
  family_id: string;
  text: string;
  author_person_id: string | null;
  created_at: string;
}

// ===================== Feedback (Phase 15) =====================

export type FeedbackKind = 'bug' | 'wish' | 'idea';

export interface Feedback {
  id: string;
  family_id: string;
  user_id: string | null;
  kind: FeedbackKind;
  message: string;
  created_at: string;
}

// ===================== Familienmuseum · Artefakte =====================

export type ArtifactCategory =
  | 'fotoalbum'
  | 'schmuck'
  | 'uhr'
  | 'erbstueck'
  | 'fahrzeug'
  | 'unternehmen'
  | 'haus'
  | 'sonstige';

/** Wichtiges Familienobjekt / Erbstück (Museums-Exponat). */
export interface Artifact {
  id: string;
  family_id: string;
  category: ArtifactCategory;
  title: string;
  description: string | null;
  story: string | null; // Generationenverlauf / Geschichte
  owner_person_id: string | null; // aktueller/letzter Besitzer
  location: string | null;
  year: number | null;
  photo_path: string | null;
  created_by: string | null;
  created_at: string;
}



