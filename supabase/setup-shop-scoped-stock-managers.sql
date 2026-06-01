create or replace function public.can_access_shop(target_shop_id text)
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
      and (
        role in ('super-admin', 'admin', 'stock-manager', 'staff')
      )
  );
$$;

revoke all on function public.can_access_shop(text) from public;
grant execute on function public.can_access_shop(text) to authenticated;

create or replace function public.can_manage_shop(target_shop_id text)
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
      and (
        role in ('super-admin', 'admin')
        or (role = 'stock-manager' and shop = target_shop_id)
      )
  );
$$;

revoke all on function public.can_manage_shop(text) from public;
grant execute on function public.can_manage_shop(text) to authenticated;

create or replace function public.can_sell_shop(target_shop_id text)
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
      and shop = target_shop_id
  );
$$;

revoke all on function public.can_sell_shop(text) from public;
grant execute on function public.can_sell_shop(text) to authenticated;

create or replace function public.list_product_options()
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to view product options';
  end if;

  return jsonb_build_object(
    'categories', (select coalesce(jsonb_agg(category order by category.name), '[]'::jsonb) from public.categories as category),
    'brands', (select coalesce(jsonb_agg(brand order by brand.name), '[]'::jsonb) from public.brands as brand),
    'shops', (select coalesce(jsonb_agg(shop order by shop.name), '[]'::jsonb) from public.shops as shop where shop.is_open = true and (select public.can_access_shop(shop.id)))
  );
end;
$$;

