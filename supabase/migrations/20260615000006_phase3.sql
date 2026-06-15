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
