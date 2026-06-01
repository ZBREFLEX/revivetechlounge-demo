alter table public.profiles drop constraint if exists profiles_role_check;

update public.profiles
set role = 'stock-manager'
where role = 'manager';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super-admin', 'admin', 'stock-manager', 'staff'));

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

  if not exists (select 1 from public.shops where id = target_shop) then
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

create or replace function public.can_manage_products()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and approved = true
      and role in ('super-admin', 'admin', 'stock-manager')
  );
$$;

revoke all on function public.can_manage_products() from public;
grant execute on function public.can_manage_products() to authenticated;

create or replace function public.can_record_sales()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and approved = true
      and role = 'staff'
  );
$$;

revoke all on function public.can_record_sales() from public;
grant execute on function public.can_record_sales() to authenticated;

alter table public.inventory_movements add column if not exists customer_name text;
alter table public.inventory_movements add column if not exists customer_phone text;
alter table public.inventory_movements add column if not exists customer_note text;

drop function if exists public.list_inventory_movements();

create or replace function public.list_inventory_movements()
returns table (
  id uuid,
  product_name text,
  sku text,
  quantity_change integer,
  stock_before integer,
  stock_after integer,
  note text,
  customer_name text,
  customer_phone text,
  customer_note text,
  updated_by text,
  created_at timestamptz
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to view inventory history';
  end if;

  return query
  select
    movement.id,
    product.name,
    product.sku,
    movement.quantity_change,
    movement.stock_before,
    movement.stock_after,
    movement.note,
    movement.customer_name,
    movement.customer_phone,
    movement.customer_note,
    coalesce(profile.full_name, profile.email),
    movement.created_at
  from public.inventory_movements as movement
  join public.products as product on product.id = movement.product_id
  left join public.profiles as profile on profile.id = movement.created_by
  order by movement.created_at desc
  limit 20;
end;
$$;

revoke all on function public.list_inventory_movements() from public;
grant execute on function public.list_inventory_movements() to authenticated;

drop function if exists public.record_product_sale(uuid);

create or replace function public.record_product_sale(
  target_product_id uuid,
  customer_name text,
  customer_phone text,
  customer_note text
)
returns integer
language plpgsql
security definer set search_path = ''
as $$
declare
  current_stock integer;
  updated_stock integer;
begin
  if not (select public.can_record_sales()) then
    raise exception 'Only approved staff can mark products as sold';
  end if;

  if trim(customer_name) = '' or trim(customer_phone) = '' then
    raise exception 'Customer name and phone are required';
  end if;

  select product.stock
  into current_stock
  from public.products as product
  where product.id = target_product_id
  for update;

  if current_stock is null then
    raise exception 'Product not found';
  end if;

  if current_stock = 0 then
    raise exception 'This product is already out of stock';
  end if;

  updated_stock := current_stock - 1;

  update public.products
  set stock = updated_stock,
      updated_at = now()
  where id = target_product_id;

  insert into public.inventory_movements (
    product_id,
    quantity_change,
    stock_before,
    stock_after,
    note,
    customer_name,
    customer_phone,
    customer_note,
    created_by
  )
  values (
    target_product_id,
    -1,
    current_stock,
    updated_stock,
    'Sold item',
    trim(customer_name),
    trim(customer_phone),
    nullif(trim(customer_note), ''),
    (select auth.uid())
  );

  return updated_stock;
end;
$$;

revoke all on function public.record_product_sale(uuid, text, text, text) from public;
grant execute on function public.record_product_sale(uuid, text, text, text) to authenticated;

notify pgrst, 'reload schema';
