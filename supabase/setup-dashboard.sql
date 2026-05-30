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
      'inventory_updates', (select count(*) from public.inventory_movements)
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

notify pgrst, 'reload schema';
