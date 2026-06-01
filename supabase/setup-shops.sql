create table if not exists public.shops (
  id text primary key,
  name text not null,
  location text,
  phone text,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.shops (id, name, location, phone)
values
  ('shop-1', 'Shop 1 - Downtown', '123 Tech Street, Downtown', '+1-234-567-8900'),
  ('shop-2', 'Shop 2 - Midtown', '456 Digital Avenue, Midtown', '+1-234-567-8901')
on conflict (id) do nothing;

alter table public.profiles drop constraint if exists profiles_shop_check;
alter table public.profiles drop constraint if exists profiles_shop_fkey;
alter table public.profiles
  add constraint profiles_shop_fkey
  foreign key (shop) references public.shops(id);

alter table public.shops enable row level security;

create or replace function public.list_shops()
returns table (
  id text,
  name text,
  location text,
  phone text,
  is_open boolean,
  staff_count bigint
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to view shops';
  end if;

  return query
  select
    shop.id,
    shop.name,
    shop.location,
    shop.phone,
    shop.is_open,
    count(profile.id) filter (where profile.approved = true) as staff_count
  from public.shops as shop
  left join public.profiles as profile on profile.shop = shop.id
  group by shop.id, shop.name, shop.location, shop.phone, shop.is_open, shop.created_at
  order by shop.created_at;
end;
$$;

revoke all on function public.list_shops() from public;
grant execute on function public.list_shops() to authenticated;

create or replace function public.save_shop(
  shop_id text,
  shop_name text,
  shop_location text,
  shop_phone text,
  shop_is_open boolean
)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not (select public.is_super_admin()) then
    raise exception 'Only a super admin can save shops';
  end if;

  if shop_id !~ '^shop-[a-z0-9-]+$' then
    raise exception 'Shop ID must start with shop- and contain only lowercase letters, numbers, and hyphens';
  end if;

  if trim(shop_name) = '' then
    raise exception 'Shop name is required';
  end if;

  insert into public.shops (id, name, location, phone, is_open)
  values (shop_id, shop_name, nullif(shop_location, ''), nullif(shop_phone, ''), shop_is_open)
  on conflict (id) do update
  set name = excluded.name,
      location = excluded.location,
      phone = excluded.phone,
      is_open = excluded.is_open;
end;
$$;

revoke all on function public.save_shop(text, text, text, text, boolean) from public;
grant execute on function public.save_shop(text, text, text, text, boolean) to authenticated;

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

create or replace function public.delete_shop(shop_id text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not (select public.is_super_admin()) then
    raise exception 'Only a super admin can delete shops';
  end if;

  if exists (select 1 from public.profiles where shop = shop_id) then
    raise exception 'Move assigned users to another shop before deleting this shop';
  end if;

  delete from public.shops where id = shop_id;
end;
$$;

revoke all on function public.delete_shop(text) from public;
grant execute on function public.delete_shop(text) to authenticated;

notify pgrst, 'reload schema';
