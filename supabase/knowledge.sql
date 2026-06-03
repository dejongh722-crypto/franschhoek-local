-- Local Knowledge posts (admin-managed). Run once in the Supabase SQL editor.
create table if not exists public.knowledge_posts (
  id            text primary key,
  title         text not null,
  excerpt       text,
  category_slug text,
  author        text,
  published_at  text,
  read_minutes  int  default 4,
  image         text,
  body          text[] default '{}',
  tips          text[] default '{}',
  created_at    timestamptz default now()
);

alter table public.knowledge_posts enable row level security;

-- Public can read; only admins (profiles.is_admin) can write.
create policy "knowledge public read" on public.knowledge_posts for select using (true);
create policy "knowledge admin write" on public.knowledge_posts for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Realtime updates.
alter publication supabase_realtime add table public.knowledge_posts;
