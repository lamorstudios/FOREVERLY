-- =====================================================================
-- FAMII · Kombinierte Staging-Migration (alle Tabellen, Beziehungen, RLS)
-- =====================================================================
-- Zweck: EINMALIGES Einfügen im Supabase SQL Editor auf eine LEERE Staging-DB.
-- WICHTIG: nur auf eine FRISCHE/leere DB anwenden. Keine Auswirkung auf Live/Demo.
-- Enthaltene Migrationen (14):
--   - 20260615000001_initial_schema.sql
--   - 20260615000002_functions_and_triggers.sql
--   - 20260615000003_rls_policies.sql
--   - 20260615000004_storage.sql
--   - 20260615000005_phase2.sql
--   - 20260615000006_phase3.sql
--   - 20260615000007_phase4.sql
--   - 20260615000008_trusted_circle.sql
--   - 20260615000009_phase4_5.sql
--   - 20260615000010_phase5.sql
--   - 20260615000011_phase6.sql
--   - 20260617000001_phase6_memorial.sql
--   - 20260617000002_phase6_safety_alerts.sql
--   - 20260617000003_phase6_accept_invitation_link.sql
-- =====================================================================


-- ─────────────────────────────────────────────
-- BEGIN 20260615000001_initial_schema.sql
-- ─────────────────────────────────────────────
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
-- END 20260615000001_initial_schema.sql

-- ─────────────────────────────────────────────
-- BEGIN 20260615000002_functions_and_triggers.sql
-- ─────────────────────────────────────────────
-- =====================================================================
-- Foreverly · Funktionen & Trigger
-- =====================================================================

-- ---------------------------------------------------------------------
-- updated_at automatisch pflegen
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at      before update on public.profiles      for each row execute function public.set_updated_at();
create trigger families_set_updated_at      before update on public.families      for each row execute function public.set_updated_at();
create trigger persons_set_updated_at       before update on public.persons       for each row execute function public.set_updated_at();
create trigger memories_set_updated_at      before update on public.memories      for each row execute function public.set_updated_at();
create trigger time_capsules_set_updated_at before update on public.time_capsules for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Neues Profil anlegen, wenn sich ein Nutzer registriert
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Membership-Helper (SECURITY DEFINER, um RLS-Rekursion zu vermeiden)
-- ---------------------------------------------------------------------
create or replace function public.is_family_member(p_family_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.family_members fm
    where fm.family_id = p_family_id
      and fm.user_id = auth.uid()
  );
$$;

