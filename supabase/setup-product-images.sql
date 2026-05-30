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

notify pgrst, 'reload schema';
