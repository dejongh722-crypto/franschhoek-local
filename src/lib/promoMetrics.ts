import { supabase } from "@/lib/supabase";
import type { Promotion } from "@/store/promotions";

/**
 * Promotion analytics: track clicks and attribute later sign-ups back to the
 * promo a user last clicked. Writes to Supabase (`promotion_events`) when
 * configured, otherwise falls back to localStorage so the feature works offline.
 */

const LOCAL_EVENTS_KEY = "fl.promoEvents.v1";
const ATTRIB_KEY = "fl.promoClick.v1";
const SESSION_KEY = "fl.sessionId.v1";
/** A sign-up counts toward a promo if it happens within this window of the click. */
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type PromoEventType = "click" | "signup";

export interface PromoMetrics {
  clicks: number;
  signups: number;
}

interface LocalEvent {
  promo_id: string;
  type: PromoEventType;
}

/** Stable anonymous id so we can tie a click and a later sign-up to one device. */
function sessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function readLocal(): LocalEvent[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY) ?? "[]") as LocalEvent[];
  } catch {
    return [];
  }
}

function writeLocal(rows: LocalEvent[]) {
  try {
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(rows));
  } catch {
    /* ignore quota errors */
  }
}

async function record(promoId: string, type: PromoEventType, userId?: string) {
  try {
    if (supabase) {
      await supabase
        .from("promotion_events")
        .insert({ promo_id: promoId, type, session_id: sessionId(), user_id: userId ?? null });
    } else {
      const rows = readLocal();
      rows.push({ promo_id: promoId, type });
      writeLocal(rows);
    }
  } catch {
    /* tracking is best-effort — never let it break the user flow (e.g. table not created yet) */
  }
}

/** Call when a user taps a promotion. Records a click + remembers it for sign-up attribution. */
export function trackPromoClick(promoId: string) {
  try {
    localStorage.setItem(ATTRIB_KEY, JSON.stringify({ promoId, at: Date.now() }));
  } catch {
    /* ignore */
  }
  void record(promoId, "click");
}

/** Call right after a successful sign-up. Credits the promo the user last clicked (if recent). */
export function trackSignupAttribution(userId?: string) {
  let attrib: { promoId: string; at: number } | null = null;
  try {
    attrib = JSON.parse(localStorage.getItem(ATTRIB_KEY) ?? "null");
  } catch {
    /* ignore */
  }
  if (!attrib) return;
  if (Date.now() - attrib.at <= ATTRIBUTION_WINDOW_MS) {
    void record(attrib.promoId, "signup", userId);
  }
  try {
    localStorage.removeItem(ATTRIB_KEY);
  } catch {
    /* ignore */
  }
}

/** Aggregate clicks + sign-ups per promotion id. */
export async function fetchPromoMetrics(): Promise<Record<string, PromoMetrics>> {
  const acc: Record<string, PromoMetrics> = {};
  const bump = (id: string, type: PromoEventType) => {
    acc[id] ??= { clicks: 0, signups: 0 };
    if (type === "click") acc[id].clicks += 1;
    else if (type === "signup") acc[id].signups += 1;
  };

  if (supabase) {
    const { data } = await supabase.from("promotion_events").select("promo_id, type");
    (data as LocalEvent[] | null)?.forEach((r) => bump(r.promo_id, r.type));
  } else {
    readLocal().forEach((r) => bump(r.promo_id, r.type));
  }
  return acc;
}

export function conversionRate(m: PromoMetrics): number {
  return m.clicks > 0 ? (m.signups / m.clicks) * 100 : 0;
}

const reportDate = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" });

/** Human-readable performance report for sending to the business running the promo. */
export function buildPromoReport(promo: Promotion, m: PromoMetrics): string {
  const window =
    promo.startsAt || promo.endsAt
      ? `${promo.startsAt || "start"} → ${promo.endsAt || "ongoing"}`
      : "Ongoing";
  return [
    `Franschhoek Local — Promotion Report`,
    `Generated ${reportDate.format(new Date())}`,
    ``,
    `Promotion: ${promo.title}`,
    `Audience:  ${promo.audience}`,
    `Period:    ${window}`,
    ``,
    `Clicks:        ${m.clicks}`,
    `Sign-ups:      ${m.signups}`,
    `Conversion:    ${conversionRate(m).toFixed(1)}%`,
    ``,
    `"Clicks" = people who tapped the promotion. "Sign-ups" = those who then`,
    `created an account within 30 days of clicking.`,
  ].join("\n");
}

/** CSV row for spreadsheet-friendly export. */
export function promoReportCsv(promo: Promotion, m: PromoMetrics): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [
    ["Promotion", "Audience", "Clicks", "Sign-ups", "Conversion %"].map(esc).join(","),
    [promo.title, promo.audience, m.clicks, m.signups, conversionRate(m).toFixed(1)].map(esc).join(","),
  ].join("\n");
}

/** Trigger a client-side file download. */
export function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "promotion";
}
