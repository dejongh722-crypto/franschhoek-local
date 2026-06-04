// Franschhoek Local — content scraper.
//
// Reads the sources in ./sources.mjs, pulls real venues / events / deals (and any
// public WhatsApp community-group invite links), normalizes them and upserts them
// into Supabase. Auto-publishes: scraped rows go straight into the live tables.
//
// Deals also come from each curated venue's OWN website: scrapeVenueDeals() scans
// every venue's site for a specials/offers page and AI-extracts the offers that
// place is currently running (Claude is only called when a page looks offer-like).
//
// Run:        npm run scrape          (loads .env)
// Schedule:   .github/workflows/scrape.yml runs it every 4 hours.
//
// Env required:
//   SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SECRET_KEY (service-role key)
//   ANTHROPIC_API_KEY (optional — enables the Claude extraction fallback)
//
// It is polite: respects robots.txt, sets a descriptive User-Agent, rate-limits,
// and caps items per source. Only scrape sources you are permitted to aggregate.

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { SOURCES, MAX_ITEMS_PER_SOURCE } from "./sources.mjs";

const RAW_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
// Be forgiving: add the scheme if it was pasted without it.
const SUPABASE_URL = RAW_URL && !/^https?:\/\//i.test(RAW_URL) ? `https://${RAW_URL}` : RAW_URL;
const SERVICE_KEY = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const ANTHROPIC_API_KEY = (process.env.ANTHROPIC_API_KEY || "").trim();
const MODEL = process.env.SCRAPER_MODEL || "claude-haiku-4-5-20251001";

const UA =
  "FranschhoekLocalBot/1.0 (+https://franschhoeklocal.co.za; local discovery aggregator)";
const FETCH_TIMEOUT_MS = 15_000;
const POLITE_DELAY_MS = 2_500;
const VALID_CATEGORIES = new Set([
  "wineries",
  "restaurants",
  "coffee",
  "hotels",
  "art",
  "adventure",
  "padel",
]);

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    `✗ Missing env — SUPABASE_URL set: ${Boolean(SUPABASE_URL)}, SUPABASE_SECRET_KEY set: ${Boolean(
      SERVICE_KEY,
    )}. Add both as GitHub Actions secrets.`,
  );
  process.exit(1);
}
try {
  new URL(SUPABASE_URL);
} catch {
  console.error(
    "✗ SUPABASE_URL is not a valid URL. The secret must be exactly like https://<project-ref>.supabase.co — no quotes, and not a key.",
  );
  process.exit(1);
}

let supabase;
try {
  supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
} catch (e) {
  console.error("✗ createClient failed:", e?.message ?? e);
  console.error(
    `  diagnostics → url="${SUPABASE_URL}", keyLength=${SERVICE_KEY.length}, keyPrefix="${SERVICE_KEY.slice(
      0,
      3,
    )}…", anthropicKeySet=${Boolean(ANTHROPIC_API_KEY)}`,
  );
  process.exit(1);
}
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const slug = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "item";

const host = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "src";
  }
};

/** Deterministic id so re-runs upsert (update) the same row instead of duplicating. */
const stableId = (prefix, sourceUrl, title) => `${prefix}-${slug(host(sourceUrl))}-${slug(title)}`;

