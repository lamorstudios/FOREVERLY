-- =====================================================================
-- Foreverly · Real Users Foundation
-- =====================================================================
-- Macht die App von der Demo zu echten Nutzern nutzbar:
--  • Profil-Erstellung robust für OAuth (Google liefert name/picture)
--  • Familien-Ersteller wird automatisch ERSTE Person im Stammbaum
--  • Einladung einlösen vereinheitlicht: Mitgliedschaft + Personenprofil
--    + Beziehung + Beziehungsvorschlag, sodass die eingeladene Person
--    direkt korrekt im Familienbaum erscheint.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Profil aus Auth-Metadaten befüllen (E-Mail/Passwort UND Google OAuth)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2) Familienersteller: Admin-Mitglied + erste Person im Stammbaum
-- ---------------------------------------------------------------------
create or replace function public.handle_new_family()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name   text;
  v_avatar text;
  v_first  text;
  v_last   text;
begin
  insert into public.family_members (family_id, user_id, role)
  values (new.id, new.created_by, 'admin')
  on conflict (family_id, user_id) do nothing;

  select coalesce(nullif(full_name, ''), 'Ich'), avatar_url
    into v_name, v_avatar
  from public.profiles
  where id = new.created_by;

  v_name  := coalesce(v_name, 'Ich');
  v_first := split_part(v_name, ' ', 1);
  v_last  := nullif(btrim(substr(v_name, length(v_first) + 1)), '');

  if not exists (
    select 1 from public.persons p
    where p.family_id = new.id and p.user_id = new.created_by
  ) then
    insert into public.persons (family_id, user_id, first_name, last_name, avatar_url, created_by)
    values (new.id, new.created_by, v_first, v_last, v_avatar, new.created_by);
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3) Einladung einlösen (vereinheitlicht, ersetzt frühere Version)
--    Mitgliedschaft + Personenprofil + Beziehung + Vorschlag.
-- ---------------------------------------------------------------------
create or replace function public.accept_invitation(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv    public.invitations%rowtype;
  v_uid    uuid := auth.uid();
  v_name   text;
  v_avatar text;
  v_first  text;
  v_last   text;
  v_person uuid;
begin
  if v_uid is null then
    raise exception 'Nicht angemeldet.';
  end if;

  select * into v_inv
  from public.invitations
  where code = upper(trim(p_code))
  for update;

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

  -- Personenprofil bestimmen / anlegen
  if v_inv.person_id is not null then
    update public.persons set user_id = v_uid
    where id = v_inv.person_id and user_id is null;
    v_person := v_inv.person_id;
  else
    select id into v_person
    from public.persons
    where family_id = v_inv.family_id and user_id = v_uid
    limit 1;

    if v_person is null then
      select coalesce(nullif(full_name, ''), 'Neu'), avatar_url
        into v_name, v_avatar
      from public.profiles where id = v_uid;
      v_name  := coalesce(v_name, 'Neu');
      v_first := split_part(v_name, ' ', 1);
      v_last  := nullif(btrim(substr(v_name, length(v_first) + 1)), '');

      insert into public.persons (family_id, user_id, first_name, last_name, avatar_url, created_by)
      values (v_inv.family_id, v_uid, v_first, v_last, v_avatar, v_uid)
      returning id into v_person;
    end if;
  end if;

  -- Beziehung Einladender -> eingeladene Person + Vorschlag
  if v_person is not null
     and v_inv.inviter_person_id is not null
     and v_inv.relationship_type is not null then
    insert into public.relationships (family_id, from_person_id, to_person_id, type, category, created_by)
    values (v_inv.family_id, v_inv.inviter_person_id, v_person, v_inv.relationship_type, 'biological', v_inv.invited_by)
    on conflict (from_person_id, to_person_id, type) do nothing;

    insert into public.relationship_suggestions (family_id, from_person_id, to_person_id, suggested_type, suggested_category, reason, created_by)
    values (v_inv.family_id, v_inv.inviter_person_id, v_person, v_inv.relationship_type, 'biological', 'Aus Einladung übernommen', v_inv.invited_by)
    on conflict (from_person_id, to_person_id) do nothing;
  end if;

  update public.invitations
  set status = 'accepted', accepted_by = v_uid, accepted_at = now()
  where id = v_inv.id;

  return v_inv.family_id;
end;
$$;
