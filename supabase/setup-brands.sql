create or replace function public.list_brands()
returns table (
  id text,
  name text,
  product_count bigint
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to view brands';
  end if;

  return query
  select
    brand.id,
    brand.name,
    count(product.id)
  from public.brands as brand
  left join public.products as product on product.brand_id = brand.id
  group by brand.id, brand.name
  order by brand.name;
end;
$$;

revoke all on function public.list_brands() from public;
grant execute on function public.list_brands() to authenticated;

create or replace function public.save_brand(
  target_brand_id text,
  brand_name text
)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  saved_id text;
begin
  if not (select public.can_manage_products()) then
    raise exception 'You do not have permission to save brands';
  end if;

  if trim(brand_name) = '' then
    raise exception 'Brand name is required';
  end if;

  if target_brand_id is null then
    saved_id := trim(both '-' from regexp_replace(lower(trim(brand_name)), '[^a-z0-9]+', '-', 'g'));

    if saved_id = '' then
      raise exception 'Brand name must contain letters or numbers';
    end if;

    insert into public.brands (id, name)
    values (saved_id, trim(brand_name));
  else
    update public.brands
    set name = trim(brand_name)
    where id = target_brand_id
    returning id into saved_id;

    if saved_id is null then
      raise exception 'Brand not found';
    end if;
  end if;

  return saved_id;
exception
  when unique_violation then
    raise exception 'A brand with this name already exists';
end;
$$;

revoke all on function public.save_brand(text, text) from public;
grant execute on function public.save_brand(text, text) to authenticated;

create or replace function public.delete_brand(target_brand_id text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not (select public.can_manage_products()) then
    raise exception 'You do not have permission to delete brands';
  end if;

  if exists (
    select 1
    from public.products
    where brand_id = target_brand_id
  ) then
    raise exception 'Move or delete products for this brand before deleting it';
  end if;

  delete from public.brands
  where id = target_brand_id;
end;
$$;

revoke all on function public.delete_brand(text) from public;
grant execute on function public.delete_brand(text) to authenticated;

notify pgrst, 'reload schema';
