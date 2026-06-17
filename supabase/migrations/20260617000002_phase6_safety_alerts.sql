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
