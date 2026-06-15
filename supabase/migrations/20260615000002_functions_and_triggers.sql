-- =====================================================================
-- Foreverly · Funktionen & Trigger
-- =====================================================================

-- ---------------------------------------------------------------------
-- updated_at automatisch pflegen
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at      before update on public.profiles      for each row execute function public.set_updated_at();
create trigger families_set_updated_at      before update on public.families      for each row execute function public.set_updated_at();
create trigger persons_set_updated_at       before update on public.persons       for each row execute function public.set_updated_at();
create trigger memories_set_updated_at      before update on public.memories      for each row execute function public.set_updated_at();
create trigger time_capsules_set_updated_at before update on public.time_capsules for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Neues Profil anlegen, wenn sich ein Nutzer registriert
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
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Membership-Helper (SECURITY DEFINER, um RLS-Rekursion zu vermeiden)
-- ---------------------------------------------------------------------
create or replace function public.is_family_member(p_family_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.family_members fm
    where fm.family_id = p_family_id
      and fm.user_id = auth.uid()
  );
$$;

create or replace function public.is_family_admin(p_family_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.family_members fm
    where fm.family_id = p_family_id
      and fm.user_id = auth.uid()
      and fm.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- Ersteller einer Familie automatisch als Admin eintragen
-- ---------------------------------------------------------------------
create or replace function public.handle_new_family()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.family_members (family_id, user_id, role)
  values (new.id, new.created_by, 'admin')
  on conflict (family_id, user_id) do nothing;
  return new;
end;
$$;

create trigger on_family_created
  after insert on public.families
  for each row execute function public.handle_new_family();

-- ---------------------------------------------------------------------
-- Einladungscode generieren (lesbar, ohne verwechselbare Zeichen)
-- ---------------------------------------------------------------------
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- ---------------------------------------------------------------------
-- Einladung einlösen: prüft Code, fügt Nutzer der Familie hinzu
-- ---------------------------------------------------------------------
create or replace function public.accept_invitation(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.invitations%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Nicht angemeldet.';
  end if;

  select * into v_invitation
  from public.invitations
  where code = upper(trim(p_code))
  for update;

  if not found then
    raise exception 'Einladungscode ungültig.';
  end if;

  if v_invitation.status <> 'pending' then
    raise exception 'Einladung ist nicht mehr gültig.';
  end if;

  if v_invitation.expires_at < now() then
    update public.invitations set status = 'expired' where id = v_invitation.id;
    raise exception 'Einladung ist abgelaufen.';
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (v_invitation.family_id, v_uid, v_invitation.role)
  on conflict (family_id, user_id) do nothing;

  update public.invitations
  set status = 'accepted', accepted_by = v_uid, accepted_at = now()
  where id = v_invitation.id;

  return v_invitation.family_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Fällige Zeitkapseln freigeben (per Cron / Edge Function aufrufbar)
-- ---------------------------------------------------------------------
create or replace function public.release_due_time_capsules()
returns setof public.time_capsules
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.time_capsules
  set is_opened = true
  where is_opened = false
    and open_at <= now()
  returning *;
end;
$$;
