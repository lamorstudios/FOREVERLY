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
