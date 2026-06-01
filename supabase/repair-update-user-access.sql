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

  if target_role not in ('super-admin', 'admin', 'stock-manager', 'staff') then
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
