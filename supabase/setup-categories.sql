create or replace function public.list_categories()
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
    raise exception 'You must be signed in to view categories';
  end if;

  return query
  select
    category.id,
    category.name,
    count(product.id)
  from public.categories as category
  left join public.products as product on product.category_id = category.id
  group by category.id, category.name
  order by category.name;
end;
$$;

revoke all on function public.list_categories() from public;
grant execute on function public.list_categories() to authenticated;

create or replace function public.save_category(
  target_category_id text,
  category_name text
)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  saved_id text;
begin
  if not (select public.can_manage_products()) then
    raise exception 'You do not have permission to save categories';
  end if;

  if trim(category_name) = '' then
    raise exception 'Category name is required';
  end if;

  if target_category_id is null then
    saved_id := trim(both '-' from regexp_replace(lower(trim(category_name)), '[^a-z0-9]+', '-', 'g'));

    if saved_id = '' then
      raise exception 'Category name must contain letters or numbers';
    end if;

    insert into public.categories (id, name)
    values (saved_id, trim(category_name));
  else
    update public.categories
    set name = trim(category_name)
    where id = target_category_id
    returning id into saved_id;

    if saved_id is null then
      raise exception 'Category not found';
    end if;
  end if;

  return saved_id;
exception
  when unique_violation then
    raise exception 'A category with this name already exists';
end;
$$;

revoke all on function public.save_category(text, text) from public;
grant execute on function public.save_category(text, text) to authenticated;

create or replace function public.delete_category(target_category_id text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not (select public.can_manage_products()) then
    raise exception 'You do not have permission to delete categories';
  end if;

  if exists (
    select 1
    from public.products
    where category_id = target_category_id
  ) then
    raise exception 'Move or delete products in this category before deleting it';
  end if;

  delete from public.categories
  where id = target_category_id;
end;
$$;

revoke all on function public.delete_category(text) from public;
grant execute on function public.delete_category(text) to authenticated;

notify pgrst, 'reload schema';
