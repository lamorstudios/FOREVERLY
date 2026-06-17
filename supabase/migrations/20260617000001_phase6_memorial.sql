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
