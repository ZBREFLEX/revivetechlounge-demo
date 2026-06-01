create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  quantity_change integer not null check (quantity_change <> 0),
  stock_before integer not null check (stock_before >= 0),
  stock_after integer not null check (stock_after >= 0),
  note text,
  customer_name text,
  customer_phone text,
  customer_note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.inventory_movements enable row level security;
alter table public.inventory_movements add column if not exists customer_name text;
alter table public.inventory_movements add column if not exists customer_phone text;
alter table public.inventory_movements add column if not exists customer_note text;
alter table public.inventory_movements drop constraint if exists inventory_movements_created_by_fkey;
alter table public.inventory_movements
  add constraint inventory_movements_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

create or replace function public.list_inventory()
returns table (
  id uuid,
  name text,
  sku text,
  stock integer,
  shop_id text,
  shop_name text
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to view inventory';
  end if;

  return query
  select
    product.id,
    product.name,
    product.sku,
    product.stock,
    product.shop_id,
    shop.name
  from public.products as product
  join public.shops as shop on shop.id = product.shop_id
  order by product.name;
end;
$$;

revoke all on function public.list_inventory() from public;
grant execute on function public.list_inventory() to authenticated;

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

create or replace function public.adjust_product_stock(
  target_product_id uuid,
  quantity_change integer,
  adjustment_note text
)
returns integer
language plpgsql
security definer set search_path = ''
as $$
declare
  current_stock integer;
  updated_stock integer;
begin
  if not (select public.can_manage_products()) then
    raise exception 'You do not have permission to adjust stock';
  end if;

  if quantity_change is null or quantity_change = 0 then
    raise exception 'Stock adjustment cannot be zero';
  end if;

  select product.stock
  into current_stock
  from public.products as product
  where product.id = target_product_id
  for update;

  if current_stock is null then
    raise exception 'Product not found';
  end if;

  updated_stock := current_stock + quantity_change;

  if updated_stock < 0 then
    raise exception 'Stock cannot be lower than zero';
  end if;

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
    created_by
  )
  values (
    target_product_id,
    quantity_change,
    current_stock,
    updated_stock,
    nullif(trim(adjustment_note), ''),
    (select auth.uid())
  );

  return updated_stock;
end;
$$;

revoke all on function public.adjust_product_stock(uuid, integer, text) from public;
grant execute on function public.adjust_product_stock(uuid, integer, text) to authenticated;

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
