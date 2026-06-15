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
