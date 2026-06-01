alter table public.inventory_movements drop constraint if exists inventory_movements_created_by_fkey;
alter table public.inventory_movements
  add constraint inventory_movements_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

create or replace function public.delete_user_access(target_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not (select public.is_super_admin()) then
    raise exception 'Only a super admin can delete user accounts';
  end if;

  if target_user_id = (select auth.uid()) then
    raise exception 'You cannot delete your own account';
  end if;

  delete from auth.users
  where id = target_user_id;
end;
$$;

revoke all on function public.delete_user_access(uuid) from public;
grant execute on function public.delete_user_access(uuid) to authenticated;

create or replace function public.list_customer_sales()
returns table (
  id uuid,
  customer_name text,
  customer_phone text,
  customer_note text,
  product_name text,
  sku text,
  recorded_by text,
  created_at timestamptz
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if not ((select public.can_manage_products()) or (select public.can_record_sales())) then
    raise exception 'You do not have permission to view customer sales';
  end if;

  return query
  select
    movement.id,
    movement.customer_name,
    movement.customer_phone,
    movement.customer_note,
    product.name,
    product.sku,
    coalesce(profile.full_name, profile.email),
    movement.created_at
  from public.inventory_movements as movement
  join public.products as product on product.id = movement.product_id
  left join public.profiles as profile on profile.id = movement.created_by
  where movement.customer_name is not null
  order by movement.created_at desc;
end;
$$;

revoke all on function public.list_customer_sales() from public;
grant execute on function public.list_customer_sales() to authenticated;

notify pgrst, 'reload schema';
