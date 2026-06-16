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
