create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  role text not null default 'staff',
  shop text not null default 'shop-1' check (shop in ('shop-1', 'shop-2')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists approved boolean not null default false;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super-admin', 'admin', 'manager', 'staff'));

insert into public.profiles (id, email, full_name)
select
  auth_user.id,
  auth_user.email,
  auth_user.raw_user_meta_data ->> 'full_name'
from auth.users as auth_user
on conflict (id) do update
set email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);

alter table public.profiles enable row level security;

grant select on public.profiles to authenticated;

drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Super admins can view every profile" on public.profiles;

create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

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

create policy "Super admins can view every profile"
  on public.profiles for select
  to authenticated
  using ((select public.is_super_admin()));

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

notify pgrst, 'reload schema';
