-- Franschhoek Local — database schema (Phase 1: profiles + auth)
-- Run this in the Supabase dashboard → SQL Editor → New query → Run.

-- ───────────────────────────── profiles ─────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  tier        text not null default 'free' check (tier in ('free', 'premium')),
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Any signed-in user can read the member directory (for community / "see real users").
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select
  using (auth.role() = 'authenticated');

-- Users can create and edit only their own profile row.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update
  using (auth.uid() = id);

-- ──────────────── auto-create a profile on sign-up ───────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────── admin helper (used by RLS below) ───────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ───────────────────────────── promotions ───────────────────────────
create table if not exists public.promotions (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  audience    text not null default 'all' check (audience in ('all', 'free', 'premium')),
  active      boolean not null default true,
  cta_label   text,
  cta_link    text,
  image       text,
  starts_at   date,
  ends_at     date,
  created_at  timestamptz not null default now()
);

alter table public.promotions enable row level security;

drop policy if exists "promotions_select_all" on public.promotions;
create policy "promotions_select_all" on public.promotions for select using (true);

drop policy if exists "promotions_admin_write" on public.promotions;
create policy "promotions_admin_write" on public.promotions
  for all using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── community messages ───────────────────────
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  room        text not null,                               -- 'general' or an event id
  author_id   uuid references auth.users (id) on delete cascade,
  author_name text,
  body        text not null,
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;

drop policy if exists "messages_select_authenticated" on public.messages;
create policy "messages_select_authenticated" on public.messages
  for select using (auth.role() = 'authenticated');

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own" on public.messages
  for insert with check (auth.uid() = author_id);

-- ───────────────────────── subscriptions (Yoco) ─────────────────────
create table if not exists public.subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users (id) on delete cascade,
  plan                text,
  status              text not null default 'active',
  provider            text not null default 'yoco',
  checkout_id         text,
  payment_id          text,
  event_id            text,                                  -- webhook event id (dedupe key)
  current_period_end  timestamptz,
  created_at          timestamptz not null default now()
);

-- Backfill columns on existing installs.
alter table public.subscriptions add column if not exists payment_id text;
alter table public.subscriptions add column if not exists event_id text;
-- Dedupe webhook retries: one row per Yoco event.
create unique index if not exists subscriptions_event_id_key on public.subscriptions (event_id);

alter table public.subscriptions enable row level security;

-- Users can read their own subscription; the webhook writes via the service role (bypasses RLS).
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ───────────────────────────── events ───────────────────────────────
create table if not exists public.events (
  id            text primary key,
  title         text not null,
  venue         text,
  category_slug text,
  date          text,                                      -- ISO datetime string
  image         text,
  is_premium    boolean not null default false,
  price         text,
  has_chat      boolean not null default false,
  description   text,
  created_at    timestamptz not null default now()
);

alter table public.events enable row level security;

drop policy if exists "events_select_all" on public.events;
create policy "events_select_all" on public.events for select using (true);

drop policy if exists "events_admin_write" on public.events;
create policy "events_admin_write" on public.events
  for all using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────────── deals ────────────────────────────────
create table if not exists public.deals (
  id            text primary key,
  title         text not null,
  venue         text,
  category_slug text,
  discount      text,
  description   text,
  code          text,
  valid_until   text,                                      -- ISO date string
  image         text,
  created_at    timestamptz not null default now()
);

alter table public.deals enable row level security;

drop policy if exists "deals_select_all" on public.deals;
create policy "deals_select_all" on public.deals for select using (true);

