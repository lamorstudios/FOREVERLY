-- =====================================================================
-- Foreverly · Moderation (Melden & Blockieren) – Grundstruktur
-- =====================================================================
-- Legt die Tabellen für Meldungen und Blockierungen an. Die Durchsetzung
-- (Sichtbarkeit, Sperren) erfolgt clientseitig/serverseitig in späteren
-- Phasen; hier wird die DSGVO-/Sicherheits-Grundlage geschaffen.
-- =====================================================================

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid references public.families (id) on delete cascade,
  reporter_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('user', 'content')),
  target_id   text not null,
  reason      text not null,
  note        text,
  status      text not null default 'open', -- 'open' | 'reviewing' | 'resolved' | 'dismissed'
  created_at  timestamptz not null default now()
);
create index if not exists reports_family_idx on public.reports (family_id, status);

create table if not exists public.member_blocks (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid references public.families (id) on delete cascade,
  blocker_id      uuid not null references public.profiles (id) on delete cascade,
  blocked_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (family_id, blocker_id, blocked_user_id)
);
create index if not exists member_blocks_blocker_idx on public.member_blocks (blocker_id);

alter table public.reports enable row level security;
alter table public.member_blocks enable row level security;

-- Meldungen: Mitglieder dürfen für ihre Familie melden und eigene Meldungen sehen.
create policy "Meldung erstellen (Mitglied)" on public.reports for insert
  with check (public.is_family_member(family_id) and reporter_id = auth.uid());
create policy "Eigene Meldungen lesen" on public.reports for select
  using (reporter_id = auth.uid() or public.is_family_admin(family_id));

-- Blockierungen: jede Person verwaltet ihre eigenen Blockierungen.
create policy "Blockierungen verwalten (eigene)" on public.member_blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
