-- =====================================================================
-- Foreverly · Phase 5 · Smart Family Invites
-- =====================================================================
-- Personenbezogene Einladungslinks: Ein eingeladener Nutzer wird nach der
-- Registrierung automatisch mit einem bereits angelegten Personenprofil
-- verknüpft und erscheint korrekt im Familiennetzwerk. Dazu Beziehungs-
-- vorschläge (z.B. „Lea könnte deine Nichte sein"). Skalierbar angelegt.
-- =====================================================================

-- Neue Beziehungstypen (Nichte/Neffe) für Beziehungsvorschläge
alter type relationship_type add value if not exists 'nichte';
alter type relationship_type add value if not exists 'neffe';

-- ---------------------------------------------------------------------
-- invitations erweitern (personenbezogene Smart Invites)
-- ---------------------------------------------------------------------
alter table public.invitations
  add column person_id            uuid references public.persons (id) on delete set null,
  add column inviter_person_id    uuid references public.persons (id) on delete set null,
  add column relationship_type    relationship_type,
  add column suggested_closeness  closeness_level,
  add column message              text;

comment on column public.invitations.person_id is 'Bereits angelegtes Profil, das mit dem neuen Konto verknüpft wird.';
comment on column public.invitations.relationship_type is 'Beziehung der eingeladenen Person zum Einladenden.';

-- ---------------------------------------------------------------------
-- relationship_suggestions · automatische Beziehungsvorschläge
-- ---------------------------------------------------------------------
create table public.relationship_suggestions (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references public.families (id) on delete cascade,
  from_person_id  uuid not null references public.persons (id) on delete cascade,
  to_person_id    uuid not null references public.persons (id) on delete cascade,
  suggested_type  relationship_type not null,
  suggested_category relationship_category not null default 'biological',
  reason          text,
  status          text not null default 'pending', -- 'pending' | 'confirmed' | 'dismissed'
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (from_person_id, to_person_id)
);
comment on table public.relationship_suggestions is 'Automatisch erkannte Beziehungsvorschläge (bestätigen/anpassen/verwerfen).';
create index relationship_suggestions_family_idx on public.relationship_suggestions (family_id, status);

alter table public.relationship_suggestions enable row level security;

create policy "Vorschläge lesen (Mitglied)" on public.relationship_suggestions for select
  using (public.is_family_member(family_id));
create policy "Vorschläge verwalten (Mitglied)" on public.relationship_suggestions for all
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

-- ---------------------------------------------------------------------
-- Smart-Invite einlösen: verknüpft Konto + Profil, legt Beziehung an
-- ---------------------------------------------------------------------
create or replace function public.accept_smart_invitation(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invitations%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Nicht angemeldet.';
  end if;

  select * into v_inv from public.invitations where code = upper(trim(p_code)) for update;
  if not found then raise exception 'Einladungscode ungültig.'; end if;
  if v_inv.status <> 'pending' then raise exception 'Einladung ist nicht mehr gültig.'; end if;
  if v_inv.expires_at < now() then
    update public.invitations set status = 'expired' where id = v_inv.id;
    raise exception 'Einladung ist abgelaufen.';
  end if;

  -- Mitgliedschaft
  insert into public.family_members (family_id, user_id, role)
  values (v_inv.family_id, v_uid, v_inv.role)
  on conflict (family_id, user_id) do nothing;

  -- Bereits angelegtes Profil mit dem neuen Konto verknüpfen
  if v_inv.person_id is not null then
    update public.persons set user_id = v_uid where id = v_inv.person_id and user_id is null;

    -- Beziehung Einladender -> eingeladene Person automatisch anlegen
    if v_inv.inviter_person_id is not null and v_inv.relationship_type is not null then
      insert into public.relationships (family_id, from_person_id, to_person_id, type, category, created_by)
      values (v_inv.family_id, v_inv.inviter_person_id, v_inv.person_id, v_inv.relationship_type, 'biological', v_inv.invited_by)
      on conflict (from_person_id, to_person_id, type) do nothing;
    end if;
  end if;

  update public.invitations
  set status = 'accepted', accepted_by = v_uid, accepted_at = now()
  where id = v_inv.id;

  return v_inv.family_id;
end;
$$;