drop policy if exists "deals_admin_write" on public.deals;
create policy "deals_admin_write" on public.deals
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed the sample events & deals (idempotent — keeps existing rows untouched).
insert into public.events (id, title, venue, category_slug, date, image, is_premium, price, has_chat, description) values
  ('sunset-wine-tasting','Sunset Wine Tasting','Boschendal Estate','wineries','2026-06-06T18:00:00','https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=70',false,'R250',true,'Sip your way through a curated flight of estate wines as the sun dips behind the Drakenstein mountains. A sommelier guides you through five vintages paired with artisanal bites.'),
  ('harvest-long-table','Harvest Long-Table Lunch','La Petite Ferme','restaurants','2026-06-08T12:30:00','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=70',false,'R495',true,'A leisurely four-course long-table feast celebrating the season''s harvest, with dishes built around produce from the valley and wines poured to match each course.'),
  ('live-jazz-tapas','Live Jazz & Tapas','Leopard''s Leap','art','2026-06-12T19:00:00','https://images.unsplash.com/photo-1531913764164-f85c52e6e654?auto=format&fit=crop&w=800&q=70',true,'R180',true,'An intimate evening of live jazz from local musicians, paired with a sharing menu of Mediterranean-inspired tapas. Premium members only — limited seating.'),
  ('cellar-barrel-tasting','Cellar Tour & Barrel Tasting','Haute Cabrière','wineries','2026-06-13T11:00:00','https://images.unsplash.com/photo-1533777324565-a040eb52facd?auto=format&fit=crop&w=800&q=70',true,'R320',true,'Go behind the scenes with the winemaker for a tour of the historic cellar, tasting straight from the barrel and learning the craft of méthode cap classique.'),
  ('mountain-trail-morning','Mountain Trail Morning','Mont Rochelle Reserve','adventure','2026-06-14T07:30:00','https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=70',false,'Free',false,'A guided sunrise hike along the Mont Rochelle ridge with sweeping views over the valley. Suitable for moderate fitness levels. Bring water and good shoes.'),
  ('padel-social-doubles','Social Doubles Padel Night','Franschhoek Padel Club','padel','2026-06-10T17:30:00','https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=70',false,'R120',false,'A relaxed mixed-doubles padel social for all levels. Rackets and balls provided, rotating partners every few games, with drinks at the clubhouse afterwards.'),
  ('slow-coffee-workshop','Slow Coffee Workshop','Terbodore Roastery','coffee','2026-06-07T09:00:00','https://images.unsplash.com/photo-1470158499416-75be9aa0c4db?auto=format&fit=crop&w=800&q=70',false,'R150',false,'Master the pour-over and learn to taste like a pro in this hands-on workshop with Terbodore''s head roaster. Includes a bag of single-origin beans to take home.')
on conflict (id) do nothing;

insert into public.deals (id, title, venue, category_slug, discount, description, code, valid_until, image) values
  ('boschendal-tasting-20','20% off wine tasting flights','Boschendal Estate','wineries','20% OFF','Enjoy 20% off any tasting flight at the estate, Monday to Friday. Includes the premium and reserve selections.','BOSCH20','2026-06-30','https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=70'),
  ('petite-ferme-2for1','2-for-1 main courses','La Petite Ferme','restaurants','2-FOR-1','Buy one main course and get the second free, available Tuesday to Thursday for lunch. Excludes set menus.','DINE241','2026-07-15','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=70'),
  ('terbodore-free-pastry','Free pastry with any coffee','Terbodore Roastery','coffee','FREE PASTRY','Get a complimentary fresh-baked pastry with any specialty coffee, all day, every day.','BREWTREAT','2026-06-20','https://images.unsplash.com/photo-1470158499416-75be9aa0c4db?auto=format&fit=crop&w=800&q=70'),
  ('spa-30-off','30% off spa treatments','Le Franschhoek Hotel & Spa','hotels','30% OFF','Save 30% on all signature spa treatments booked before noon. The perfect wine-country wind-down.','SPA30','2026-08-01','https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=70'),
  ('padel-half-price','Half-price off-peak court hire','Franschhoek Padel Club','padel','50% OFF','Book any off-peak court (before 4pm on weekdays) at half price. Racket hire included.','PADEL50','2026-07-01','https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=70'),
  ('leopards-leap-prints','Buy 2 get 1 free gallery prints','Leopard''s Leap Gallery','art','3-FOR-2','Purchase any two limited-edition local artist prints and receive a third of equal value free.','ART3FOR2','2026-06-25','https://images.unsplash.com/photo-1531913764164-f85c52e6e654?auto=format&fit=crop&w=800&q=70')
on conflict (id) do nothing;