create or replace function public.list_products()
returns table (
  id uuid, name text, description text, sku text, price numeric, cost numeric,
  stock integer, category_id text, category_name text, brand_id text,
  brand_name text, shop_id text, shop_name text, image_url text
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to view products';
  end if;

  return query
  select product.id, product.name, product.description, product.sku,
    product.price, product.cost, product.stock, product.category_id,
    category.name, product.brand_id, brand.name, product.shop_id, shop.name,
    product.image_url
  from public.products as product
  join public.categories as category on category.id = product.category_id
  join public.brands as brand on brand.id = product.brand_id
  join public.shops as shop on shop.id = product.shop_id
  where (select public.can_access_shop(product.shop_id))
  order by product.created_at desc;
end;
$$;

create or replace function public.get_product(product_id uuid)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
begin
  if not (select public.can_manage_products()) then
    raise exception 'You do not have permission to edit products';
  end if;

  return (
    select to_jsonb(product)
    from public.products as product
    where product.id = get_product.product_id
      and (select public.can_manage_shop(product.shop_id))
  );
end;
$$;

create or replace function public.save_product(
  product_id uuid, product_name text, product_description text,
  product_sku text, product_price numeric, product_cost numeric,
  product_stock integer, product_category_id text, product_brand_id text,
  product_shop_id text, product_image_url text
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  saved_id uuid;
begin
  if not (select public.can_manage_products()) then
    raise exception 'You do not have permission to save products';
  end if;

  if not (select public.can_manage_shop(product_shop_id)) then
    raise exception 'You can only save products for your assigned shop';
  end if;

  if product_id is not null and not exists (
    select 1
    from public.products as product
    where product.id = save_product.product_id
      and (select public.can_manage_shop(product.shop_id))
  ) then
    raise exception 'You can only edit products for your assigned shop';
  end if;

  if trim(product_name) = '' or trim(product_sku) = '' then
    raise exception 'Product name and SKU are required';
  end if;

  insert into public.products (
    id, name, description, sku, price, cost, stock, category_id, brand_id,
    shop_id, image_url, updated_at
  )
  values (
    coalesce(product_id, gen_random_uuid()), trim(product_name),
    nullif(trim(product_description), ''), upper(trim(product_sku)),
    product_price, product_cost, product_stock, product_category_id,
    product_brand_id, product_shop_id, nullif(trim(product_image_url), ''), now()
  )
  on conflict (id) do update
  set name = excluded.name, description = excluded.description,
      sku = excluded.sku, price = excluded.price, cost = excluded.cost,
      stock = excluded.stock, category_id = excluded.category_id,
      brand_id = excluded.brand_id, shop_id = excluded.shop_id,
      image_url = excluded.image_url, updated_at = now()
  returning id into saved_id;

  return saved_id;
end;
$$;

create or replace function public.delete_product(product_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not (select public.can_manage_products()) then
    raise exception 'You do not have permission to delete products';
  end if;

  delete from public.products as product
  where product.id = delete_product.product_id
    and (select public.can_manage_shop(product.shop_id));

  if not found then
    raise exception 'You can only delete products for your assigned shop';
  end if;
end;
$$;

create or replace function public.list_inventory()
returns table (id uuid, name text, sku text, stock integer, shop_id text, shop_name text)
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to view inventory';
  end if;

  return query
  select product.id, product.name, product.sku, product.stock, product.shop_id, shop.name
  from public.products as product
  join public.shops as shop on shop.id = product.shop_id
  where (select public.can_access_shop(product.shop_id))
  order by product.name;
end;
$$;

create or replace function public.list_inventory_movements()
returns table (
  id uuid, product_name text, sku text, quantity_change integer,
  stock_before integer, stock_after integer, note text, customer_name text,
  customer_phone text, customer_note text, updated_by text, created_at timestamptz
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to view inventory history';
  end if;

  return query
  select movement.id, product.name, product.sku, movement.quantity_change,
    movement.stock_before, movement.stock_after, movement.note,
    movement.customer_name, movement.customer_phone, movement.customer_note,
    coalesce(profile.full_name, profile.email), movement.created_at
  from public.inventory_movements as movement
  join public.products as product on product.id = movement.product_id
  left join public.profiles as profile on profile.id = movement.created_by
  where (select public.can_access_shop(product.shop_id))
  order by movement.created_at desc
  limit 20;
end;
$$;

create or replace function public.adjust_product_stock(
  target_product_id uuid, quantity_change integer, adjustment_note text
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

  select product.stock into current_stock
  from public.products as product
  where product.id = target_product_id
    and (select public.can_manage_shop(product.shop_id))
  for update;

  if current_stock is null then
    raise exception 'You can only adjust stock for products in your assigned shop';
  end if;

  updated_stock := current_stock + quantity_change;
  if updated_stock < 0 then
    raise exception 'Stock cannot be lower than zero';
  end if;

  update public.products set stock = updated_stock, updated_at = now()
  where id = target_product_id;

  insert into public.inventory_movements (
    product_id, quantity_change, stock_before, stock_after, note, created_by
  ) values (
    target_product_id, quantity_change, current_stock, updated_stock,
    nullif(trim(adjustment_note), ''), (select auth.uid())
  );

  return updated_stock;
end;
$$;

create or replace function public.record_product_sale(
  target_product_id uuid, customer_name text, customer_phone text, customer_note text
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

  select product.stock into current_stock
  from public.products as product
  where product.id = target_product_id
    and (select public.can_sell_shop(product.shop_id))
  for update;

  if current_stock is null then
    raise exception 'You can only sell products from your assigned shop';
  end if;

  if current_stock = 0 then
    raise exception 'This product is already out of stock';
  end if;

  updated_stock := current_stock - 1;
  update public.products set stock = updated_stock, updated_at = now()
  where id = target_product_id;

  insert into public.inventory_movements (
    product_id, quantity_change, stock_before, stock_after, note,
    customer_name, customer_phone, customer_note, created_by
  ) values (
    target_product_id, -1, current_stock, updated_stock, 'Sold item',
    trim(customer_name), trim(customer_phone), nullif(trim(customer_note), ''),
    (select auth.uid())
  );

  return updated_stock;
end;
$$;

create or replace function public.list_customer_sales()
returns table (
  id uuid, customer_name text, customer_phone text, customer_note text,
  product_name text, sku text, recorded_by text, created_at timestamptz
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if not ((select public.can_manage_products()) or (select public.can_record_sales())) then
    raise exception 'You do not have permission to view customer sales';
  end if;

  return query
  select movement.id, movement.customer_name, movement.customer_phone,
    movement.customer_note, product.name, product.sku,
    coalesce(profile.full_name, profile.email), movement.created_at
  from public.inventory_movements as movement
  join public.products as product on product.id = movement.product_id
  left join public.profiles as profile on profile.id = movement.created_by
  where movement.customer_name is not null
    and (select public.can_access_shop(product.shop_id))
  order by movement.created_at desc;
end;
$$;

revoke all on function public.list_product_options() from public;
revoke all on function public.list_products() from public;
revoke all on function public.get_product(uuid) from public;
revoke all on function public.save_product(uuid, text, text, text, numeric, numeric, integer, text, text, text, text) from public;
revoke all on function public.delete_product(uuid) from public;
revoke all on function public.list_inventory() from public;
revoke all on function public.list_inventory_movements() from public;
revoke all on function public.adjust_product_stock(uuid, integer, text) from public;
revoke all on function public.record_product_sale(uuid, text, text, text) from public;
revoke all on function public.list_customer_sales() from public;

grant execute on function public.list_product_options() to authenticated;
grant execute on function public.list_products() to authenticated;
grant execute on function public.get_product(uuid) to authenticated;
grant execute on function public.save_product(uuid, text, text, text, numeric, numeric, integer, text, text, text, text) to authenticated;
grant execute on function public.delete_product(uuid) to authenticated;
grant execute on function public.list_inventory() to authenticated;
grant execute on function public.list_inventory_movements() to authenticated;
grant execute on function public.adjust_product_stock(uuid, integer, text) to authenticated;
grant execute on function public.record_product_sale(uuid, text, text, text) to authenticated;
grant execute on function public.list_customer_sales() to authenticated;

notify pgrst, 'reload schema';
