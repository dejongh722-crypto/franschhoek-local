-- Storage policies for the public 'media' bucket.
-- Run once in the Supabase SQL editor (the bucket itself is already created).
-- Public can read images; only admins (profiles.is_admin) can upload / replace / delete.

create policy "media public read"
  on storage.objects for select
  using ( bucket_id = 'media' );

create policy "media admin insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "media admin update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'media'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "media admin delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'media'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );
