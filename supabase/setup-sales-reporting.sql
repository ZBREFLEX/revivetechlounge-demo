alter table public.inventory_movements add column if not exists customer_name text;
alter table public.inventory_movements add column if not exists customer_phone text;
alter table public.inventory_movements add column if not exists customer_note text;

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
    and (select public.can_access_shop(product.shop_id))
  order by movement.created_at desc;
end;
$$;

revoke all on function public.list_customer_sales() from public;
grant execute on function public.list_customer_sales() to authenticated;

create or replace function public.get_dashboard_summary()
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to view the dashboard';
  end if;

  return jsonb_build_object(
    'stats', jsonb_build_object(
      'total_products', (select count(*) from public.products),
      'total_inventory', (select coalesce(sum(stock), 0) from public.products),
      'low_stock_alerts', (select count(*) from public.products where stock < (select public.get_low_stock_threshold())),
      'categories', (select count(*) from public.categories),
      'brands', (select count(*) from public.brands),
      'approved_staff', (select count(*) from public.profiles where approved = true and role <> 'super-admin'),
      'open_shops', (select count(*) from public.shops where is_open = true),
      'pending_approvals', (select count(*) from public.profiles where approved = false),
      'inventory_updates', (select count(*) from public.inventory_movements),
      'total_sales', (select count(*) from public.inventory_movements where customer_name is not null)
    ),
    'category_data', (
      select coalesce(jsonb_agg(category_summary order by category_summary.name), '[]'::jsonb)
      from (
        select category.name, count(product.id) as count
        from public.categories as category
        left join public.products as product on product.category_id = category.id
        group by category.id, category.name
      ) as category_summary
    ),
    'sales_data', (
      select coalesce(jsonb_agg(sale_day order by sale_day.sales_date), '[]'::jsonb)
      from (
        select
          to_char(day.series_date, 'DD Mon') as date,
          day.series_date as sales_date,
          count(movement.id) as sales
        from generate_series(current_date - 6, current_date, interval '1 day') as day(series_date)
        left join public.inventory_movements as movement
          on movement.created_at::date = day.series_date::date
          and movement.customer_name is not null
        group by day.series_date
      ) as sale_day
    ),
    'low_stock_products', (
      select coalesce(jsonb_agg(low_stock order by low_stock.stock, low_stock.name), '[]'::jsonb)
      from (
        select product.id, product.name, product.sku, product.stock, shop.name as shop_name
        from public.products as product
        join public.shops as shop on shop.id = product.shop_id
        where product.stock < (select public.get_low_stock_threshold())
        order by product.stock, product.name
        limit 10
      ) as low_stock
    ),
    'recent_movements', (
      select coalesce(jsonb_agg(recent_movement order by recent_movement.created_at desc), '[]'::jsonb)
      from (
        select
          movement.id,
          product.name as product_name,
          movement.quantity_change,
          movement.stock_after,
          coalesce(profile.full_name, profile.email) as updated_by,
          movement.created_at
        from public.inventory_movements as movement
        join public.products as product on product.id = movement.product_id
        left join public.profiles as profile on profile.id = movement.created_by
        order by movement.created_at desc
        limit 10
      ) as recent_movement
    )
  );
end;
$$;

revoke all on function public.get_dashboard_summary() from public;
grant execute on function public.get_dashboard_summary() to authenticated;

create or replace function public.get_sales_chart(sales_period text default 'days')
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to view the sales chart';
  end if;

  if sales_period = 'days' then
    return (
      select coalesce(jsonb_agg(sale_period order by sale_period.period_start), '[]'::jsonb)
      from (
        select
          to_char(day.series_date, 'DD Mon') as date,
          day.series_date as period_start,
          count(movement.id) as sales
        from generate_series(current_date - 6, current_date, interval '1 day') as day(series_date)
        left join public.inventory_movements as movement
          on movement.created_at::date = day.series_date::date
          and movement.customer_name is not null
        group by day.series_date
      ) as sale_period
    );
  end if;

  if sales_period = 'months' then
    return (
      select coalesce(jsonb_agg(sale_period order by sale_period.period_start), '[]'::jsonb)
      from (
        select
          to_char(month.series_date, 'Mon YYYY') as date,
          month.series_date as period_start,
          count(movement.id) as sales
        from generate_series(
          date_trunc('month', current_date) - interval '11 months',
          date_trunc('month', current_date),
          interval '1 month'
        ) as month(series_date)
        left join public.inventory_movements as movement
          on date_trunc('month', movement.created_at) = month.series_date
          and movement.customer_name is not null
        group by month.series_date
      ) as sale_period
    );
  end if;

  if sales_period = 'years' then
    return (
      select coalesce(jsonb_agg(sale_period order by sale_period.period_start), '[]'::jsonb)
      from (
        select
          to_char(year.series_date, 'YYYY') as date,
          year.series_date as period_start,
          count(movement.id) as sales
        from generate_series(
          date_trunc('year', current_date) - interval '4 years',
          date_trunc('year', current_date),
          interval '1 year'
        ) as year(series_date)
        left join public.inventory_movements as movement
          on date_trunc('year', movement.created_at) = year.series_date
          and movement.customer_name is not null
        group by year.series_date
      ) as sale_period
    );
  end if;

  raise exception 'Choose days, months, or years for the sales chart';
end;
$$;

revoke all on function public.get_sales_chart(text) from public;
grant execute on function public.get_sales_chart(text) to authenticated;

notify pgrst, 'reload schema';
