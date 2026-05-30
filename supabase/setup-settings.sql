create table if not exists public.store_settings (
  id boolean primary key default true check (id = true),
  store_name text not null,
  store_description text,
  currency text not null check (currency in ('USD', 'EUR', 'GBP', 'INR')),
  low_stock_threshold integer not null check (low_stock_threshold > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.store_settings (
  id,
  store_name,
  store_description,
  currency,
  low_stock_threshold
)
values (
  true,
  'StoreAdmin',
  'Your trusted destination for mobile phones and custom PC builds',
  'INR',
  5
)
on conflict (id) do nothing;

alter table public.store_settings enable row level security;

create or replace function public.get_low_stock_threshold()
returns integer
language sql
stable
security definer set search_path = ''
as $$
  select low_stock_threshold
  from public.store_settings
  where id = true;
$$;

revoke all on function public.get_low_stock_threshold() from public;
grant execute on function public.get_low_stock_threshold() to authenticated;

create or replace function public.get_store_settings()
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to view settings';
  end if;

  return (
    select to_jsonb(settings) - 'id' - 'updated_by'
    from public.store_settings as settings
    where settings.id = true
  );
end;
$$;

revoke all on function public.get_store_settings() from public;
grant execute on function public.get_store_settings() to authenticated;

create or replace function public.save_store_settings(
  new_store_name text,
  new_store_description text,
  new_currency text,
  new_low_stock_threshold integer
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
begin
  if not (select public.is_super_admin()) then
    raise exception 'Only a super admin can change store settings';
  end if;

  if trim(new_store_name) = '' then
    raise exception 'Store name is required';
  end if;

  if new_currency not in ('USD', 'EUR', 'GBP', 'INR') then
    raise exception 'Select a supported currency';
  end if;

  if new_low_stock_threshold is null or new_low_stock_threshold < 1 then
    raise exception 'Low stock threshold must be greater than zero';
  end if;

  update public.store_settings
  set store_name = trim(new_store_name),
      store_description = nullif(trim(new_store_description), ''),
      currency = new_currency,
      low_stock_threshold = new_low_stock_threshold,
      updated_at = now(),
      updated_by = (select auth.uid())
  where id = true;

  return (select public.get_store_settings());
end;
$$;

revoke all on function public.save_store_settings(text, text, text, integer) from public;
grant execute on function public.save_store_settings(text, text, text, integer) to authenticated;

notify pgrst, 'reload schema';
