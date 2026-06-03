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
  // ── Wineries ───────────────────────────────────────────────────────
  // Asking for venue+event+deal means the AI fallback also pulls any events /
  // specials mentioned on the page, not just the venue listings.
  { url: "https://www.franschhoek.org.za/wineries/", category: "wineries", kinds: ["venue", "event", "deal"] },

  // ── Restaurants ────────────────────────────────────────────────────
  { url: "https://www.franschhoek.org.za/restaurants/", category: "restaurants", kinds: ["venue", "event", "deal"] },

  // ── Hotels / stays ─────────────────────────────────────────────────
  // The org.za /accommodation/ index renders its listings via JS, so individual
  // property sites (which carry real text / schema.org) are added directly.
  { url: "https://www.franschhoek.org.za/accommodation/", category: "hotels", kinds: ["venue", "deal"] },
  { url: "https://fch.co.za/", category: "hotels", kinds: ["venue", "deal"] },
  { url: "https://dreamresorts.co.za/hotels-resorts/le-franschhoek-hotel-spa/explore/", category: "hotels", kinds: ["venue", "deal"] },

  // ── Events (dedicated calendar/listing page) ───────────────────────
  { url: "https://www.franschhoek.org.za/events/", category: "wineries", kinds: ["event"] },

  // ── Adventure / things to do ───────────────────────────────────────
  { url: "https://www.franschhoek.org.za/things-to-do/", category: "adventure", kinds: ["venue", "event"] },

  // ── Art ────────────────────────────────────────────────────────────
  { url: "https://www.franschhoek.org.za/art/", category: "art", kinds: ["venue", "event"] },

  // ── Coffee ─────────────────────────────────────────────────────────
  { url: "https://www.terbodore.com/", category: "coffee", kinds: ["venue"] },

  // ── Padel ──────────────────────────────────────────────────────────
  // No reliable Franschhoek padel site yet — add a club's page here when one exists.
  // Until then, padel venues are added manually via the Admin panel.
  // { url: "https://<padel-club>/franschhoek", category: "padel", kinds: ["venue", "event"] },
];

/**
 * Maximum items the scraper will keep per source per run (safety cap, avoids
 * flooding the DB if a page lists hundreds of links).
 */
export const MAX_ITEMS_PER_SOURCE = 25;
