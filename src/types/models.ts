/**
 * Domänentypen für Foreverly – spiegeln das Datenbankschema wider.
 */

export type MemberRole = 'admin' | 'member';
export type ContentType = 'text' | 'photo' | 'audio';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

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
