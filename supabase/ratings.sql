-- Franschhoek Local — venue ratings & reviews (Google Places)
-- Adds real rating data to venues. Populated by `npm run ratings`
-- (server/ratings.mjs), which calls the Google Places API with the
-- service-role key. Run this once in the Supabase SQL Editor.

alter table public.venues add column if not exists google_place_id   text;
alter table public.venues add column if not exists rating            numeric(2,1);   -- 1.0–5.0
alter table public.venues add column if not exists rating_count      integer;        -- total Google reviews
alter table public.venues add column if not exists reviews           jsonb;          -- [{author,rating,text,relativeTime,profilePhoto,uri}]
alter table public.venues add column if not exists rating_updated_at timestamptz;

-- Place IDs may be cached indefinitely per Google's terms; rating/reviews
-- are refreshed each run (Google asks that cached review content not exceed
-- ~30 days, so schedule `npm run ratings` at least monthly).
