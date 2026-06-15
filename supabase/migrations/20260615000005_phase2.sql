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
