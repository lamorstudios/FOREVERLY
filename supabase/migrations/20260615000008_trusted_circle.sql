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
