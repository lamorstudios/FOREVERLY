-- =====================================================================
-- Foreverly · Phase 1 MVP · Initiales Datenbankschema
-- =====================================================================
-- Skalierbare Grundstruktur für Nutzer, Familien, Mitglieder, Beziehungen,
-- Erinnerungen, Fotos, Audios und Zeitkapseln.
--
-- Bewusst erweiterbar gehalten für spätere Phasen (Familienhistoriker-KI,
-- Familienbuch, Familienfilme, Dokumente, Notfallfunktionen) – diese werden
-- in Phase 1 NICHT implementiert.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------

-- Rolle innerhalb einer Familie
create type member_role as enum ('admin', 'member');

-- Inhaltstyp für Erinnerungen und Zeitkapseln
create type content_type as enum ('text', 'photo', 'audio');

-- Beziehungstyp zwischen zwei Personen im Familiennetzwerk
create type relationship_type as enum (
  'vater', 'mutter', 'sohn', 'tochter',
  'bruder', 'schwester',
  'oma', 'opa', 'tante', 'onkel',
  'cousin', 'cousine',
  'ehepartner', 'lebenspartner',
  'stiefvater', 'stiefmutter', 'stiefkind',
  'adoptivkind', 'pflegekind',
  'sonstige'
);

-- Kategorie der Beziehung (steuert die farbliche Darstellung)
--   biological -> Grün  (biologische Verwandtschaft)
--   married    -> Blau  (angeheiratete Familie)
--   patchwork  -> Gelb  (Patchwork / Stieffamilie)
--   adoption   -> Lila  (Adoption / Pflegefamilie)
create type relationship_category as enum (
  'biological', 'married', 'patchwork', 'adoption'
);

-- Status einer Einladung
create type invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

