// Franschhoek Local — venue ratings & reviews from Google Places.
//
// For every venue in Supabase, fetches the real Google rating, total review
// count and up to 5 review snippets, then writes them back to the venues table.
// Run `supabase/ratings.sql` once first to add the columns.
//
// Run:        npm run ratings          (loads .env, uses the system CA store)
// Schedule:   run at least monthly (Google asks cached review content not
//             exceed ~30 days).
//
// Env required:
//   SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SECRET_KEY (service-role key)
//   GOOGLE_MAPS_API_KEY  — a Google Maps Platform key with the *Places API (New)*
//                          enabled and billing on. The free monthly tier covers
//                          a small directory like this comfortably.
//
// Real data only: if a venue can't be matched on Google, it's left without a
// rating rather than guessed.

import { createClient } from "@supabase/supabase-js";

const RAW_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_URL = RAW_URL && !/^https?:\/\//i.test(RAW_URL) ? `https://${RAW_URL}` : RAW_URL;
const SERVICE_KEY = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const GOOGLE_KEY = (process.env.GOOGLE_MAPS_API_KEY || "").trim();

// Bias the search to the village so we match the right business.
const LOCATION_HINT = "Franschhoek, Western Cape, South Africa";
const MAX_REVIEWS = 5;
const POLITE_DELAY_MS = 300;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    `✗ Missing Supabase env — URL set: ${Boolean(SUPABASE_URL)}, SECRET key set: ${Boolean(SERVICE_KEY)}.`,
  );
  process.exit(1);
}
if (!GOOGLE_KEY) {
  console.error(
    "✗ Missing GOOGLE_MAPS_API_KEY. Create a key in Google Cloud → enable 'Places API (New)' → add it to .env.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Normalize one Places API (New) review object to our stored shape. */
function mapReview(r) {
  return {
    author: r.authorAttribution?.displayName || "Google user",
    rating: typeof r.rating === "number" ? r.rating : 0,
    text: (r.text?.text || r.originalText?.text || "").trim(),
    relativeTime: r.relativePublishTimeDescription || "",
    profilePhoto: r.authorAttribution?.photoUri || undefined,
    uri: r.authorAttribution?.uri || r.googleMapsUri || undefined,
  };
}

const DETAIL_FIELDS = "id,displayName,formattedAddress,rating,userRatingCount,reviews";

/** Look up a place id by name (Text Search). Returns the first match's id. */
async function findPlaceId(name) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({ textQuery: `${name}, ${LOCATION_HINT}`, maxResultCount: 1 }),
  });
  if (!res.ok) throw new Error(`searchText ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  return json.places?.[0]?.id || null;
}

/** Fetch rating, review count and reviews for a known place id (Place Details). */
async function fetchDetails(placeId) {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: { "X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": DETAIL_FIELDS },
  });
  if (!res.ok) throw new Error(`details ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function run() {
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, google_place_id")
    .order("name");
  if (error) {
    console.error("✗ Couldn't read venues:", error.message);
    process.exit(1);
  }

  console.log(`Fetching Google ratings for ${data.length} venues…\n`);
  let updated = 0;
  let unmatched = 0;

  for (const v of data) {
    try {
      let placeId = v.google_place_id;
      if (!placeId) {
        placeId = await findPlaceId(v.name);
        await sleep(POLITE_DELAY_MS);
      }
      if (!placeId) {
        console.log(`  – ${v.name}: no Google match`);
        unmatched++;
        continue;
      }

      const d = await fetchDetails(placeId);
      const reviews = (d.reviews || []).slice(0, MAX_REVIEWS).map(mapReview);
      const patch = {
        google_place_id: d.id || placeId,
        rating: typeof d.rating === "number" ? d.rating : null,
        rating_count: typeof d.userRatingCount === "number" ? d.userRatingCount : null,
        reviews: reviews.length ? reviews : null,
        rating_updated_at: new Date().toISOString(),
      };

      const { error: upErr } = await supabase.from("venues").update(patch).eq("id", v.id);
      if (upErr) throw new Error(upErr.message);

      console.log(
        `  ✓ ${v.name}: ${patch.rating ?? "—"}★ (${patch.rating_count ?? 0} reviews, ${reviews.length} shown)`,
      );
      updated++;
      await sleep(POLITE_DELAY_MS);
    } catch (e) {
      console.log(`  ✗ ${v.name}: ${e.message}`);
    }
  }

  console.log(`\nDone. Updated ${updated} venues, ${unmatched} unmatched.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
