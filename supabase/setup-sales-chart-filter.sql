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