-- ---------------------------------------------------------------------
-- profiles · Nutzerprofile (1:1 zu auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  bio         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Erweiterte Nutzerprofile, 1:1 verknüpft mit auth.users.';

-- ---------------------------------------------------------------------
-- families · Familien
-- ---------------------------------------------------------------------
create table public.families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  image_url   text,
  created_by  uuid not null references public.profiles (id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.families is 'Eine Familie, z.B. "Familie Mielke". Der Ersteller wird automatisch Administrator.';

-- ---------------------------------------------------------------------
-- family_members · Mitgliedschaft von Nutzern in Familien
-- ---------------------------------------------------------------------
create table public.family_members (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        member_role not null default 'member',
  joined_at   timestamptz not null default now(),
  unique (family_id, user_id)
);

comment on table public.family_members is 'Verknüpft Nutzerkonten mit Familien und hält ihre Rolle.';
create index family_members_family_idx on public.family_members (family_id);
create index family_members_user_idx on public.family_members (user_id);

-- ---------------------------------------------------------------------
-- invitations · Einladungen per Link / Code
-- ---------------------------------------------------------------------
create table public.invitations (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families (id) on delete cascade,
  code          text not null unique,
  role          member_role not null default 'member',
  email         text,
  status        invitation_status not null default 'pending',
  invited_by    uuid not null references public.profiles (id) on delete cascade,
  accepted_by   uuid references public.profiles (id) on delete set null,
  accepted_at   timestamptz,
  expires_at    timestamptz not null default (now() + interval '30 days'),
  created_at    timestamptz not null default now()
);

comment on table public.invitations is 'Einladungen in eine Familie, einlösbar über Code oder Link.';
create index invitations_family_idx on public.invitations (family_id);
create index invitations_code_idx on public.invitations (code);

-- ---------------------------------------------------------------------
-- persons · Personen im Familiennetzwerk
-- ---------------------------------------------------------------------
-- Eine Person kann (muss aber nicht) mit einem echten Nutzerkonto
-- verknüpft sein. So lassen sich auch Verstorbene oder Personen ohne
-- App-Konto im Netzwerk abbilden.
create table public.persons (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families (id) on delete cascade,
  user_id       uuid references public.profiles (id) on delete set null,
  first_name    text not null check (char_length(first_name) between 1 and 80),
  last_name     text,
  avatar_url    text,
  birth_date    date,
  birth_place   text,
  death_date    date,
  biography     text,
  created_by    uuid not null references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint persons_dates_valid check (death_date is null or birth_date is null or death_date >= birth_date)
);

comment on table public.persons is 'Personen im Familiennetzwerk, optional mit einem Nutzerkonto verknüpft.';
create index persons_family_idx on public.persons (family_id);
create unique index persons_unique_user_per_family on public.persons (family_id, user_id) where user_id is not null;

-- ---------------------------------------------------------------------
-- relationships · Beziehungen zwischen Personen (farbcodiert)
-- ---------------------------------------------------------------------
create table public.relationships (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references public.families (id) on delete cascade,
  from_person_id  uuid not null references public.persons (id) on delete cascade,
  to_person_id    uuid not null references public.persons (id) on delete cascade,
  type            relationship_type not null,
  category        relationship_category not null,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  constraint relationships_no_self check (from_person_id <> to_person_id),
  unique (from_person_id, to_person_id, type)
);

comment on table public.relationships is 'Gerichtete Beziehung von Person A zu Person B mit Typ und farbcodierter Kategorie.';
create index relationships_family_idx on public.relationships (family_id);
create index relationships_from_idx on public.relationships (from_person_id);
create index relationships_to_idx on public.relationships (to_person_id);

-- ---------------------------------------------------------------------
-- memories · Erinnerungen (Text / Foto / Audio)
-- ---------------------------------------------------------------------
create table public.memories (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families (id) on delete cascade,
  person_id     uuid references public.persons (id) on delete set null,
  author_id     uuid not null references public.profiles (id) on delete set null,
  title         text not null check (char_length(title) between 1 and 200),
  description   text,
  content_type  content_type not null default 'text',
  occurred_on   date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.memories is 'Erinnerungen einer Familie, optional einer Person zugeordnet.';
create index memories_family_idx on public.memories (family_id);
create index memories_person_idx on public.memories (person_id);

-- ---------------------------------------------------------------------
-- photos · Foto-Uploads
-- ---------------------------------------------------------------------
create table public.photos (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families (id) on delete cascade,
  memory_id     uuid references public.memories (id) on delete cascade,
  person_id     uuid references public.persons (id) on delete set null,
  storage_path  text not null,
  caption       text,
  width         integer,
  height        integer,
  uploaded_by   uuid not null references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

comment on table public.photos is 'Fotos im Storage-Bucket "photos", optional Personen/Erinnerungen zugeordnet.';
create index photos_family_idx on public.photos (family_id);
create index photos_memory_idx on public.photos (memory_id);
create index photos_person_idx on public.photos (person_id);

-- ---------------------------------------------------------------------
-- audios · Audioaufnahmen
-- ---------------------------------------------------------------------
create table public.audios (
  id                uuid primary key default gen_random_uuid(),
  family_id         uuid not null references public.families (id) on delete cascade,
  memory_id         uuid references public.memories (id) on delete cascade,
  person_id         uuid references public.persons (id) on delete set null,
  storage_path      text not null,
  title             text,
  duration_seconds  integer,
  recorded_by       uuid not null references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now()
);

comment on table public.audios is 'Audioaufnahmen im Storage-Bucket "audios", vorbereitet für spätere Funktionen.';
create index audios_family_idx on public.audios (family_id);
create index audios_memory_idx on public.audios (memory_id);
create index audios_person_idx on public.audios (person_id);

-- ---------------------------------------------------------------------
-- time_capsules · Zeitkapseln
-- ---------------------------------------------------------------------
create table public.time_capsules (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families (id) on delete cascade,
  creator_id    uuid not null references public.profiles (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 200),
  description   text,
  content_type  content_type not null default 'text',
  text_content  text,
  storage_path  text,
  open_at       timestamptz not null,
  is_opened     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.time_capsules is 'Zeitkapseln, bis zum Öffnungsdatum gesperrt; danach automatische Freigabe.';
create index time_capsules_family_idx on public.time_capsules (family_id);
create index time_capsules_open_at_idx on public.time_capsules (open_at);

-- ---------------------------------------------------------------------
-- time_capsule_recipients · Empfänger einer Zeitkapsel
-- ---------------------------------------------------------------------
create table public.time_capsule_recipients (
  id          uuid primary key default gen_random_uuid(),
  capsule_id  uuid not null references public.time_capsules (id) on delete cascade,
  person_id   uuid references public.persons (id) on delete cascade,
  user_id     uuid references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint recipient_target_present check (person_id is not null or user_id is not null)
);

comment on table public.time_capsule_recipients is 'Empfänger einer Zeitkapsel (Person im Netzwerk und/oder Nutzerkonto).';
create index tcr_capsule_idx on public.time_capsule_recipients (capsule_id);
create index tcr_user_idx on public.time_capsule_recipients (user_id);

-- ---------------------------------------------------------------------
-- activities · Aktivitäts-Feed für die Startseite
-- ---------------------------------------------------------------------
create table public.activities (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families (id) on delete cascade,
  actor_id      uuid references public.profiles (id) on delete set null,
  action        text not null,            -- z.B. 'memory.created', 'photo.uploaded'
  entity_type   text not null,            -- z.B. 'memory', 'photo', 'audio', 'time_capsule', 'person'
  entity_id     uuid,
  summary       text,
  created_at    timestamptz not null default now()
);

comment on table public.activities is 'Chronologischer Aktivitäts-Feed je Familie für die Startseite.';
create index activities_family_created_idx on public.activities (family_id, created_at desc);