create or replace function public.is_family_admin(p_family_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.family_members fm
    where fm.family_id = p_family_id
      and fm.user_id = auth.uid()
      and fm.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- Ersteller einer Familie automatisch als Admin eintragen
-- ---------------------------------------------------------------------
create or replace function public.handle_new_family()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.family_members (family_id, user_id, role)
  values (new.id, new.created_by, 'admin')
  on conflict (family_id, user_id) do nothing;
  return new;
end;
$$;

create trigger on_family_created
  after insert on public.families
  for each row execute function public.handle_new_family();

-- ---------------------------------------------------------------------
-- Einladungscode generieren (lesbar, ohne verwechselbare Zeichen)
-- ---------------------------------------------------------------------
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- ---------------------------------------------------------------------
-- Einladung einlösen: prüft Code, fügt Nutzer der Familie hinzu
-- ---------------------------------------------------------------------
create or replace function public.accept_invitation(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.invitations%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Nicht angemeldet.';
  end if;

  select * into v_invitation
  from public.invitations
  where code = upper(trim(p_code))
  for update;

  if not found then
    raise exception 'Einladungscode ungültig.';
  end if;

  if v_invitation.status <> 'pending' then
    raise exception 'Einladung ist nicht mehr gültig.';
  end if;

  if v_invitation.expires_at < now() then
    update public.invitations set status = 'expired' where id = v_invitation.id;
    raise exception 'Einladung ist abgelaufen.';
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (v_invitation.family_id, v_uid, v_invitation.role)
  on conflict (family_id, user_id) do nothing;

  update public.invitations
  set status = 'accepted', accepted_by = v_uid, accepted_at = now()
  where id = v_invitation.id;

  return v_invitation.family_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Fällige Zeitkapseln freigeben (per Cron / Edge Function aufrufbar)
-- ---------------------------------------------------------------------
create or replace function public.release_due_time_capsules()
returns setof public.time_capsules
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.time_capsules
  set is_opened = true
  where is_opened = false
    and open_at <= now()
  returning *;
end;
$$;
-- END 20260615000002_functions_and_triggers.sql

-- ─────────────────────────────────────────────
-- BEGIN 20260615000003_rls_policies.sql
-- ─────────────────────────────────────────────
-- =====================================================================
-- Foreverly · Row Level Security (RLS)
-- =====================================================================
-- Grundprinzip: Daten sind nur für Mitglieder der jeweiligen Familie
-- sichtbar/änderbar. Zeitkapseln bleiben bis zum Öffnungsdatum für
-- Empfänger gesperrt.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Zusätzliche SECURITY DEFINER Helfer (vermeiden RLS-Rekursion)
-- ---------------------------------------------------------------------
create or replace function public.shares_family(p_user uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members a
    join public.family_members b on a.family_id = b.family_id
    where a.user_id = auth.uid()
      and b.user_id = p_user
  );
$$;

create or replace function public.is_capsule_creator(p_capsule_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.time_capsules tc
    where tc.id = p_capsule_id and tc.creator_id = auth.uid()
  );
$$;

create or replace function public.is_capsule_recipient(p_capsule_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.time_capsule_recipients r
    left join public.persons p on p.id = r.person_id
    where r.capsule_id = p_capsule_id
      and (r.user_id = auth.uid() or p.user_id = auth.uid())
  );
$$;

-- Liefert anstehende (noch gesperrte) Zeitkapseln für den aktuellen Nutzer,
-- OHNE Inhalt – nur Metadaten für die Startseite.
create or replace function public.upcoming_capsules_for_me()
returns table (id uuid, family_id uuid, title text, open_at timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select tc.id, tc.family_id, tc.title, tc.open_at
  from public.time_capsules tc
  where tc.is_opened = false
    and public.is_capsule_recipient(tc.id)
  order by tc.open_at asc;
$$;

-- ---------------------------------------------------------------------
-- RLS aktivieren
-- ---------------------------------------------------------------------
alter table public.profiles                enable row level security;
alter table public.families                enable row level security;
alter table public.family_members          enable row level security;
alter table public.invitations             enable row level security;
alter table public.persons                 enable row level security;
alter table public.relationships           enable row level security;
alter table public.memories                enable row level security;
alter table public.photos                  enable row level security;
alter table public.audios                  enable row level security;
alter table public.time_capsules           enable row level security;
alter table public.time_capsule_recipients enable row level security;
alter table public.activities              enable row level security;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy "Profile lesen (eigenes oder gemeinsame Familie)"
  on public.profiles for select
  using (id = auth.uid() or public.shares_family(id));

create policy "Eigenes Profil aktualisieren"
  on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy "Eigenes Profil anlegen"
  on public.profiles for insert
  with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- families
-- ---------------------------------------------------------------------
create policy "Familien lesen (Mitglied)"
  on public.families for select
  using (public.is_family_member(id));

create policy "Familie erstellen"
  on public.families for insert
  with check (created_by = auth.uid());

create policy "Familie bearbeiten (Admin)"
  on public.families for update
  using (public.is_family_admin(id)) with check (public.is_family_admin(id));

create policy "Familie löschen (Admin)"
  on public.families for delete
  using (public.is_family_admin(id));

-- ---------------------------------------------------------------------
-- family_members
-- ---------------------------------------------------------------------
create policy "Mitglieder lesen (Mitglied)"
  on public.family_members for select
  using (public.is_family_member(family_id));

create policy "Mitglied hinzufügen (Admin)"
  on public.family_members for insert
  with check (public.is_family_admin(family_id));

create policy "Mitgliedsrolle ändern (Admin)"
  on public.family_members for update
  using (public.is_family_admin(family_id)) with check (public.is_family_admin(family_id));

create policy "Mitglied entfernen (Admin oder selbst)"
  on public.family_members for delete
  using (public.is_family_admin(family_id) or user_id = auth.uid());

-- ---------------------------------------------------------------------
-- invitations
-- ---------------------------------------------------------------------
create policy "Einladungen lesen (Admin)"
  on public.invitations for select
  using (public.is_family_admin(family_id));

create policy "Einladung erstellen (Admin)"
  on public.invitations for insert
  with check (public.is_family_admin(family_id) and invited_by = auth.uid());

create policy "Einladung verwalten (Admin)"
  on public.invitations for update
  using (public.is_family_admin(family_id)) with check (public.is_family_admin(family_id));

create policy "Einladung löschen (Admin)"
  on public.invitations for delete
  using (public.is_family_admin(family_id));

-- ---------------------------------------------------------------------
-- persons
-- ---------------------------------------------------------------------
create policy "Personen lesen (Mitglied)"
  on public.persons for select
  using (public.is_family_member(family_id));

create policy "Person erstellen (Mitglied)"
  on public.persons for insert
  with check (public.is_family_member(family_id) and created_by = auth.uid());

create policy "Person bearbeiten (Mitglied)"
  on public.persons for update
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

create policy "Person löschen (Admin oder Ersteller)"
  on public.persons for delete
  using (public.is_family_admin(family_id) or created_by = auth.uid());

-- ---------------------------------------------------------------------
-- relationships
-- ---------------------------------------------------------------------
create policy "Beziehungen lesen (Mitglied)"
  on public.relationships for select
  using (public.is_family_member(family_id));

create policy "Beziehung erstellen (Mitglied)"
  on public.relationships for insert
  with check (public.is_family_member(family_id));

create policy "Beziehung bearbeiten (Mitglied)"
  on public.relationships for update
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

create policy "Beziehung löschen (Mitglied)"
  on public.relationships for delete
  using (public.is_family_member(family_id));

-- ---------------------------------------------------------------------
-- memories
-- ---------------------------------------------------------------------
create policy "Erinnerungen lesen (Mitglied)"
  on public.memories for select
  using (public.is_family_member(family_id));

create policy "Erinnerung erstellen (Mitglied)"
  on public.memories for insert
  with check (public.is_family_member(family_id) and author_id = auth.uid());

create policy "Erinnerung bearbeiten (Autor oder Admin)"
  on public.memories for update
  using (author_id = auth.uid() or public.is_family_admin(family_id))
  with check (author_id = auth.uid() or public.is_family_admin(family_id));

create policy "Erinnerung löschen (Autor oder Admin)"
  on public.memories for delete
  using (author_id = auth.uid() or public.is_family_admin(family_id));

-- ---------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------
create policy "Fotos lesen (Mitglied)"
  on public.photos for select
  using (public.is_family_member(family_id));

create policy "Foto hinzufügen (Mitglied)"
  on public.photos for insert
  with check (public.is_family_member(family_id) and uploaded_by = auth.uid());

create policy "Foto bearbeiten (Uploader oder Admin)"
  on public.photos for update
  using (uploaded_by = auth.uid() or public.is_family_admin(family_id))
  with check (uploaded_by = auth.uid() or public.is_family_admin(family_id));

create policy "Foto löschen (Uploader oder Admin)"
  on public.photos for delete
  using (uploaded_by = auth.uid() or public.is_family_admin(family_id));

-- ---------------------------------------------------------------------
-- audios
-- ---------------------------------------------------------------------
create policy "Audios lesen (Mitglied)"
  on public.audios for select
  using (public.is_family_member(family_id));

create policy "Audio hinzufügen (Mitglied)"
  on public.audios for insert
  with check (public.is_family_member(family_id) and recorded_by = auth.uid());

create policy "Audio bearbeiten (Aufnehmer oder Admin)"
  on public.audios for update
  using (recorded_by = auth.uid() or public.is_family_admin(family_id))
  with check (recorded_by = auth.uid() or public.is_family_admin(family_id));

create policy "Audio löschen (Aufnehmer oder Admin)"
  on public.audios for delete
  using (recorded_by = auth.uid() or public.is_family_admin(family_id));

-- ---------------------------------------------------------------------
-- time_capsules · gesperrt bis zum Öffnungsdatum
-- ---------------------------------------------------------------------
create policy "Zeitkapsel lesen (Ersteller, oder Empfänger nach Öffnung)"
  on public.time_capsules for select
  using (
    creator_id = auth.uid()
    or (is_opened = true and public.is_capsule_recipient(id))
  );

create policy "Zeitkapsel erstellen (Mitglied)"
  on public.time_capsules for insert
  with check (public.is_family_member(family_id) and creator_id = auth.uid());

create policy "Zeitkapsel bearbeiten (Ersteller)"
  on public.time_capsules for update
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());

create policy "Zeitkapsel löschen (Ersteller oder Admin)"
  on public.time_capsules for delete
  using (creator_id = auth.uid() or public.is_family_admin(family_id));

-- ---------------------------------------------------------------------
-- time_capsule_recipients
-- ---------------------------------------------------------------------
create policy "Empfänger lesen (Ersteller oder selbst)"
  on public.time_capsule_recipients for select
  using (public.is_capsule_creator(capsule_id) or user_id = auth.uid());

create policy "Empfänger hinzufügen (Ersteller)"
  on public.time_capsule_recipients for insert
  with check (public.is_capsule_creator(capsule_id));

create policy "Empfänger entfernen (Ersteller)"
  on public.time_capsule_recipients for delete
  using (public.is_capsule_creator(capsule_id));

-- ---------------------------------------------------------------------
-- activities
-- ---------------------------------------------------------------------
create policy "Aktivitäten lesen (Mitglied)"
  on public.activities for select
  using (public.is_family_member(family_id));

create policy "Aktivität erstellen (Mitglied)"
  on public.activities for insert
  with check (public.is_family_member(family_id) and actor_id = auth.uid());
-- END 20260615000003_rls_policies.sql

-- ─────────────────────────────────────────────
-- BEGIN 20260615000004_storage.sql
-- ─────────────────────────────────────────────
-- =====================================================================
-- Foreverly · Storage Buckets & Policies
-- =====================================================================
-- Drei private Buckets. Zugriff über signierte URLs aus der App.
--   avatars : Profilbilder            · Pfad: {user_id}/...
--   photos  : Familienfotos, Personen-/Familienbilder · Pfad: {family_id}/...
--   audios  : Audioaufnahmen          · Pfad: {family_id}/...
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic']),
  ('photos',  'photos',  false, 26214400, array['image/jpeg','image/png','image/webp','image/heic']),
  ('audios',  'audios',  false, 52428800, array['audio/mpeg','audio/mp4','audio/m4a','audio/aac','audio/wav','audio/x-m4a','audio/webm'])
on conflict (id) do nothing;

-- Erste Pfadkomponente als uuid (family_id bzw. user_id)
-- ---------------------------------------------------------------------
-- avatars
-- ---------------------------------------------------------------------
create policy "Avatare lesen (eigene oder gemeinsame Familie)"
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.shares_family(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "Avatar hochladen (eigener Ordner)"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Avatar ersetzen (eigener Ordner)"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Avatar löschen (eigener Ordner)"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------
create policy "Fotos lesen (Familienmitglied)"
  on storage.objects for select
  using (
    bucket_id = 'photos'
    and public.is_family_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Foto hochladen (Familienmitglied)"
  on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and public.is_family_member(((storage.foldername(name))[1])::uuid)
    and owner = auth.uid()
  );

create policy "Foto ersetzen (Familienmitglied)"
  on storage.objects for update
  using (
    bucket_id = 'photos'
    and public.is_family_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Foto-Datei löschen (Eigentümer oder Admin)"
  on storage.objects for delete
  using (
    bucket_id = 'photos'
    and (
      owner = auth.uid()
      or public.is_family_admin(((storage.foldername(name))[1])::uuid)
    )
  );

-- ---------------------------------------------------------------------
-- audios
-- ---------------------------------------------------------------------
create policy "Audios lesen (Familienmitglied)"
  on storage.objects for select
  using (
    bucket_id = 'audios'
    and public.is_family_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Audio hochladen (Familienmitglied)"
  on storage.objects for insert
  with check (
    bucket_id = 'audios'
    and public.is_family_member(((storage.foldername(name))[1])::uuid)
    and owner = auth.uid()
  );

create policy "Audio-Datei löschen (Eigentümer oder Admin)"
  on storage.objects for delete
  using (
    bucket_id = 'audios'
    and (
      owner = auth.uid()
      or public.is_family_admin(((storage.foldername(name))[1])::uuid)
    )
  );
-- END 20260615000004_storage.sql

-- ─────────────────────────────────────────────
-- BEGIN 20260615000005_phase2.sql
-- ─────────────────────────────────────────────
-- =====================================================================
-- Foreverly · Phase 2 · Schemaerweiterung
-- =====================================================================
-- Familienstatus, Benachrichtigungen, Notfallfunktion, Familienkalender
-- und Dokumentenübersicht. Bewusst skalierbar; keine sensiblen Inhalte
-- (keine Passwörter, Bankdaten oder Dokumenteninhalte) werden gespeichert.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type status_level as enum ('gut', 'okay', 'allein', 'unwohl', 'hilfe');

create type calendar_event_type as enum (
  'geburtstag', 'jahrestag', 'arzttermin', 'familienereignis', 'erinnerung'
);

create type document_kind as enum (
  'testament', 'patientenverfuegung', 'vorsorgevollmacht', 'versicherung', 'sonstige'
);

create type emergency_state as enum ('active', 'resolved');

-- ---------------------------------------------------------------------
-- member_statuses · aktueller Status je Person im Familiennetzwerk
-- ---------------------------------------------------------------------
-- Status ist einer Person zugeordnet (auch ohne eigenes Konto möglich).
-- Angemeldete Nutzer setzen den Status ihrer verknüpften Person.
create table public.member_statuses (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families (id) on delete cascade,
  person_id   uuid not null references public.persons (id) on delete cascade,
  level       status_level not null,
  message     text,
  updated_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (family_id, person_id)
);
comment on table public.member_statuses is 'Aktueller Befindlichkeits-Status je Person.';
create index member_statuses_family_idx on public.member_statuses (family_id);

-- ---------------------------------------------------------------------
-- notifications · In-App-Benachrichtigungen
-- ---------------------------------------------------------------------
create table public.notifications (
  id                 uuid primary key default gen_random_uuid(),
  family_id          uuid not null references public.families (id) on delete cascade,
  recipient_user_id  uuid references public.profiles (id) on delete cascade, -- null = an gesamte Familie
  actor_user_id      uuid references public.profiles (id) on delete set null,
  category           text not null default 'info', -- 'status' | 'emergency' | 'calendar' | 'info'
  title              text not null,
  body               text,
  data               jsonb not null default '{}'::jsonb,
  is_read            boolean not null default false,
  created_at         timestamptz not null default now()
);
comment on table public.notifications is 'In-App-Benachrichtigungen (Status-Alarm, Notfall, Termine).';
create index notifications_family_idx on public.notifications (family_id, created_at desc);
create index notifications_recipient_idx on public.notifications (recipient_user_id);

-- ---------------------------------------------------------------------
-- emergency_contacts · Notfallkontakte (keine sensiblen Zugangsdaten)
-- ---------------------------------------------------------------------
create table public.emergency_contacts (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families (id) on delete cascade,
  person_id   uuid references public.persons (id) on delete set null,
  name        text not null,
  relation    text,
  phone       text,
  note        text,
  priority    integer not null default 0,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
comment on table public.emergency_contacts is 'Notfallkontakte einer Familie.';
create index emergency_contacts_family_idx on public.emergency_contacts (family_id, priority);

-- ---------------------------------------------------------------------
-- emergency_events · ausgelöste Notfälle (SOS)
-- ---------------------------------------------------------------------
create table public.emergency_events (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references public.families (id) on delete cascade,
  triggered_by    uuid references public.profiles (id) on delete set null,
  state           emergency_state not null default 'active',
  -- Standort optional; Architektur für echte Geodaten vorbereitet.
  latitude        double precision,
  longitude       double precision,
  location_label  text,
  message         text,
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  resolved_by     uuid references public.profiles (id) on delete set null
);
comment on table public.emergency_events is 'SOS-Notfallereignisse innerhalb der Familie.';
create index emergency_events_family_idx on public.emergency_events (family_id, created_at desc);

-- ---------------------------------------------------------------------
-- calendar_events · gemeinsamer Familienkalender
-- ---------------------------------------------------------------------
create table public.calendar_events (
  id               uuid primary key default gen_random_uuid(),
  family_id        uuid not null references public.families (id) on delete cascade,
  type             calendar_event_type not null default 'familienereignis',
  title            text not null check (char_length(title) between 1 and 200),
  description      text,
  event_date       date not null,
  event_time       text,                     -- "14:30" optional
  is_annual        boolean not null default false, -- jährlich (Geburtstage/Jahrestage)
  for_whole_family boolean not null default false,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table public.calendar_events is 'Termine im Familienkalender.';
create index calendar_events_family_date_idx on public.calendar_events (family_id, event_date);

-- ---------------------------------------------------------------------
-- calendar_event_participants · Zuordnung Termin -> Person(en)
-- ---------------------------------------------------------------------
create table public.calendar_event_participants (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.calendar_events (id) on delete cascade,
  person_id   uuid references public.persons (id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index cep_event_idx on public.calendar_event_participants (event_id);

-- ---------------------------------------------------------------------
-- family_documents · Dokumentenübersicht (nur Metadaten!)
-- ---------------------------------------------------------------------
-- WICHTIG: Es werden ausschließlich Metadaten gespeichert (ob vorhanden,
-- Aufbewahrungsort, Notiz, Ansprechpartner) – KEINE Dokumenteninhalte.
create table public.family_documents (
  id                 uuid primary key default gen_random_uuid(),
  family_id          uuid not null references public.families (id) on delete cascade,
  kind               document_kind not null,
  title              text not null,
  is_available       boolean not null default false,
  location           text,
  note               text,
  contact_person     text,
  contact_person_id  uuid references public.persons (id) on delete set null,
  created_by         uuid references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
comment on table public.family_documents is 'Übersicht wichtiger Dokumente (nur Metadaten, keine Inhalte).';
create index family_documents_family_idx on public.family_documents (family_id);

-- ---------------------------------------------------------------------
-- updated_at-Trigger
-- ---------------------------------------------------------------------
create trigger member_statuses_set_updated_at before update on public.member_statuses
  for each row execute function public.set_updated_at();
create trigger calendar_events_set_updated_at before update on public.calendar_events
  for each row execute function public.set_updated_at();
create trigger family_documents_set_updated_at before update on public.family_documents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.member_statuses             enable row level security;
alter table public.notifications               enable row level security;
alter table public.emergency_contacts          enable row level security;
alter table public.emergency_events            enable row level security;
alter table public.calendar_events             enable row level security;
alter table public.calendar_event_participants enable row level security;
alter table public.family_documents            enable row level security;

-- member_statuses
create policy "Status lesen (Mitglied)" on public.member_statuses for select
  using (public.is_family_member(family_id));
create policy "Status setzen (Mitglied)" on public.member_statuses for insert
  with check (public.is_family_member(family_id));
create policy "Status ändern (Mitglied)" on public.member_statuses for update
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "Status löschen (Mitglied)" on public.member_statuses for delete
  using (public.is_family_member(family_id));

-- notifications
create policy "Benachrichtigungen lesen (eigene oder Familie)" on public.notifications for select
  using (
    public.is_family_member(family_id)
    and (recipient_user_id is null or recipient_user_id = auth.uid())
  );
create policy "Benachrichtigung erstellen (Mitglied)" on public.notifications for insert
  with check (public.is_family_member(family_id));
create policy "Benachrichtigung aktualisieren (Empfänger)" on public.notifications for update
  using (recipient_user_id = auth.uid() or (recipient_user_id is null and public.is_family_member(family_id)))
  with check (recipient_user_id = auth.uid() or (recipient_user_id is null and public.is_family_member(family_id)));

-- emergency_contacts
create policy "Notfallkontakte lesen (Mitglied)" on public.emergency_contacts for select
  using (public.is_family_member(family_id));
create policy "Notfallkontakt anlegen (Mitglied)" on public.emergency_contacts for insert
  with check (public.is_family_member(family_id));
create policy "Notfallkontakt ändern (Mitglied)" on public.emergency_contacts for update
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "Notfallkontakt löschen (Mitglied)" on public.emergency_contacts for delete
  using (public.is_family_member(family_id));

-- emergency_events
create policy "Notfälle lesen (Mitglied)" on public.emergency_events for select
  using (public.is_family_member(family_id));
create policy "Notfall auslösen (Mitglied)" on public.emergency_events for insert
  with check (public.is_family_member(family_id) and triggered_by = auth.uid());
create policy "Notfall aktualisieren (Mitglied)" on public.emergency_events for update
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

-- calendar_events
create policy "Termine lesen (Mitglied)" on public.calendar_events for select
  using (public.is_family_member(family_id));
create policy "Termin anlegen (Mitglied)" on public.calendar_events for insert
  with check (public.is_family_member(family_id));
create policy "Termin ändern (Mitglied)" on public.calendar_events for update
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "Termin löschen (Mitglied)" on public.calendar_events for delete
  using (public.is_family_member(family_id));

-- calendar_event_participants (über zugehörigen Termin abgesichert)
create policy "Teilnehmer lesen (Mitglied)" on public.calendar_event_participants for select
  using (exists (
    select 1 from public.calendar_events e
    where e.id = event_id and public.is_family_member(e.family_id)
  ));
create policy "Teilnehmer verwalten (Mitglied)" on public.calendar_event_participants for all
  using (exists (
    select 1 from public.calendar_events e
    where e.id = event_id and public.is_family_member(e.family_id)
  ))
  with check (exists (
    select 1 from public.calendar_events e
    where e.id = event_id and public.is_family_member(e.family_id)
  ));

-- family_documents
create policy "Dokumente lesen (Mitglied)" on public.family_documents for select
  using (public.is_family_member(family_id));
create policy "Dokument anlegen (Mitglied)" on public.family_documents for insert
  with check (public.is_family_member(family_id));
create policy "Dokument ändern (Mitglied)" on public.family_documents for update
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "Dokument löschen (Mitglied)" on public.family_documents for delete
  using (public.is_family_member(family_id));
-- END 20260615000005_phase2.sql

-- ─────────────────────────────────────────────
-- BEGIN 20260615000006_phase3.sql
-- ─────────────────────────────────────────────
-- =====================================================================
-- Foreverly · Phase 3 · Familienhistoriker (RAG-Vorbereitung)
-- =====================================================================
-- Bereitet ein RAG-System AUSSCHLIESSLICH auf Basis der Familiendaten vor.
-- In Phase 3 erfolgt das Abrufen + Begründen clientseitig (deterministisch,
-- ohne Halluzinationen, mit Quellenangaben). Diese Tabellen halten den
-- Index für die spätere serverseitige Synthese (z.B. via Claude) bereit
-- und sind skalierbar für Familienbuch/Familienfilme (Phase 4/5).
--
-- WICHTIG: Es werden nur familieneigene Inhalte indexiert. Keine externen
-- Daten, keine sensiblen Zugangsdaten.
-- =====================================================================

-- pgvector für semantische Suche (optional, für die produktive RAG-Synthese)
create extension if not exists vector;

-- ---------------------------------------------------------------------
-- knowledge_chunks · indexierte Wissensbausteine der Familie
-- ---------------------------------------------------------------------
-- Jeder Chunk verweist auf eine konkrete Quelle (Erinnerung, Audio, Foto,
-- Profil, Zeitkapsel) – damit Antworten nachvollziehbar bleiben.
create table public.knowledge_chunks (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families (id) on delete cascade,
  source_type   text not null,            -- 'memory'|'audio'|'photo'|'person'|'time_capsule'
  source_id     uuid,
  person_id     uuid references public.persons (id) on delete set null,
  title         text,
  content       text not null,
  source_date   date,
  embedding     vector(1536),             -- optional; für semantische Suche
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.knowledge_chunks is 'Indexierte Wissensbausteine (RAG) – ausschließlich Familieninhalte, mit Quellbezug.';
create index knowledge_chunks_family_idx on public.knowledge_chunks (family_id);
create index knowledge_chunks_person_idx on public.knowledge_chunks (person_id);

-- ---------------------------------------------------------------------
-- life_wisdoms · gesammelte Lebensweisheiten
-- ---------------------------------------------------------------------
create table public.life_wisdoms (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families (id) on delete cascade,
  person_id     uuid references public.persons (id) on delete set null,
  category      text not null,            -- 'liebe'|'familie'|'arbeit'|'geld'|'glueck'|'gesundheit'|'sonstige'
  text          text not null,
  source_type   text,                     -- 'memory'|'audio'|'time_capsule'|'person'
  source_id     uuid,
  source_date   date,
  created_at    timestamptz not null default now()
);
comment on table public.life_wisdoms is 'Automatisch erkannte/gesammelte Lebensweisheiten mit Quellbezug.';
create index life_wisdoms_family_idx on public.life_wisdoms (family_id);

create trigger knowledge_chunks_set_updated_at before update on public.knowledge_chunks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS – nur Familienmitglieder
-- ---------------------------------------------------------------------
alter table public.knowledge_chunks enable row level security;
alter table public.life_wisdoms     enable row level security;

create policy "Wissensbausteine lesen (Mitglied)" on public.knowledge_chunks for select
  using (public.is_family_member(family_id));
create policy "Wissensbausteine schreiben (Mitglied)" on public.knowledge_chunks for all
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

create policy "Lebensweisheiten lesen (Mitglied)" on public.life_wisdoms for select
  using (public.is_family_member(family_id));
create policy "Lebensweisheiten schreiben (Mitglied)" on public.life_wisdoms for all
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
-- END 20260615000006_phase3.sql

-- ─────────────────────────────────────────────
-- BEGIN 20260615000007_phase4.sql
-- ─────────────────────────────────────────────
-- =====================================================================
-- Foreverly · Phase 4 · Familienbuch
-- =====================================================================
-- Automatisch generierte, schön gestaltete Familienbücher aus VORHANDENEN
-- Familiendaten (keine erfundenen Fakten). Strukturen sind für spätere,
-- kostenpflichtige Buchfunktionen (Hardcover-Druck) vorbereitet – ohne
-- Zahlungsfunktion in dieser Phase.
-- =====================================================================

create type book_type as enum (
  'komplett', 'person', 'oma_opa', 'jahr', 'erinnerungen', 'lebensweisheiten'
);

create type book_export_format as enum ('pdf', 'print', 'share');
create type book_export_status as enum ('pending', 'ready', 'failed');

-- ---------------------------------------------------------------------
-- book_projects · gespeicherte Buch-Projekte
-- ---------------------------------------------------------------------
create table public.book_projects (
  id               uuid primary key default gen_random_uuid(),
  family_id        uuid not null references public.families (id) on delete cascade,
  type             book_type not null default 'komplett',
  title            text not null,
  subtitle         text,
  cover_photo_path text,
  -- Editier-Einstellungen der Vorschau (ausgeblendete Kapitel, Reihenfolge)
  hidden_chapters  text[] not null default '{}',
  chapter_order    text[] not null default '{}',
  -- Optionen je Buchtyp (z.B. { "personId": "...", "year": 2006 })
  options          jsonb not null default '{}'::jsonb,
  status           text not null default 'draft', -- 'draft' | 'ready' | 'exported'
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table public.book_projects is 'Familienbuch-Projekte (Konfiguration + Editier-Status).';
create index book_projects_family_idx on public.book_projects (family_id);

-- ---------------------------------------------------------------------
-- book_versions · gespeicherte Versionen (Snapshot des generierten Buchs)
-- ---------------------------------------------------------------------
create table public.book_versions (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.book_projects (id) on delete cascade,
  version     integer not null default 1,
  snapshot    jsonb not null,             -- generierter Buchinhalt zum Zeitpunkt
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
comment on table public.book_versions is 'Versions-Snapshots eines Familienbuch-Projekts.';
create index book_versions_project_idx on public.book_versions (project_id, version desc);

-- ---------------------------------------------------------------------
-- book_exports · Exportstatus (PDF / Druck / Teilen) – vorbereitet für Druck
-- ---------------------------------------------------------------------
create table public.book_exports (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.book_projects (id) on delete cascade,
  format       book_export_format not null,
  status       book_export_status not null default 'pending',
  url          text,
  -- Druckvorbereitung (späterer Hardcover-Druck): Seitenzahl, Format etc.
  print_ready  boolean not null default false,
  meta         jsonb not null default '{}'::jsonb,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);
comment on table public.book_exports is 'Exportvorgänge eines Buchs (PDF/Druck/Teilen), inkl. Druckvorbereitung.';
create index book_exports_project_idx on public.book_exports (project_id, created_at desc);

-- updated_at
create trigger book_projects_set_updated_at before update on public.book_projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS – nur Familienmitglieder
-- ---------------------------------------------------------------------
alter table public.book_projects enable row level security;
alter table public.book_versions enable row level security;
alter table public.book_exports  enable row level security;

create policy "Buch-Projekte lesen (Mitglied)" on public.book_projects for select
  using (public.is_family_member(family_id));
create policy "Buch-Projekte schreiben (Mitglied)" on public.book_projects for all
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

create policy "Buch-Versionen lesen (Mitglied)" on public.book_versions for select
  using (exists (select 1 from public.book_projects p where p.id = project_id and public.is_family_member(p.family_id)));
create policy "Buch-Versionen schreiben (Mitglied)" on public.book_versions for all
  using (exists (select 1 from public.book_projects p where p.id = project_id and public.is_family_member(p.family_id)))
  with check (exists (select 1 from public.book_projects p where p.id = project_id and public.is_family_member(p.family_id)));

create policy "Buch-Exporte lesen (Mitglied)" on public.book_exports for select
  using (exists (select 1 from public.book_projects p where p.id = project_id and public.is_family_member(p.family_id)));
create policy "Buch-Exporte schreiben (Mitglied)" on public.book_exports for all
  using (exists (select 1 from public.book_projects p where p.id = project_id and public.is_family_member(p.family_id)))
  with check (exists (select 1 from public.book_projects p where p.id = project_id and public.is_family_member(p.family_id)));
-- END 20260615000007_phase4.sql

-- ─────────────────────────────────────────────
-- BEGIN 20260615000008_trusted_circle.sql
-- ─────────────────────────────────────────────
-- =====================================================================
-- Foreverly · Ergänzung · Trusted Circle / Vertrauenskreis
-- =====================================================================
-- Externe Vertrauenspersonen aus dem Umfeld eines Familienmitglieds.
-- WICHTIG: Das sind KEINE Familienmitglieder – sie haben KEINEN Zugriff auf
-- Familieninhalte (Netzwerk, Erinnerungen, Fotos, Audios, Zeitkapseln,
-- Dokumente, Familienbuch, Historiker). Reine interne Kontaktliste.
-- =====================================================================

create table public.trusted_contacts (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families (id) on delete cascade,
  -- Zugeordnet zu einem Familienmitglied (Person im Netzwerk)
  person_id     uuid references public.persons (id) on delete set null,
  name          text not null,
  role          text not null default 'sonstige',
  phone         text,
  email         text,
  location      text,                 -- Wohnort / Nähe
  note          text,
  availability  text,                 -- Verfügbarkeit (optional)
  is_emergency  boolean not null default false,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.trusted_contacts is 'Externe Vertrauenspersonen je Familienmitglied (kein Zugriff auf Familieninhalte).';
create index trusted_contacts_family_idx on public.trusted_contacts (family_id);
create index trusted_contacts_person_idx on public.trusted_contacts (person_id);

create trigger trusted_contacts_set_updated_at before update on public.trusted_contacts
  for each row execute function public.set_updated_at();

-- RLS – nur Familienmitglieder verwalten die Liste
alter table public.trusted_contacts enable row level security;

create policy "Vertrauenspersonen lesen (Mitglied)" on public.trusted_contacts for select
  using (public.is_family_member(family_id));
create policy "Vertrauensperson anlegen (Mitglied)" on public.trusted_contacts for insert
  with check (public.is_family_member(family_id));
create policy "Vertrauensperson ändern (Mitglied)" on public.trusted_contacts for update
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "Vertrauensperson löschen (Mitglied)" on public.trusted_contacts for delete
  using (public.is_family_member(family_id));
-- END 20260615000008_trusted_circle.sql

-- ─────────────────────────────────────────────
-- BEGIN 20260615000009_phase4_5.sql
-- ─────────────────────────────────────────────
-- =====================================================================
-- Foreverly · Phase 4.5 · Inner Circle & Familiennähe
-- =====================================================================
-- Trennt BEZIEHUNG (relationships) von persönlicher NÄHE (closeness).
-- Nähe ist individuell je Nutzer. Inhalte erhalten Sichtbarkeitsstufen.
-- Neue Familienmitglieder erhalten NIEMALS automatisch Vollzugriff –
-- Zugriff wird über Nähe, Sichtbarkeit und individuelle Freigaben gesteuert.
-- =====================================================================

-- Nähegrade (persönliche Nähe, individuell)
create type closeness_level as enum ('inner', 'sehr_nah', 'familie', 'erweitert');

-- Sichtbarkeitsstufen für Inhalte
create type visibility_level as enum (
  'family',     -- 🌍 ganze Familie
  'inner',      -- ❤️ nur Inner Circle
  'sehr_nah',   -- 💛 sehr nahe Familie
  'selected',   -- 👥 ausgewählte Personen
  'branch',     -- 🌿 bestimmter Familienzweig
  'private'     -- 🔒 privat
);

-- ---------------------------------------------------------------------
-- closeness_ratings · individuelle Nähe-Einstufung je Nutzer & Person
-- ---------------------------------------------------------------------
create table public.closeness_ratings (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references public.families (id) on delete cascade,
  rater_user_id   uuid not null references public.profiles (id) on delete cascade,
  person_id       uuid not null references public.persons (id) on delete cascade,
  level           closeness_level not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (rater_user_id, person_id)
);
comment on table public.closeness_ratings is 'Individuelle Familiennähe je Nutzer (Beziehung ≠ Nähe).';
create index closeness_ratings_family_idx on public.closeness_ratings (family_id);
create index closeness_ratings_rater_idx on public.closeness_ratings (rater_user_id);

-- ---------------------------------------------------------------------
-- family_branches · Familienzweige (Vaterseite, Mutterseite, …)
-- ---------------------------------------------------------------------
create table public.family_branches (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families (id) on delete cascade,
  name        text not null,
  color       text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
comment on table public.family_branches is 'Familienzweige zur gezielten Freigabe von Inhalten.';
create index family_branches_family_idx on public.family_branches (family_id);

create table public.branch_members (
  id          uuid primary key default gen_random_uuid(),
  branch_id   uuid not null references public.family_branches (id) on delete cascade,
  person_id   uuid not null references public.persons (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (branch_id, person_id)
);
create index branch_members_branch_idx on public.branch_members (branch_id);

-- ---------------------------------------------------------------------
-- Sichtbarkeit für Inhalte (additiv; bestehende Zeilen behalten Default)
-- ---------------------------------------------------------------------
alter table public.memories
  add column visibility visibility_level not null default 'family',
  add column visibility_branch_id uuid references public.family_branches (id) on delete set null;

alter table public.time_capsules
  add column visibility visibility_level not null default 'selected',
  add column visibility_branch_id uuid references public.family_branches (id) on delete set null;

-- ---------------------------------------------------------------------
-- updated_at + RLS
-- ---------------------------------------------------------------------
create trigger closeness_ratings_set_updated_at before update on public.closeness_ratings
  for each row execute function public.set_updated_at();

alter table public.closeness_ratings enable row level security;
alter table public.family_branches   enable row level security;
alter table public.branch_members     enable row level security;

-- Nähe ist privat je Nutzer: nur der Bewertende sieht/ändert seine Einstufungen.
create policy "Eigene Nähe lesen" on public.closeness_ratings for select
  using (rater_user_id = auth.uid());
create policy "Eigene Nähe setzen" on public.closeness_ratings for insert
  with check (rater_user_id = auth.uid() and public.is_family_member(family_id));
create policy "Eigene Nähe ändern" on public.closeness_ratings for update
  using (rater_user_id = auth.uid()) with check (rater_user_id = auth.uid());
create policy "Eigene Nähe löschen" on public.closeness_ratings for delete
  using (rater_user_id = auth.uid());

create policy "Zweige lesen (Mitglied)" on public.family_branches for select
  using (public.is_family_member(family_id));
create policy "Zweige verwalten (Mitglied)" on public.family_branches for all
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

create policy "Zweig-Mitglieder lesen (Mitglied)" on public.branch_members for select
  using (exists (select 1 from public.family_branches b where b.id = branch_id and public.is_family_member(b.family_id)));
create policy "Zweig-Mitglieder verwalten (Mitglied)" on public.branch_members for all
  using (exists (select 1 from public.family_branches b where b.id = branch_id and public.is_family_member(b.family_id)))
  with check (exists (select 1 from public.family_branches b where b.id = branch_id and public.is_family_member(b.family_id)));
-- END 20260615000009_phase4_5.sql

-- ─────────────────────────────────────────────
-- BEGIN 20260615000010_phase5.sql
-- ─────────────────────────────────────────────
-- =====================================================================
-- Foreverly · Phase 5 · Smart Family Invites
-- =====================================================================
-- Personenbezogene Einladungslinks: Ein eingeladener Nutzer wird nach der
-- Registrierung automatisch mit einem bereits angelegten Personenprofil
-- verknüpft und erscheint korrekt im Familiennetzwerk. Dazu Beziehungs-
-- vorschläge (z.B. „Lea könnte deine Nichte sein"). Skalierbar angelegt.
-- =====================================================================

-- Neue Beziehungstypen (Nichte/Neffe) für Beziehungsvorschläge
alter type relationship_type add value if not exists 'nichte';
alter type relationship_type add value if not exists 'neffe';

-- ---------------------------------------------------------------------
-- invitations erweitern (personenbezogene Smart Invites)
-- ---------------------------------------------------------------------
alter table public.invitations
  add column person_id            uuid references public.persons (id) on delete set null,
  add column inviter_person_id    uuid references public.persons (id) on delete set null,
  add column relationship_type    relationship_type,
  add column suggested_closeness  closeness_level,
  add column message              text;

comment on column public.invitations.person_id is 'Bereits angelegtes Profil, das mit dem neuen Konto verknüpft wird.';
comment on column public.invitations.relationship_type is 'Beziehung der eingeladenen Person zum Einladenden.';

-- ---------------------------------------------------------------------
-- relationship_suggestions · automatische Beziehungsvorschläge
-- ---------------------------------------------------------------------
create table public.relationship_suggestions (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references public.families (id) on delete cascade,
  from_person_id  uuid not null references public.persons (id) on delete cascade,
  to_person_id    uuid not null references public.persons (id) on delete cascade,
  suggested_type  relationship_type not null,
  suggested_category relationship_category not null default 'biological',
  reason          text,
  status          text not null default 'pending', -- 'pending' | 'confirmed' | 'dismissed'
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (from_person_id, to_person_id)
);
comment on table public.relationship_suggestions is 'Automatisch erkannte Beziehungsvorschläge (bestätigen/anpassen/verwerfen).';
create index relationship_suggestions_family_idx on public.relationship_suggestions (family_id, status);

alter table public.relationship_suggestions enable row level security;

create policy "Vorschläge lesen (Mitglied)" on public.relationship_suggestions for select
  using (public.is_family_member(family_id));
create policy "Vorschläge verwalten (Mitglied)" on public.relationship_suggestions for all
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

-- ---------------------------------------------------------------------
-- Smart-Invite einlösen: verknüpft Konto + Profil, legt Beziehung an
-- ---------------------------------------------------------------------
create or replace function public.accept_smart_invitation(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invitations%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Nicht angemeldet.';
  end if;

  select * into v_inv from public.invitations where code = upper(trim(p_code)) for update;
  if not found then raise exception 'Einladungscode ungültig.'; end if;
  if v_inv.status <> 'pending' then raise exception 'Einladung ist nicht mehr gültig.'; end if;
  if v_inv.expires_at < now() then
    update public.invitations set status = 'expired' where id = v_inv.id;
    raise exception 'Einladung ist abgelaufen.';
  end if;

  -- Mitgliedschaft
  insert into public.family_members (family_id, user_id, role)
  values (v_inv.family_id, v_uid, v_inv.role)
  on conflict (family_id, user_id) do nothing;

  -- Bereits angelegtes Profil mit dem neuen Konto verknüpfen
  if v_inv.person_id is not null then
    update public.persons set user_id = v_uid where id = v_inv.person_id and user_id is null;

    -- Beziehung Einladender -> eingeladene Person automatisch anlegen
    if v_inv.inviter_person_id is not null and v_inv.relationship_type is not null then
      insert into public.relationships (family_id, from_person_id, to_person_id, type, category, created_by)
      values (v_inv.family_id, v_inv.inviter_person_id, v_inv.person_id, v_inv.relationship_type, 'biological', v_inv.invited_by)
      on conflict (from_person_id, to_person_id, type) do nothing;
    end if;
  end if;

  update public.invitations
  set status = 'accepted', accepted_by = v_uid, accepted_at = now()
  where id = v_inv.id;

  return v_inv.family_id;
end;
$$;
-- END 20260615000010_phase5.sql

-- ─────────────────────────────────────────────
-- BEGIN 20260615000011_phase6.sql
-- ─────────────────────────────────────────────
-- =====================================================================
-- Foreverly · Phase 6 · Familienmomente & Familienevents
-- =====================================================================
-- Privater Familienfeed, Events mit Teilnehmern/RSVP, automatische
-- Event-Alben, Familienchronik und Erinnerungs-Challenges. Grundlage für
-- Familienchronik/-historiker/-buch/-film. Inner-Circle-Sichtbarkeit.
-- =====================================================================

create type family_event_type as enum (
  'grillfest', 'geburtstag', 'weihnachten', 'hochzeit', 'taufe',
  'einschulung', 'urlaub', 'feier', 'sonstige'
);
create type rsvp_status as enum ('yes', 'maybe', 'no');

-- ---------------------------------------------------------------------
-- family_events
-- ---------------------------------------------------------------------
create table public.family_events (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid not null references public.families (id) on delete cascade,
  type           family_event_type not null default 'feier',
  title          text not null check (char_length(title) between 1 and 200),
  description    text,
  event_date     date not null,
  event_time     text,
  location       text,
  host_user_id   uuid references public.profiles (id) on delete set null,
  host_person_id uuid references public.persons (id) on delete set null,
  visibility     visibility_level not null default 'family',
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table public.family_events is 'Familienevents (Grillfest, Geburtstag, …) mit Teilnehmern & Album.';
create index family_events_family_date_idx on public.family_events (family_id, event_date desc);

-- ---------------------------------------------------------------------
-- event_participants (Teilnehmer + RSVP + Mitbringen)
-- ---------------------------------------------------------------------
create table public.event_participants (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.family_events (id) on delete cascade,
  person_id     uuid references public.persons (id) on delete cascade,
  user_id       uuid references public.profiles (id) on delete cascade,
  rsvp          rsvp_status,
  comment       text,
  bringing      text,
  responded_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (event_id, person_id)
);
create index event_participants_event_idx on public.event_participants (event_id);

-- ---------------------------------------------------------------------
-- moments · privater Familienfeed + Event-Album-Medien
-- ---------------------------------------------------------------------
-- Ein Moment kann optional einem Event zugeordnet sein (event_id) – dann ist
-- er Teil des automatischen Event-Albums.
create table public.moments (
  id               uuid primary key default gen_random_uuid(),
  family_id        uuid not null references public.families (id) on delete cascade,
  author_user_id   uuid references public.profiles (id) on delete set null,
  kind             text not null default 'text', -- 'text'|'photo'|'video'|'audio'
  text             text,
  storage_path     text,
  duration_seconds integer,
  visibility       visibility_level not null default 'family',
  event_id         uuid references public.family_events (id) on delete cascade,
  created_at       timestamptz not null default now()
);
comment on table public.moments is 'Familienfeed-Beiträge; mit event_id auch Event-Album-Medien.';
create index moments_family_idx on public.moments (family_id, created_at desc);
create index moments_event_idx on public.moments (event_id);

create table public.moment_comments (
  id             uuid primary key default gen_random_uuid(),
  moment_id      uuid not null references public.moments (id) on delete cascade,
  author_user_id uuid references public.profiles (id) on delete set null,
  text           text not null,
  created_at     timestamptz not null default now()
);
create index moment_comments_moment_idx on public.moment_comments (moment_id);

-- ---------------------------------------------------------------------
-- chronicle_entries · Familienchronik (für Kuratierung/Skalierung)
-- ---------------------------------------------------------------------
create table public.chronicle_entries (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.families (id) on delete cascade,
  year         integer not null,
  entry_date   date,
  title        text not null,
  source_type  text,            -- 'event'|'memory'|'birth'|…
  source_id    uuid,
  created_at   timestamptz not null default now()
);
create index chronicle_entries_family_idx on public.chronicle_entries (family_id, year desc);

-- ---------------------------------------------------------------------
-- memory_challenges · Erinnerungs-Challenges (Tracking)
-- ---------------------------------------------------------------------
create table public.memory_challenges (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families (id) on delete cascade,
  title         text not null,
  description   text,
  prompt_type   text,           -- 'photo'|'audio'|'memory'
  month         integer,
  status        text not null default 'open', -- 'open'|'done'
  completed_by  uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index memory_challenges_family_idx on public.memory_challenges (family_id);

-- updated_at
create trigger family_events_set_updated_at before update on public.family_events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS – nur Familienmitglieder
-- ---------------------------------------------------------------------
alter table public.family_events     enable row level security;
alter table public.event_participants enable row level security;
alter table public.moments           enable row level security;
alter table public.moment_comments   enable row level security;
alter table public.chronicle_entries enable row level security;
alter table public.memory_challenges enable row level security;

create policy "Events lesen (Mitglied)" on public.family_events for select using (public.is_family_member(family_id));
create policy "Events verwalten (Mitglied)" on public.family_events for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

create policy "Teilnehmer lesen (Mitglied)" on public.event_participants for select
  using (exists (select 1 from public.family_events e where e.id = event_id and public.is_family_member(e.family_id)));
create policy "Teilnehmer verwalten (Mitglied)" on public.event_participants for all
  using (exists (select 1 from public.family_events e where e.id = event_id and public.is_family_member(e.family_id)))
  with check (exists (select 1 from public.family_events e where e.id = event_id and public.is_family_member(e.family_id)));

create policy "Momente lesen (Mitglied)" on public.moments for select using (public.is_family_member(family_id));
create policy "Moment erstellen (Mitglied)" on public.moments for insert with check (public.is_family_member(family_id) and author_user_id = auth.uid());
create policy "Moment ändern (Autor)" on public.moments for update using (author_user_id = auth.uid()) with check (author_user_id = auth.uid());
create policy "Moment löschen (Autor)" on public.moments for delete using (author_user_id = auth.uid() or public.is_family_admin(family_id));

create policy "Kommentare lesen (Mitglied)" on public.moment_comments for select
  using (exists (select 1 from public.moments m where m.id = moment_id and public.is_family_member(m.family_id)));
create policy "Kommentar schreiben (Mitglied)" on public.moment_comments for insert
  with check (author_user_id = auth.uid() and exists (select 1 from public.moments m where m.id = moment_id and public.is_family_member(m.family_id)));

create policy "Chronik lesen (Mitglied)" on public.chronicle_entries for select using (public.is_family_member(family_id));
create policy "Chronik verwalten (Mitglied)" on public.chronicle_entries for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

create policy "Challenges lesen (Mitglied)" on public.memory_challenges for select using (public.is_family_member(family_id));
create policy "Challenges verwalten (Mitglied)" on public.memory_challenges for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
-- END 20260615000011_phase6.sql

-- ─────────────────────────────────────────────
-- BEGIN 20260617000001_phase6_memorial.sql
-- ─────────────────────────────────────────────
-- =====================================================================
-- FAMII · Phase 6 · Ehrenmitglieder & Familienerbe (ADDITIV)
-- =====================================================================
-- Bereitet die Supabase-Struktur für Gedenkprofile vor. NUR additiv:
-- ausschließlich ADD COLUMN / CREATE TABLE / CREATE POLICY mit IF NOT EXISTS.
-- Es werden KEINE bestehenden Objekte verändert oder entfernt.
--
-- Wird NICHT automatisch auf die Live-App angewendet. Der Web-Build läuft
-- weiterhin im Demo-Modus; diese Datei ist bis zur bewussten Anwendung inert.
-- =====================================================================

-- ---------------------------------------------------------------------
-- persons: Kennzeichnung als Familienerbe + Besonderheiten (additive Spalten)
-- ---------------------------------------------------------------------
alter table public.persons
  add column if not exists is_memorial boolean not null default false,
  add column if not exists traits text;

comment on column public.persons.is_memorial is 'Ehrenmitglied/Familienerbe (Gedenkprofil).';
comment on column public.persons.traits is 'Besonderheiten der Person (frei beschreibbar).';

-- ---------------------------------------------------------------------
-- person_quotes · „Was sie oft gesagt hat" (Zitate)
-- ---------------------------------------------------------------------
create table if not exists public.person_quotes (
  id               uuid primary key default gen_random_uuid(),
  family_id        uuid not null references public.families (id) on delete cascade,
  person_id        uuid not null references public.persons (id) on delete cascade,
  text             text not null check (char_length(text) between 1 and 2000),
  context          text,
  added_by_user_id uuid references public.profiles (id) on delete set null,
  added_by_name    text not null default 'Familienmitglied',
  created_at       timestamptz not null default now()
);
comment on table public.person_quotes is 'Oft gesagte Sätze eines (Ehren-)Mitglieds.';
create index if not exists person_quotes_person_idx on public.person_quotes (person_id, created_at);
create index if not exists person_quotes_family_idx on public.person_quotes (family_id);

-- ---------------------------------------------------------------------
-- person_tributes · „Erinnerungen an diese Person"
-- ---------------------------------------------------------------------
create table if not exists public.person_tributes (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references public.families (id) on delete cascade,
  person_id       uuid not null references public.persons (id) on delete cascade,
  text            text not null check (char_length(text) between 1 and 5000),
  author_user_id  uuid references public.profiles (id) on delete set null,
  author_name     text not null default 'Familienmitglied',
  created_at      timestamptz not null default now()
);
comment on table public.person_tributes is 'Von Familienmitgliedern hinterlassene Erinnerungen an eine Person.';
create index if not exists person_tributes_person_idx on public.person_tributes (person_id, created_at desc);
create index if not exists person_tributes_family_idx on public.person_tributes (family_id);

-- ---------------------------------------------------------------------
-- Row Level Security (nur Familienmitglieder; Autor/Admin darf ändern/löschen)
-- ---------------------------------------------------------------------
alter table public.person_quotes   enable row level security;
alter table public.person_tributes enable row level security;

-- person_quotes
create policy "Zitate lesen (Mitglied)"
  on public.person_quotes for select
  using (public.is_family_member(family_id));

create policy "Zitat hinzufügen (Mitglied)"
  on public.person_quotes for insert
  with check (public.is_family_member(family_id));

create policy "Zitat bearbeiten (Autor oder Admin)"
  on public.person_quotes for update
  using (added_by_user_id = auth.uid() or public.is_family_admin(family_id))
  with check (added_by_user_id = auth.uid() or public.is_family_admin(family_id));

create policy "Zitat löschen (Autor oder Admin)"
  on public.person_quotes for delete
  using (added_by_user_id = auth.uid() or public.is_family_admin(family_id));

-- person_tributes
create policy "Erinnerungen lesen (Mitglied)"
  on public.person_tributes for select
  using (public.is_family_member(family_id));

create policy "Erinnerung hinzufügen (Mitglied)"
  on public.person_tributes for insert
  with check (public.is_family_member(family_id));

create policy "Erinnerung bearbeiten (Autor oder Admin)"
  on public.person_tributes for update
  using (author_user_id = auth.uid() or public.is_family_admin(family_id))
  with check (author_user_id = auth.uid() or public.is_family_admin(family_id));

create policy "Erinnerung löschen (Autor oder Admin)"
  on public.person_tributes for delete
  using (author_user_id = auth.uid() or public.is_family_admin(family_id));
-- END 20260617000001_phase6_memorial.sql

-- ─────────────────────────────────────────────
-- BEGIN 20260617000002_phase6_safety_alerts.sql
-- ─────────────────────────────────────────────
-- =====================================================================
-- FAMII · Phase 6 · SOS-Ereignisse (safety_alerts) (ADDITIV)
-- =====================================================================
-- Bereitet die Supabase-Struktur für echte SOS-Notrufe vor. NUR additiv:
-- ausschließlich CREATE TABLE / CREATE POLICY mit IF NOT EXISTS.
-- Es werden KEINE bestehenden Objekte verändert oder entfernt.
--
-- Wird NICHT automatisch auf die Live-App angewendet (Demo-Modus bleibt aktiv);
-- die Datei ist bis zur bewussten Anwendung inert.
-- =====================================================================

-- ---------------------------------------------------------------------
-- safety_alerts · SOS-Notruf mit letztem bekannten Standortstatus
-- ---------------------------------------------------------------------
create table if not exists public.safety_alerts (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.families (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  person_id    uuid references public.persons (id) on delete set null,
  message      text,
  place_label  text,
  latitude     double precision,
  longitude    double precision,
  battery      integer,
  status       text not null default 'active' check (status in ('active', 'resolved')),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);
comment on table public.safety_alerts is 'SOS-Notrufe (Auslöser, Zeit, Nachricht, Standortstatus, Status).';
create index if not exists safety_alerts_family_idx on public.safety_alerts (family_id, created_at desc);
create index if not exists safety_alerts_status_idx on public.safety_alerts (family_id, status);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
-- Lesen: alle Familienmitglieder (damit Hilfe geleistet werden kann).
-- Auslösen: nur für sich selbst innerhalb der eigenen Familie.
-- Entwarnen (update): jedes Familienmitglied (z. B. Helfer markiert „erledigt").
-- Löschen: Auslöser oder Familien-Admin.
alter table public.safety_alerts enable row level security;

create policy "SOS lesen (Mitglied)"
  on public.safety_alerts for select
  using (public.is_family_member(family_id));

create policy "SOS auslösen (eigenes, Mitglied)"
  on public.safety_alerts for insert
  with check (public.is_family_member(family_id) and user_id = auth.uid());

create policy "SOS entwarnen (Mitglied)"
  on public.safety_alerts for update
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

create policy "SOS löschen (Auslöser oder Admin)"
  on public.safety_alerts for delete
  using (user_id = auth.uid() or public.is_family_admin(family_id));
-- END 20260617000002_phase6_safety_alerts.sql

-- ─────────────────────────────────────────────
-- BEGIN 20260617000003_phase6_accept_invitation_link.sql
-- ─────────────────────────────────────────────
-- =====================================================================
-- Phase 6 · Einladung: angenommene Person mit Konto verknüpfen (Familienbaum)
-- =====================================================================
-- Erweitert accept_invitation: Wird per Smart-Invite eine bereits angelegte
-- Person eingeladen (invitations.person_id gesetzt), so wird diese Person beim
-- Annehmen mit dem neuen Konto verknüpft und – falls Beziehungsdaten vorhanden
-- sind – die Beziehung zum Einladenden angelegt. Dadurch erscheint das neue
-- Mitglied SICHTBAR im Familienbaum (nicht nur in der Mitgliederliste).
--
-- Rein additiv (CREATE OR REPLACE FUNCTION). Keine Datenänderung, keine
-- Tabellenänderung. Auf die Staging-DB anwenden (einmal im SQL Editor).
-- =====================================================================

create or replace function public.accept_invitation(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.invitations%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Nicht angemeldet.';
  end if;

  select * into v_invitation
  from public.invitations
  where code = upper(trim(p_code))
  for update;

  if not found then
    raise exception 'Einladungscode ungültig.';
  end if;

  if v_invitation.status <> 'pending' then
    raise exception 'Einladung ist nicht mehr gültig.';
  end if;

  if v_invitation.expires_at < now() then
    update public.invitations set status = 'expired' where id = v_invitation.id;
    raise exception 'Einladung ist abgelaufen.';
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (v_invitation.family_id, v_uid, v_invitation.role)
  on conflict (family_id, user_id) do nothing;

  -- Smart-Invite: vorhandene Person mit dem neuen Konto verknüpfen.
  if v_invitation.person_id is not null then
    update public.persons
       set user_id = v_uid
     where id = v_invitation.person_id
       and family_id = v_invitation.family_id
       and user_id is null;

    -- Beziehung Einladender -> Person automatisch anlegen (für den Familienbaum).
    if v_invitation.inviter_person_id is not null
       and v_invitation.relationship_type is not null
       and v_invitation.inviter_person_id <> v_invitation.person_id then
      insert into public.relationships
        (family_id, from_person_id, to_person_id, type, category, created_by)
      select
        v_invitation.family_id,
        v_invitation.inviter_person_id,
        v_invitation.person_id,
        v_invitation.relationship_type,
        'biological'::relationship_category,
        v_invitation.invited_by
      where not exists (
        select 1 from public.relationships r
        where r.from_person_id = v_invitation.inviter_person_id
          and r.to_person_id   = v_invitation.person_id
          and r.type           = v_invitation.relationship_type
      );
    end if;
  end if;

  update public.invitations
     set status = 'accepted', accepted_by = v_uid, accepted_at = now()
   where id = v_invitation.id;

  return v_invitation.family_id;
end;
$$;
-- END 20260617000003_phase6_accept_invitation_link.sql
