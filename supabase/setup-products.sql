create table if not exists public.categories (
  id text primary key,
  name text not null unique
);

create table if not exists public.brands (
  id text primary key,
  name text not null unique
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sku text not null unique,
  price numeric(12, 2) not null default 0 check (price >= 0),
  cost numeric(12, 2) not null default 0 check (cost >= 0),
  stock integer not null default 0 check (stock >= 0),
  category_id text not null references public.categories(id),
  brand_id text not null references public.brands(id),
  shop_id text not null references public.shops(id),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.categories (id, name)
values
  ('mobile-phones', 'Mobile Phones'),
  ('used-phones', 'Used Phones'),
  ('custom-pc-builds', 'Custom PC Builds'),
  ('accessories', 'Accessories'),
  ('laptops', 'Laptops')
on conflict (id) do nothing;

insert into public.brands (id, name)
values
  ('apple', 'Apple'),
  ('samsung', 'Samsung'),
  ('oneplus', 'OnePlus'),
  ('asus', 'Asus'),
  ('msi', 'MSI'),
  ('lenovo', 'Lenovo')
on conflict (id) do nothing;

alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

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
      and role in ('super-admin', 'admin', 'manager')
  );
$$;

revoke all on function public.can_manage_products() from public;
grant execute on function public.can_manage_products() to authenticated;

drop policy if exists "Product managers can upload images" on storage.objects;
drop policy if exists "Product managers can update images" on storage.objects;
drop policy if exists "Product managers can delete images" on storage.objects;

create policy "Product managers can upload images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (select public.can_manage_products())
  );

create policy "Product managers can update images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and (select public.can_manage_products())
  )
  with check (
    bucket_id = 'product-images'
    and (select public.can_manage_products())
  );

create policy "Product managers can delete images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and (select public.can_manage_products())
  );

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
    'shops', (select coalesce(jsonb_agg(shop order by shop.name), '[]'::jsonb) from public.shops as shop where shop.is_open = true)
  );
end;
$$;

revoke all on function public.list_product_options() from public;
grant execute on function public.list_product_options() to authenticated;

create or replace function public.list_products()
returns table (
  id uuid,
  name text,
  description text,
  sku text,
  price numeric,
  cost numeric,
  stock integer,
  category_id text,
  category_name text,
  brand_id text,
  brand_name text,
  shop_id text,
  shop_name text,
  image_url text
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to view products';
  end if;

  return query
  select
    product.id,
    product.name,
    product.description,
    product.sku,
    product.price,
    product.cost,
    product.stock,
    product.category_id,
    category.name,
    product.brand_id,
    brand.name,
    product.shop_id,
    shop.name,
    product.image_url
  from public.products as product
  join public.categories as category on category.id = product.category_id
  join public.brands as brand on brand.id = product.brand_id
  join public.shops as shop on shop.id = product.shop_id
  order by product.created_at desc;
end;
$$;

revoke all on function public.list_products() from public;
grant execute on function public.list_products() to authenticated;

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
    where product.id = product_id
  );
end;
$$;

revoke all on function public.get_product(uuid) from public;
grant execute on function public.get_product(uuid) to authenticated;

create or replace function public.save_product(
  product_id uuid,
  product_name text,
  product_description text,
  product_sku text,
  product_price numeric,
  product_cost numeric,
  product_stock integer,
  product_category_id text,
  product_brand_id text,
  product_shop_id text,
  product_image_url text
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

  if trim(product_name) = '' or trim(product_sku) = '' then
    raise exception 'Product name and SKU are required';
  end if;

  insert into public.products (
    id, name, description, sku, price, cost, stock, category_id, brand_id, shop_id, image_url, updated_at
  )
  values (
    coalesce(product_id, gen_random_uuid()),
    trim(product_name),
    nullif(trim(product_description), ''),
    upper(trim(product_sku)),
    product_price,
    product_cost,
    product_stock,
    product_category_id,
    product_brand_id,
    product_shop_id,
    nullif(trim(product_image_url), ''),
    now()
  )
  on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      sku = excluded.sku,
      price = excluded.price,
      cost = excluded.cost,
      stock = excluded.stock,
      category_id = excluded.category_id,
      brand_id = excluded.brand_id,
      shop_id = excluded.shop_id,
      image_url = excluded.image_url,
      updated_at = now()
  returning id into saved_id;

  return saved_id;
end;
$$;

revoke all on function public.save_product(uuid, text, text, text, numeric, numeric, integer, text, text, text, text) from public;
grant execute on function public.save_product(uuid, text, text, text, numeric, numeric, integer, text, text, text, text) to authenticated;

create or replace function public.delete_product(product_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not (select public.can_manage_products()) then
    raise exception 'You do not have permission to delete products';
  end if;

  delete from public.products where id = product_id;
end;
$$;

revoke all on function public.delete_product(uuid) from public;
grant execute on function public.delete_product(uuid) to authenticated;

notify pgrst, 'reload schema';
