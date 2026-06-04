-- Franschhoek Local — suppressed (admin-deleted) content.
-- When an admin deletes a scraped item, its id is recorded here so the scraper
-- never re-adds it on the next run. Covers every content kind. Run once in the
-- Supabase SQL editor.

create table if not exists public.suppressed_content (
  id          text not null,                  -- the deleted row's id
  kind        text not null check (kind in ('deal', 'event', 'venue', 'group')),
  created_at  timestamptz not null default now(),
  primary key (id, kind)
);

alter table public.suppressed_content enable row level security;

-- Anyone may read the list (harmless; the scraper uses the service role anyway).
drop policy if exists "suppressed_select_all" on public.suppressed_content;
create policy "suppressed_select_all" on public.suppressed_content for select using (true);

-- Only admins can add/remove suppressions.
drop policy if exists "suppressed_admin_write" on public.suppressed_content;
create policy "suppressed_admin_write" on public.suppressed_content
  for all using (public.is_admin()) with check (public.is_admin());