-- ───────────────── scraper provenance on events & deals ─────────────
alter table public.events add column if not exists source text;
alter table public.events add column if not exists source_url text;
alter table public.events add column if not exists updated_at timestamptz;
alter table public.deals  add column if not exists source text;
alter table public.deals  add column if not exists source_url text;
alter table public.deals  add column if not exists updated_at timestamptz;

-- ───────────────────────────── venues ───────────────────────────────
-- Real local spots (wineries, restaurants, coffee, hotels, art, adventure, padel).
create table if not exists public.venues (
  id            text primary key,
  name          text not null,
  category_slug text,
  description   text,
  address       text,
  image         text,
  website       text,
  phone         text,
  source        text,
  source_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

alter table public.venues enable row level security;
drop policy if exists "venues_select_all" on public.venues;
create policy "venues_select_all" on public.venues for select using (true);
drop policy if exists "venues_admin_write" on public.venues;
create policy "venues_admin_write" on public.venues
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────── community groups (public links) ────────────
-- Public WhatsApp/community group invite links (NOT chat scraping — just the
-- openly-published chat.whatsapp.com/… invites). Admin-managed + scraper-found.
create table if not exists public.community_groups (
  id            text primary key,
  name          text not null,
  category_slug text,
  description   text,
  invite_url    text not null,
  source        text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table public.community_groups enable row level security;
drop policy if exists "community_groups_select_all" on public.community_groups;
create policy "community_groups_select_all" on public.community_groups for select using (true);
drop policy if exists "community_groups_admin_write" on public.community_groups;
create policy "community_groups_admin_write" on public.community_groups
  for all using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── scrape run log ───────────────────────────
create table if not exists public.scrape_runs (
  id               uuid primary key default gen_random_uuid(),
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  ok               boolean,
  sources          int default 0,
  venues_upserted  int default 0,
  events_upserted  int default 0,
  deals_upserted   int default 0,
  groups_upserted  int default 0,
  errors           text
);

alter table public.scrape_runs enable row level security;
drop policy if exists "scrape_runs_select_admin" on public.scrape_runs;
create policy "scrape_runs_select_admin" on public.scrape_runs
  for select using (public.is_admin());
-- (The scraper writes with the service-role key, which bypasses RLS.)

-- ──────────────── promotion analytics (clicks + signups) ────────────
-- One row per tracked interaction. Anyone (even anonymous) may log an event;
-- only admins can read the aggregated metrics.
create table if not exists public.promotion_events (
  id          uuid primary key default gen_random_uuid(),
  promo_id    text not null,                               -- promotions.id (uuid) or local seed id
  type        text not null check (type in ('click', 'signup')),
  session_id  text,                                        -- anonymous client id (attribution)
  user_id     uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists promotion_events_promo_idx on public.promotion_events (promo_id);

alter table public.promotion_events enable row level security;

-- Log events from anyone (the click happens before a user may exist).
drop policy if exists "promotion_events_insert_any" on public.promotion_events;
create policy "promotion_events_insert_any" on public.promotion_events
  for insert with check (true);

-- Only admins read the performance numbers.
drop policy if exists "promotion_events_select_admin" on public.promotion_events;
create policy "promotion_events_select_admin" on public.promotion_events
  for select using (public.is_admin());

-- Enable Realtime broadcasts for chat + promotions (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'promotions'
  ) then
    alter publication supabase_realtime add table public.promotions;
  end if;
end $$;

-- Seed one promotion so the in-app pop-up has something to show.
insert into public.promotions (title, body, audience, active, cta_label, cta_link, image)
select
  'Winter Wine Special 🍷',
  '20% off tastings at participating wineries this month. Tap to explore the latest local deals.',
  'all', true, 'View deals', '/deals',
  'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=70'
where not exists (select 1 from public.promotions);

-- ───────────────────────────── notes ────────────────────────────────
-- 1. For quick testing, disable email confirmation under
--    Authentication → Sign In / Providers → Email → "Confirm email" (off).
-- 2. Make yourself an admin (so you can manage promotions):
--    update public.profiles set is_admin = true where email = 'you@example.com';
