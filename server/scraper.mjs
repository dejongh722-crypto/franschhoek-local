// Franschhoek Local — content scraper.
//
// Reads the sources in ./sources.mjs, pulls real venues / events / deals (and any
// public WhatsApp community-group invite links), normalizes them and upserts them
// into Supabase. Auto-publishes: scraped rows go straight into the live tables.
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
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12_000);
}

async function aiExtract(category, sourceUrl, text) {
  if (!anthropic || !text) return { venues: [], events: [], deals: [] };
  const prompt = `You are extracting real, structured data from a Franschhoek (South Africa) "${category}" web page for a local-discovery app.

From the page text below, extract genuine venues, events and deals. Only include items clearly present in the text — do NOT invent anything. Return STRICT JSON (no markdown) of the shape:
{
  "venues": [{ "name": "", "description": "", "address": "", "website": "", "phone": "" }],
  "events": [{ "title": "", "venue": "", "date": "ISO 8601 if known else empty", "price": "e.g. R250 or Free", "description": "" }],
  "deals":  [{ "title": "", "venue": "", "discount": "e.g. 20% OFF", "code": "if any", "validUntil": "ISO date if known else empty", "description": "" }]
}
Use empty arrays where there's nothing. Keep descriptions under 60 words.

PAGE TEXT:
${text}`;

  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1800,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = res.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json);
    return {
      venues: Array.isArray(parsed.venues) ? parsed.venues : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      deals: Array.isArray(parsed.deals) ? parsed.deals : [],
    };
  } catch (e) {
    console.warn(`  · AI extract failed for ${sourceUrl}: ${e?.message ?? e}`);
    return { venues: [], events: [], deals: [] };
  }
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

  // 2) Claude fallback when structured data is thin.
  if (events.length + venues.length + deals.length < 3) {
    const ai = await aiExtract(category, url, htmlToText(html));
    if (kinds.includes("venue")) venues.push(...ai.venues.map((v) => ({ ...v, categorySlug: category })));
    if (kinds.includes("event")) events.push(...ai.events.map((e) => ({ ...e, categorySlug: category })));
    if (kinds.includes("deal")) deals.push(...ai.deals.map((d) => ({ ...d, categorySlug: category })));
  }

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
    acc.events.set(stableId("evt", url, e.title), {
      id: stableId("evt", url, e.title),
      title: e.title,
      venue: e.venue || "",
      category_slug: e.categorySlug || category,
      date: e.date || now.slice(0, 19),
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
    acc.deals.set(stableId("del", url, d.title), {
      id: stableId("del", url, d.title),
      title: d.title,
      venue: d.venue || "",
      category_slug: d.categorySlug || category,
      discount: d.discount || "OFFER",
      description: d.description || "",
      code: d.code || "DEAL",
      valid_until: d.validUntil || new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
      image: d.image || "",
      source: "scraper",
      source_url: url,
      updated_at: now,
    });
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