/** True if an event date has fully passed (uses the end of a range). Unknown dates are kept. */
function isPastEvent(iso) {
  if (!iso) return false;
  const last = String(iso).split(/\/|\s–\s|\s-\s|\sto\s/i).pop().trim();
  const d = new Date(last);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

/** True if a deal's validity date has passed. Unknown/empty dates are kept. */
function isExpiredDeal(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

async function fetchWithTimeout(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

/** Minimal robots.txt check for our User-Agent / the catch-all group. */
async function robotsAllows(url) {
  try {
    const origin = new URL(url).origin;
    const path = new URL(url).pathname || "/";
    const res = await fetchWithTimeout(`${origin}/robots.txt`);
    if (!res.ok) return true;
    const txt = await res.text();

    const lines = txt.split(/\r?\n/).map((l) => l.replace(/#.*$/, "").trim());
    let applies = false;
    const disallow = [];
    for (const line of lines) {
      const [rawKey, ...rest] = line.split(":");
      if (!rawKey) continue;
      const key = rawKey.toLowerCase().trim();
      const val = rest.join(":").trim();
      if (key === "user-agent") {
        applies = val === "*" || UA.toLowerCase().includes(val.toLowerCase());
      } else if (key === "disallow" && applies && val) {
        disallow.push(val);
      }
    }
    return !disallow.some((rule) => path.startsWith(rule));
  } catch {
    return true; // if robots can't be read, proceed politely
  }
}

// ── Extraction ───────────────────────────────────────────────────────

function extractJsonLd(html) {
  const out = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const items = Array.isArray(parsed) ? parsed : parsed["@graph"] ? parsed["@graph"] : [parsed];
      out.push(...items);
    } catch {
      /* ignore malformed JSON-LD */
    }
  }
  return out;
}

const typeStr = (t) => (Array.isArray(t) ? t.join(" ") : String(t ?? "")).toLowerCase();

function mapJsonLd(node, category, sourceUrl) {
  const t = typeStr(node["@type"]);
  const name = node.name || node.headline;
  if (!name) return null;
  const image = typeof node.image === "string" ? node.image : node.image?.url || node.image?.[0];

  if (t.includes("event")) {
    return {
      kind: "event",
      item: {
        title: String(name),
        venue: node.location?.name || "",
        categorySlug: category,
        date: node.startDate || "",
        image: image || "",
        description: typeof node.description === "string" ? node.description.slice(0, 600) : "",
        price: node.offers?.price ? `R${node.offers.price}` : "Free",
      },
    };
  }
  if (
    t.includes("restaurant") ||
    t.includes("cafe") ||
    t.includes("lodging") ||
    t.includes("hotel") ||
    t.includes("winery") ||
    t.includes("localbusiness") ||
    t.includes("touristattraction")
  ) {
    return {
      kind: "venue",
      item: {
        name: String(name),
        categorySlug: category,
        description: typeof node.description === "string" ? node.description.slice(0, 600) : "",
        address:
          node.address?.streetAddress ||
          (typeof node.address === "string" ? node.address : "") ||
          "",
        image: image || "",
        website: node.url || sourceUrl,
        phone: node.telephone || "",
      },
    };
  }
  return null;
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    // Page-builders (e.g. Thrive) inline huge base64-encoded CSS blobs that survive
    // tag-stripping and otherwise crowd out the real listing text. Drop long runs.
    .replace(/[A-Za-z0-9+/]{200,}={0,2}/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30_000);
}

function absUrl(src, base) {
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

/** Real photos from a page: og:image plus <img> candidates (with alt), as absolute URLs. */
function extractImages(html, baseUrl) {
  const meta =
    html.match(
      /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]+content=["']([^"']+)["']/i,
    ) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
  const ogImage = meta ? absUrl(meta[1], baseUrl) : null;

  const candidates = [];
  const seen = new Set();
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src =
      tag.match(/\b(?:data-src|data-lazy-src|data-original|src)=["']([^"']+)["']/i)?.[1] ||
      tag.match(/\bsrcset=["']([^"'\s,]+)/i)?.[1];
    if (!src) continue;
    const url = absUrl(src, baseUrl);
    if (!url || seen.has(url)) continue;
    // Skip logos / icons / spacers — we want real content photos.
    if (/\.svg(\?|$)|^data:|sprite|logo|icon|favicon|placeholder|pixel|spacer/i.test(url)) continue;
    seen.add(url);
    const alt = (tag.match(/\balt=["']([^"']*)["']/i)?.[1] || "").trim();
    candidates.push({ url, alt });
    if (candidates.length >= 40) break;
  }
  return { ogImage, candidates };
}

async function aiExtract(category, sourceUrl, text, images = []) {
  if (!anthropic || !text) return { venues: [], events: [], deals: [] };
  const imgList = images.map((im, i) => `[${i}] ${im.alt || "(no alt text)"}`).join("\n") || "(none)";
  const prompt = `You are extracting real, structured data from a Franschhoek (South Africa) "${category}" web page for a local-discovery app.

From the page text below, extract genuine venues, events and deals. Only include items clearly present in the text — do NOT invent anything.

A numbered list of images found on the page (with their alt text) is provided. For each item set "imageIndex" to the number of the image that best matches that item by name, or -1 when none clearly matches. Never guess an index.

Return STRICT JSON (no markdown) of the shape:
{
  "venues": [{ "name": "", "imageIndex": -1, "description": "", "address": "", "website": "", "phone": "" }],
  "events": [{ "title": "", "imageIndex": -1, "venue": "", "date": "ISO 8601 if known else empty", "price": "e.g. R250 or Free", "description": "" }],
  "deals":  [{ "title": "", "imageIndex": -1, "venue": "", "discount": "e.g. 20% OFF", "code": "if any", "validUntil": "ISO date if known else empty", "description": "" }]
}
Use empty arrays where there's nothing. Keep descriptions under 60 words.

IMAGES:
${imgList}

PAGE TEXT:
${text}`;

  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = res.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json);
    // Resolve imageIndex -> a real URL from the candidate list (drop out-of-range/hallucinated).
    const withImage = (arr) =>
      (Array.isArray(arr) ? arr : []).map((it) => {
        const idx = Number.isInteger(it.imageIndex) ? it.imageIndex : -1;
        return { ...it, image: idx >= 0 && idx < images.length ? images[idx].url : "" };
      });
    return {
      venues: withImage(parsed.venues),
      events: withImage(parsed.events),
      deals: withImage(parsed.deals),
    };
  } catch (e) {
    console.warn(`  · AI extract failed for ${sourceUrl}: ${e?.message ?? e}`);
    return { venues: [], events: [], deals: [] };
  }
}

/** Normalize an AI-extracted deal into a `deals` table row.
 *  Codes and end-dates are left null unless genuinely present on the page —
 *  these are "book direct" offers, so we never invent a redemption code. */
function dealRow(d, sourceUrl, category, now) {
  return {
    id: stableId("del", sourceUrl, d.title),
    title: d.title,
    venue: d.venue || "",
    category_slug: d.categorySlug || category,
    discount: d.discount || "OFFER",
    description: d.description || "",
    code: d.code ? String(d.code).trim() : null,
    valid_until: d.validUntil || null,
    image: d.image || "",
    source: "scraper",
    source_url: sourceUrl,
    updated_at: now,
  };
}

function extractWhatsAppGroups(html, category) {
  const links = [...html.matchAll(/https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+/g)].map((m) => m[0]);
  return [...new Set(links)].map((url) => ({ invite_url: url, categorySlug: category }));
}

// ── Per-source processing ─────────────────────────────────────────────

async function processSource(src, acc) {
  const { url, category, kinds } = src;
  if (!VALID_CATEGORIES.has(category)) {
    console.warn(`  · skipping ${url} — unknown category "${category}"`);
    return;
  }
  if (!(await robotsAllows(url))) {
    console.warn(`  · robots.txt disallows ${url} — skipping`);
    return;
  }

  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const html = await res.text();
  const { ogImage, candidates } = extractImages(html, url);

  const venues = [];
  const events = [];
  const deals = [];

  // 1) Structured data (schema.org / JSON-LD)
  for (const node of extractJsonLd(html)) {
    const mapped = mapJsonLd(node, category, url);
    if (!mapped) continue;
    if (mapped.kind === "event" && kinds.includes("event")) events.push(mapped.item);
    if (mapped.kind === "venue" && kinds.includes("venue")) venues.push(mapped.item);
  }

  // 2) Claude fallback to fill any kind the source asked for but structured data
  //    missed (e.g. a winery page yielded venues via JSON-LD but no events/deals).
  const missingKind =
    (kinds.includes("venue") && venues.length === 0) ||
    (kinds.includes("event") && events.length === 0) ||
    (kinds.includes("deal") && deals.length === 0);
  if (anthropic && missingKind) {
    const ai = await aiExtract(category, url, htmlToText(html), candidates);
    if (kinds.includes("venue") && venues.length === 0)
      venues.push(...ai.venues.map((v) => ({ ...v, categorySlug: category })));
    if (kinds.includes("event") && events.length === 0)
      events.push(...ai.events.map((e) => ({ ...e, categorySlug: category })));
    if (kinds.includes("deal") && deals.length === 0)
      deals.push(...ai.deals.map((d) => ({ ...d, categorySlug: category })));
  }

  // Single-venue pages (e.g. an individual hotel/restaurant site) — the page's
  // og:image is that venue's hero photo, so use it when we don't have a better one.
  if (ogImage && venues.length === 1 && !venues[0].image) venues[0].image = ogImage;

  // 3) Public community group links (not chat content — just openly-posted invites).
  const groups = extractWhatsAppGroups(html, category);

  // Normalize → DB rows (capped, deduped by stable id), stamped with provenance.
  const now = new Date().toISOString();
  const cap = (arr) => arr.slice(0, MAX_ITEMS_PER_SOURCE);

  for (const v of cap(venues)) {
    if (!v.name) continue;
    acc.venues.set(stableId("ven", url, v.name), {
      id: stableId("ven", url, v.name),
      name: v.name,
      category_slug: v.categorySlug || category,
      description: v.description || null,
      address: v.address || null,
      image: v.image || null,
      website: v.website || url,
      phone: v.phone || null,
      source: "scraper",
      source_url: url,
      updated_at: now,
    });
  }
  for (const e of cap(events)) {
    if (!e.title) continue;
    const eventDate = e.date || now.slice(0, 19);
    if (isPastEvent(eventDate)) continue; // only keep upcoming events
    acc.events.set(stableId("evt", url, e.title), {
      id: stableId("evt", url, e.title),
      title: e.title,
      venue: e.venue || "",
      category_slug: e.categorySlug || category,
      date: eventDate,
      image: e.image || "",
      is_premium: false,
      price: e.price || "Free",
      has_chat: false,
      description: e.description || "",
      source: "scraper",
      source_url: url,
      updated_at: now,
    });
  }
  for (const d of cap(deals)) {
    if (!d.title) continue;
    if (isExpiredDeal(d.validUntil)) continue; // only keep currently-valid offers
    const row = dealRow(d, url, category, now);
    acc.deals.set(row.id, row);
  }
  for (const g of groups) {
    acc.groups.set(g.invite_url, {
      id: `grp-${slug(g.invite_url.split("/").pop())}`,
      name: `${category[0].toUpperCase()}${category.slice(1)} community group`,
      category_slug: category,
      invite_url: g.invite_url,
      source: "scraper",
      active: true,
    });
  }

  console.log(
    `  ✓ ${url} → ${venues.length} venues, ${events.length} events, ${deals.length} deals, ${groups.length} groups`,
  );
}

// ── Venue-website deals pass ──────────────────────────────────────────
// Scrapes deals straight from the curated venues' OWN websites — i.e. the
// specials/offers each place is actually running. For every venue with a
// website, we look for a specials page and AI-extract any genuine offers,
// attributing them to that venue. Claude is only called when the page looks
// like it has specials (keyword guard) so cost stays low.

const SPECIALS_HINT = /special|offer|deal|promo|discount|package|voucher|what'?s[-\s]?on/i;

/** Find a likely specials/offers page linked from a venue homepage. */
function findSpecialsLink(html, baseUrl) {
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, " ");
    if (SPECIALS_HINT.test(href) || SPECIALS_HINT.test(text)) {
      const u = absUrl(href, baseUrl);
      if (u && /^https?:/i.test(u)) return u;
    }
  }
  return null;
}

