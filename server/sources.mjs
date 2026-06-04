// Scraper source registry.
//
// Each entry is a publicly reachable page the scraper reads to find real venues,
// events and deals for that category. EDIT THIS LIST — add the pages you want and
// have the right to aggregate. Prefer official listing/directory pages and pages
// that publish schema.org structured data (most modern sites do).
//
// Notes:
//  - `category` is one of the app's category slugs:
//      wineries | restaurants | coffee | hotels | art | adventure | padel
//  - `kinds` tells the scraper what to look for on that page (any of: venue, event, deal).
//  - The scraper respects robots.txt and rate-limits itself. Only add sources you
//    are permitted to scrape (check each site's terms).
//
// The starter URLs below are well-known Franschhoek/winelands references included as
// EXAMPLES — verify each one loads and is permitted before relying on it, and expand
// the list with the specific pages you care about.

/** @typedef {{ url: string, category: string, kinds: ("venue"|"event"|"deal")[] }} Source */

/** @type {Source[]} */
export const SOURCES = [
  // Venues are curated and admin-managed (real photos + descriptions), so the
  // scraper never writes venues here. It focuses on EVENTS (festivals &
  // happenings, upcoming only) and DEALS (specials/offers) found on these pages.
  //
  // NOTE: Most real deals are pulled automatically from each curated venue's OWN
  // website (their "specials"/"offers" page) by the venue-deal scan in
  // scraper.mjs — you don't need to list those here. Add a page below only when
  // a directory/aggregator publishes offers you also want scanned.
  { url: "https://www.franschhoek.org.za/events/", category: "wineries", kinds: ["event", "deal"] },
  { url: "https://www.franschhoek.org.za/things-to-do/", category: "adventure", kinds: ["event", "deal"] },

  // EXAMPLE specials/deals source (verify it loads & you're permitted before relying on it):
  // { url: "https://www.franschhoek.org.za/specials/", category: "restaurants", kinds: ["deal"] },
];

/**
 * Maximum items the scraper will keep per source per run (safety cap, avoids
 * flooding the DB if a page lists hundreds of links).
 */
export const MAX_ITEMS_PER_SOURCE = 25;
