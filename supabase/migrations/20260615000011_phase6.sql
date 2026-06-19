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
