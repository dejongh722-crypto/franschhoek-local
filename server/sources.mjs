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
  // ── Events (calendars / listing pages) ─────────────────────────────
  { url: "https://www.franschhoek.org.za/events/", category: "wineries", kinds: ["event"] },

  // ── Wineries ───────────────────────────────────────────────────────
  { url: "https://www.franschhoek.org.za/wine/", category: "wineries", kinds: ["venue", "event", "deal"] },

  // ── Restaurants ────────────────────────────────────────────────────
  { url: "https://www.franschhoek.org.za/restaurants/", category: "restaurants", kinds: ["venue", "deal"] },

  // ── Coffee ─────────────────────────────────────────────────────────
  // { url: "https://example-coffee-directory/franschhoek", category: "coffee", kinds: ["venue"] },

  // ── Hotels / stays ─────────────────────────────────────────────────
  { url: "https://www.franschhoek.org.za/accommodation/", category: "hotels", kinds: ["venue", "deal"] },

  // ── Art ────────────────────────────────────────────────────────────
  { url: "https://www.franschhoek.org.za/art-galleries/", category: "art", kinds: ["venue", "event"] },

  // ── Adventure ──────────────────────────────────────────────────────
  { url: "https://www.franschhoek.org.za/things-to-do/", category: "adventure", kinds: ["venue", "event"] },

  // ── Padel ──────────────────────────────────────────────────────────
  // { url: "https://example-padel-club/franschhoek", category: "padel", kinds: ["venue", "event"] },
];

/**
 * Maximum items the scraper will keep per source per run (safety cap, avoids
 * flooding the DB if a page lists hundreds of links).
 */
export const MAX_ITEMS_PER_SOURCE = 25;
