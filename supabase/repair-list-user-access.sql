create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'super-admin'
      and approved = true
  );
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

create or replace function public.list_user_access()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  shop text,
  approved boolean,
  created_at timestamptz
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if not (select public.is_super_admin()) then
    raise exception 'Only a super admin can view user access';
  end if;

  return query
  select
    profile.id,
    profile.email,
    profile.full_name,
    profile.role,
    profile.shop,
    profile.approved,
    profile.created_at
  from public.profiles as profile
  order by profile.created_at;
end;
$$;

revoke all on function public.list_user_access() from public;
grant execute on function public.list_user_access() to authenticated;

create or replace function public.update_user_access(
  target_user_id uuid,
  target_role text,
  target_shop text,
  target_approved boolean
)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not (select public.is_super_admin()) then
    raise exception 'Only a super admin can update user access';
  end if;

  if target_user_id = (select auth.uid()) then
    raise exception 'You cannot change your own access';
  end if;

  if target_role not in ('super-admin', 'admin', 'manager', 'staff') then
    raise exception 'Invalid role';
  end if;

  if target_shop not in ('shop-1', 'shop-2') then
    raise exception 'Invalid shop';
  end if;

  update public.profiles
  set role = target_role,
      shop = target_shop,
      approved = target_approved
  where id = target_user_id;
end;
$$;

revoke all on function public.update_user_access(uuid, text, text, boolean) from public;
grant execute on function public.update_user_access(uuid, text, text, boolean) to authenticated;

notify pgrst, 'reload schema';