async function scrapeVenueDeals(acc) {
  if (!anthropic) {
    console.log("  · venue deal scan skipped (no ANTHROPIC_API_KEY)");
    return;
  }
  const { data: venues, error } = await supabase
    .from("venues")
    .select("id, name, category_slug, website")
    .not("website", "is", null);
  if (error) {
    console.warn(`  · couldn't load venues for deal scan: ${error.message}`);
    return;
  }

  console.log(`  ▸ scanning ${venues.length} venue sites for current specials…`);
  const now = new Date().toISOString();
  let scanned = 0;

  for (const v of venues) {
    const site = (v.website || "").trim();
    if (!site || !/^https?:\/\//i.test(site)) continue;
    try {
      if (!(await robotsAllows(site))) continue;
      const res = await fetchWithTimeout(site);
      if (!res.ok) continue;
      const homeHtml = await res.text();

      // Prefer a dedicated specials page; otherwise scan the homepage only if it
      // mentions specials (keeps us from calling Claude on every site).
      let target = site;
      let html = homeHtml;
      const specialsUrl = findSpecialsLink(homeHtml, site);
      if (specialsUrl && specialsUrl !== site && (await robotsAllows(specialsUrl))) {
        const r2 = await fetchWithTimeout(specialsUrl);
        if (r2.ok) {
          target = specialsUrl;
          html = await r2.text();
          await sleep(POLITE_DELAY_MS);
        }
      }

      const text = htmlToText(html);
      if (!specialsUrl && !SPECIALS_HINT.test(text)) continue; // nothing offer-like → skip (no AI cost)

      const { ogImage, candidates } = extractImages(html, target);
      const ai = await aiExtract(v.category_slug, target, text, candidates);
      scanned++;

      let kept = 0;
      for (const d of ai.deals.slice(0, MAX_ITEMS_PER_SOURCE)) {
        if (!d.title) continue;
        if (isExpiredDeal(d.validUntil)) continue;
        const row = dealRow(
          { ...d, venue: d.venue || v.name, categorySlug: v.category_slug },
          target,
          v.category_slug,
          now,
        );
        if (!row.image && ogImage) row.image = ogImage;
        acc.deals.set(row.id, row);
        kept++;
      }
      if (kept) console.log(`    ✓ ${v.name}: ${kept} deal(s)`);
      await sleep(POLITE_DELAY_MS);
    } catch (e) {
      console.warn(`    · ${v.name}: ${e?.message ?? e}`);
    }
  }
  console.log(`  ▸ venue deal scan done (${scanned} site(s) had offer content)`);
}

async function upsert(table, rows) {
  if (rows.length === 0) return 0;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (error) {
    console.warn(`  · upsert ${table} failed: ${error.message}`);
    return 0;
  }
  return rows.length;
}

async function main() {
  console.log(`▶ Scrape started ${new Date().toISOString()} (${SOURCES.length} sources, model ${MODEL})`);
  const startedAt = new Date().toISOString();
  const acc = { venues: new Map(), events: new Map(), deals: new Map(), groups: new Map() };
  const errors = [];

  for (const src of SOURCES) {
    try {
      await processSource(src, acc);
    } catch (e) {
      const msg = `${src.url}: ${e?.message ?? e}`;
      console.warn(`  ✗ ${msg}`);
      errors.push(msg);
    }
    await sleep(POLITE_DELAY_MS);
  }

  // Pull current specials straight from the curated venues' own websites.
  try {
    await scrapeVenueDeals(acc);
  } catch (e) {
    const msg = `venue-deal-scan: ${e?.message ?? e}`;
    console.warn(`  ✗ ${msg}`);
    errors.push(msg);
  }

  const venues = await upsert("venues", [...acc.venues.values()]);
  const events = await upsert("events", [...acc.events.values()]);
  const deals = await upsert("deals", [...acc.deals.values()]);
  const groups = await upsert("community_groups", [...acc.groups.values()]);

  await supabase.from("scrape_runs").insert({
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    ok: errors.length === 0,
    sources: SOURCES.length,
    venues_upserted: venues,
    events_upserted: events,
    deals_upserted: deals,
    groups_upserted: groups,
    errors: errors.length ? errors.join("\n") : null,
  });

  console.log(
    `✔ Done: ${venues} venues, ${events} events, ${deals} deals, ${groups} groups upserted${
      errors.length ? `, ${errors.length} source error(s)` : ""
    }`,
  );
}

main().catch((e) => {
  console.error("Fatal scraper error:", e);
  process.exit(1);
});
