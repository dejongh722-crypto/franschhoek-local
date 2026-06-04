import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Crown,
  Wallet,
  TrendingUp,
  Percent,
  CalendarDays,
  Tag,
  Megaphone,
  Plus,
  Trash2,
  Pencil,
  X,
  MousePointerClick,
  UserPlus,
  BarChart3,
  Send,
  Download,
  Copy,
  ChevronDown,
  RefreshCw,
  MessagesSquare,
  MapPinned,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { analytics, monthlyRevenue, zar } from "@/data/analytics";
import { formatEventDate } from "@/data/events";
import { formatValidUntil } from "@/data/deals";
import { categories } from "@/data/categories";
import { knowledgePosts } from "@/data/knowledge";
import { recentUsers, formatJoined } from "@/data/users";
import { initials } from "@/data/chat";
import { isPromoLive, usePromotions, type Audience, type Promotion } from "@/store/promotions";
import { useEvents } from "@/store/events";
import { useVenues } from "@/store/venues";
import { useDeals } from "@/store/deals";
import { useKnowledge } from "@/store/knowledge";
import { venueImage } from "@/data/venues";
import { ImageField } from "@/components/admin/ImageField";
import { useCommunityGroups } from "@/store/communityGroups";
import { useToast } from "@/store/toast";
import { supabase, type ProfileRow } from "@/lib/supabase";
import {
  fetchPromoMetrics,
  conversionRate,
  buildPromoReport,
  promoReportCsv,
  downloadText,
  slugify,
  type PromoMetrics,
} from "@/lib/promoMetrics";
import { share } from "@/lib/share";
import { cn } from "@/lib/utils";

const NO_METRICS: PromoMetrics = { clicks: 0, signups: 0 };

interface ScrapeRunRow {
  started_at: string;
  ok: boolean | null;
  sources: number;
  venues_upserted: number;
  events_upserted: number;
  deals_upserted: number;
  groups_upserted: number;
  errors: string | null;
}

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "free", label: "Free members" },
  { value: "premium", label: "Premium members" },
];

/** Where a promo's button sends people. Specific items deep-link to their detail page. */
type LinkKind = "none" | "event" | "deal" | "guide" | "page" | "custom";

const PAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "/deals", label: "Deals page" },
  { value: "/events", label: "Events page" },
  { value: "/knowledge", label: "Local Knowledge page" },
  { value: "/membership", label: "Membership / Premium" },
];

/** Turn the form's link picker into a single ctaLink path. */
function resolveLink(f: { linkKind: LinkKind; linkPage: string; linkId: string; linkCustom: string }): string {
  switch (f.linkKind) {
    case "event":
      return f.linkId ? `/events/${f.linkId}` : "";
    case "deal":
      return f.linkId ? `/deals/${f.linkId}` : "";
    case "guide":
      return f.linkId ? `/knowledge/${f.linkId}` : "";
    case "page":
      return f.linkPage;
    case "custom":
      return f.linkCustom.trim();
    default:
      return "";
  }
}

/** Reverse: load an existing ctaLink back into the picker fields when editing. */
function parseLink(ctaLink?: string): { linkKind: LinkKind; linkPage: string; linkId: string; linkCustom: string } {
  const base = { linkKind: "none" as LinkKind, linkPage: "/deals", linkId: "", linkCustom: "" };
  const link = (ctaLink ?? "").trim();
  if (!link) return base;
  const detail = link.match(/^\/(events|deals|knowledge)\/(.+)$/);
  if (detail) {
    const kind: LinkKind = detail[1] === "events" ? "event" : detail[1] === "deals" ? "deal" : "guide";
    return { ...base, linkKind: kind, linkId: detail[2] };
  }
  if (PAGE_OPTIONS.some((p) => p.value === link)) return { ...base, linkKind: "page", linkPage: link };
  return { ...base, linkKind: "custom", linkCustom: link };
}

const emptyForm = {
  title: "",
  body: "",
  audience: "all" as Audience,
  ctaLabel: "",
  image: "",
  startsAt: "",
  endsAt: "",
  // Link target picker — guarantees the button deep-links to the promoted item.
  linkKind: "none" as LinkKind,
  linkPage: "/deals",
  linkId: "",
  linkCustom: "",
};

function promoStatus(p: Promotion): { label: string; tone: "live" | "scheduled" | "off" } {
  if (!p.active) return { label: "Off", tone: "off" };
  const now = new Date();
  if (p.startsAt && new Date(p.startsAt) > now) return { label: "Scheduled", tone: "scheduled" };
  if (!isPromoLive(p, now)) return { label: "Ended", tone: "off" };
  return { label: "Live", tone: "live" };
}

export function Admin() {
  const navigate = useNavigate();
  const toast = useToast();
  const { promotions, addPromotion, updatePromotion, removePromotion, toggleActive } = usePromotions();
  const { events } = useEvents();
  const { deals } = useDeals();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dbUsers, setDbUsers] = useState<ProfileRow[] | null>(null);
  const [metrics, setMetrics] = useState<Record<string, PromoMetrics>>({});
  const [reportFor, setReportFor] = useState<Promotion | null>(null);
  const [scrapeRun, setScrapeRun] = useState<ScrapeRunRow | null>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setDbUsers(data as ProfileRow[]);
      });
  }, []);

  // Load promotion performance (clicks + attributed sign-ups).
  useEffect(() => {
    void fetchPromoMetrics().then(setMetrics);
  }, [promotions.length]);

  // Latest content-scraper run.
  useEffect(() => {
    if (!supabase) return;
    void supabase
      .from("scrape_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setScrapeRun(data as ScrapeRunRow);
      });
  }, []);

  const usersList =
    dbUsers && dbUsers.length > 0
      ? dbUsers.map((u) => ({
          name: u.full_name || u.email || "Member",
          email: u.email || "",
          tier: u.tier,
          joined: u.created_at,
        }))
      : recentUsers;
  const usersAreReal = Boolean(dbUsers && dbUsers.length > 0);

  const liveCount = promotions.filter((p) => isPromoLive(p)).length;
  const mrr = monthlyRevenue[monthlyRevenue.length - 1].amount;
  const allTime = monthlyRevenue.reduce((s, m) => s + m.amount, 0) + analytics.historicRevenueBase;
  const conversion = (analytics.premiumMembers / analytics.totalUsers) * 100;
  const arpu = mrr / analytics.premiumMembers;
  const maxRev = Math.max(...monthlyRevenue.map((m) => m.amount));
  const totalClicks = Object.values(metrics).reduce((s, m) => s + m.clicks, 0);
  const totalSignups = Object.values(metrics).reduce((s, m) => s + m.signups, 0);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (p: Promotion) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      body: p.body,
      audience: p.audience,
      ctaLabel: p.ctaLabel ?? "",
      image: p.image ?? "",
      startsAt: p.startsAt ?? "",
      endsAt: p.endsAt ?? "",
      ...parseLink(p.ctaLink),
    });
    toast("Editing — update the form above");
  };

  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      toast("Add a title and message");
      return;
    }
    if ((form.linkKind === "event" || form.linkKind === "deal" || form.linkKind === "guide") && !form.linkId) {
      toast("Choose the item this promo links to");
      return;
    }
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      audience: form.audience,
      ctaLabel: form.ctaLabel.trim() || undefined,
      ctaLink: resolveLink(form) || undefined,
      image: form.image.trim() || undefined,
      startsAt: form.startsAt || undefined,
      endsAt: form.endsAt || undefined,
    };
    setSaving(true);
    const { error } = editingId
      ? await updatePromotion(editingId, payload)
      : await addPromotion({ ...payload, active: true });
    setSaving(false);
    if (error) {
      toast(error); // keep the form so the user doesn't lose their edits
      return;
    }
    toast(editingId ? "Promotion updated" : "Promotion created");
    resetForm();
  };

  return (
    <div className="pb-8">
      <header className="bg-gradient-to-br from-wine via-wine to-wine-deep px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)] text-white">
        <div className="flex items-center gap-3">
          <button
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/15 ring-1 ring-white/25 transition-colors hover:bg-white/25"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-semibold">Admin</h1>
            <p className="text-xs text-white/70">Metrics, promotions & users</p>
          </div>
        </div>
      </header>

      <div className="space-y-7 px-5 py-5">
        {/* Key metrics */}
        <section className="grid grid-cols-2 gap-3">
          <Metric icon={Users} label="Total users" value={analytics.totalUsers.toLocaleString("en-ZA")} sub={`+${analytics.newUsersThisMonth} this month`} />
          <Metric icon={Crown} label="Premium members" value={analytics.premiumMembers.toLocaleString("en-ZA")} sub={`${conversion.toFixed(1)}% conversion`} accent />
          <Metric icon={Wallet} label="Monthly revenue" value={zar.format(mrr)} sub="MRR" />
          <Metric icon={TrendingUp} label="All-time revenue" value={zar.format(allTime)} sub="incl. one-off sales" />
        </section>

        {/* Revenue chart */}
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Revenue · last 8 months</h2>
          <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/5">
            <div className="flex h-40 items-end justify-between gap-2">
              {monthlyRevenue.map((m) => (
                <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-wine to-wine-soft"
                      style={{ height: `${Math.max(6, (m.amount / maxRev) * 100)}%` }}
                      title={zar.format(m.amount)}
                    />
                  </div>
                  <span className="text-[10px] text-muted">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Secondary metrics */}
        <section className="grid grid-cols-3 gap-3">
          <MiniStat icon={Percent} label="ARPU" value={zar.format(arpu)} />
          <MiniStat icon={Megaphone} label="Live promos" value={String(liveCount)} />
          <MiniStat icon={CalendarDays} label="Events" value={String(events.length)} />
          <MiniStat icon={Tag} label="Deals" value={String(deals.length)} />
          <MiniStat icon={Users} label="Free members" value={(analytics.totalUsers - analytics.premiumMembers).toLocaleString("en-ZA")} />
          <MiniStat icon={Crown} label="Premium" value={analytics.premiumMembers.toLocaleString("en-ZA")} />
        </section>

        {/* Create / edit promotion */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              {editingId ? "Edit promotion" : "Create a promotion"}
            </h2>
            {editingId && (
              <button onClick={resetForm} className="flex items-center gap-1 text-xs font-semibold text-muted">
                <X className="h-3.5 w-3.5" strokeWidth={2} />
                Cancel
              </button>
            )}
          </div>
          <form onSubmit={submit} className="space-y-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/5">
            <Field label="Title">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Winter Wine Special 🍷" className="input" />
            </Field>
            <Field label="Message">
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="What's the promotion about?" rows={3} className="input resize-none" />
            </Field>
            <Field label="Audience">
              <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as Audience })} className="input">
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts (optional)">
                <input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="input" />
              </Field>
              <Field label="Ends (optional)">
                <input type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="input" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Button text (optional)">
                <input value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} placeholder="View deal" className="input" />
              </Field>
              <Field label="Button links to">
                <select
                  value={form.linkKind}
                  onChange={(e) => setForm({ ...form, linkKind: e.target.value as LinkKind, linkId: "" })}
                  className="input"
                >
                  <option value="none">No button</option>
                  <option value="event">A specific event</option>
                  <option value="deal">A specific deal</option>
                  <option value="guide">A specific guide</option>
                  <option value="page">A section page</option>
                  <option value="custom">Custom link / URL</option>
                </select>
              </Field>
            </div>

            {/* Pick the exact destination so the promo deep-links to what it advertises. */}
            {form.linkKind === "event" && (
              <Field label="Choose event">
                <select value={form.linkId} onChange={(e) => setForm({ ...form, linkId: e.target.value })} className="input">
                  <option value="">Select an event…</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </Field>
            )}
            {form.linkKind === "deal" && (
              <Field label="Choose deal">
                <select value={form.linkId} onChange={(e) => setForm({ ...form, linkId: e.target.value })} className="input">
                  <option value="">Select a deal…</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>{d.title} — {d.venue}</option>
                  ))}
                </select>
              </Field>
            )}
            {form.linkKind === "guide" && (
              <Field label="Choose guide">
                <select value={form.linkId} onChange={(e) => setForm({ ...form, linkId: e.target.value })} className="input">
                  <option value="">Select a guide…</option>
                  {knowledgePosts.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </Field>
            )}
            {form.linkKind === "page" && (
              <Field label="Choose page">
                <select value={form.linkPage} onChange={(e) => setForm({ ...form, linkPage: e.target.value })} className="input">
                  {PAGE_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </Field>
            )}
            {form.linkKind === "custom" && (
              <Field label="Custom link or URL">
                <input
                  value={form.linkCustom}
                  onChange={(e) => setForm({ ...form, linkCustom: e.target.value })}
                  placeholder="/deals/boschendal-tasting-20 or https://…"
                  className="input"
                />
              </Field>
            )}
            <Field label="Photo">
              <ImageField value={form.image} onChange={(url) => setForm({ ...form, image: url })} folder="promotions" />
            </Field>
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-wine py-3 text-sm font-semibold text-white transition-colors hover:bg-wine-soft disabled:opacity-60"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              {saving ? "Saving…" : editingId ? "Save changes" : "Create promotion"}
            </button>
          </form>
        </section>

        {/* Existing promotions */}
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Promotions ({promotions.length})</h2>
          <div className="space-y-3">
            {promotions.length === 0 && (
              <p className="rounded-2xl border border-dashed border-line bg-white/50 px-4 py-5 text-sm text-muted">
                No promotions yet — create one above.
              </p>
            )}
            {promotions.map((p) => {
              const status = promoStatus(p);
              return (
                <div key={p.id} className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-ink">{p.title}</h3>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          status.tone === "live" && "bg-cat-adventure/15 text-cat-adventure",
                          status.tone === "scheduled" && "bg-cta/15 text-cta",
                          status.tone === "off" && "bg-ink/5 text-muted",
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{p.body}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      {AUDIENCES.find((a) => a.value === p.audience)?.label}
                      {(p.startsAt || p.endsAt) && ` · ${p.startsAt || "…"} → ${p.endsAt || "…"}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <button
                      onClick={async () => {
                        const { error } = await toggleActive(p.id);
                        if (error) toast(error);
                      }}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                        p.active ? "bg-ink/5 text-ink" : "bg-wine text-white",
                      )}
                    >
                      {p.active ? "Pause" : "Go live"}
                    </button>
                    <div className="flex gap-1">
                      <button
                        aria-label="Edit promotion"
                        onClick={() => startEdit(p)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-black/5 hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <button
                        aria-label="Delete promotion"
                        onClick={async () => {
                          const { error } = await removePromotion(p.id);
                          if (error) {
                            toast(error);
                            return;
                          }
                          if (editingId === p.id) resetForm();
                        }}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Promotion performance */}
        <section>
          <div className="mb-1 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-wine" strokeWidth={2} />
            <h2 className="font-display text-lg font-semibold text-ink">Promotion performance</h2>
          </div>
          <p className="mb-3 text-[11px] text-muted">
            Clicks and attributed sign-ups per promotion. Send a business its report to show what it paid for.
          </p>

          {/* Totals */}
          <div className="mb-3 grid grid-cols-2 gap-3">
            <MiniStat icon={MousePointerClick} label="Total promo clicks" value={totalClicks.toLocaleString("en-ZA")} />
            <MiniStat icon={UserPlus} label="Attributed sign-ups" value={totalSignups.toLocaleString("en-ZA")} />
          </div>

          <div className="space-y-3">
            {promotions.length === 0 && (
              <p className="rounded-2xl border border-dashed border-line bg-white/50 px-4 py-5 text-sm text-muted">
                No promotions to measure yet.
              </p>
            )}
            {promotions.map((p) => {
              const m = metrics[p.id] ?? NO_METRICS;
              return (
                <div key={p.id} className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 flex-1 truncate font-semibold text-ink">{p.title}</h3>
                    <button
                      onClick={() => setReportFor(p)}
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-wine px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-wine-soft"
                    >
                      <Send className="h-3.5 w-3.5" strokeWidth={2} />
                      Send report
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <PerfStat label="Clicks" value={m.clicks.toLocaleString("en-ZA")} />
                    <PerfStat label="Sign-ups" value={m.signups.toLocaleString("en-ZA")} />
                    <PerfStat label="Conversion" value={`${conversionRate(m).toFixed(1)}%`} accent />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Content scraper status */}
        <Collapsible
          icon={RefreshCw}
          title="Content scraper"
          subtitle="Auto-updates venues, events & deals every 4 hours"
        >
          <div className="rounded-2xl bg-card p-4 text-sm shadow-sm ring-1 ring-black/5">
            {scrapeRun ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Last run</span>
                  <span className="font-medium text-ink">
                    {new Date(scrapeRun.started_at).toLocaleString("en-ZA")}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <PerfStat label="Venues" value={String(scrapeRun.venues_upserted)} />
                  <PerfStat label="Events" value={String(scrapeRun.events_upserted)} />
                  <PerfStat label="Deals" value={String(scrapeRun.deals_upserted)} />
                  <PerfStat label="Groups" value={String(scrapeRun.groups_upserted)} />
                </div>
                <p className={cn("mt-3 text-xs font-medium", scrapeRun.ok ? "text-cat-adventure" : "text-red-500")}>
                  {scrapeRun.ok ? "✓ Completed cleanly" : "⚠ Finished with some source errors"}
                </p>
                {scrapeRun.errors && (
                  <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-xl bg-sand px-3 py-2 text-[11px] text-muted">
                    {scrapeRun.errors}
                  </pre>
                )}
              </>
            ) : (
              <p className="text-muted">
                No scrape runs yet. The scheduled job (every 4 hours) or{" "}
                <span className="font-mono text-ink">npm run scrape</span> will populate venues, events &amp;
                deals here.
              </p>
            )}
          </div>
        </Collapsible>

        {/* Manage events */}
        <EventsManager />

        {/* Manage places (venues) — change photos */}
        <VenuesManager />

        {/* Manage deals */}
        <DealsManager />

        {/* Manage local knowledge */}
        <KnowledgeManager />

        {/* Manage community groups */}
        <GroupsManager />

        {/* Users */}
        <section>
          <h2 className="mb-1 font-display text-lg font-semibold text-ink">Users</h2>
          <p className="mb-3 text-[11px] text-muted">
            {usersAreReal ? `${usersList.length} member${usersList.length === 1 ? "" : "s"} (live)` : "Showing recent members (sample data)"}
          </p>
          <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/5">
            {usersList.map((u, i) => (
              <div
                key={u.email || i}
                className={cn("flex items-center gap-3 px-4 py-3", i < usersList.length - 1 && "border-b border-line")}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-wine/10 text-xs font-bold text-wine">
                  {initials(u.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">{u.name}</div>
                  <div className="truncate text-xs text-muted">{u.email}</div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      u.tier === "premium" ? "bg-cta/15 text-cta" : "bg-ink/5 text-muted",
                    )}
                  >
                    {u.tier}
                  </span>
                  <span className="text-[10px] text-muted">{formatJoined(u.joined)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-[11px] text-muted">
          Revenue &amp; user figures are sample data until Yoco is connected. Promotion clicks &amp; sign-ups are live.
        </p>
      </div>

      {reportFor && (
        <ReportModal
          promo={reportFor}
          metrics={metrics[reportFor.id] ?? NO_METRICS}
          onClose={() => setReportFor(null)}
          toast={toast}
        />
      )}
    </div>
  );
}

function ReportModal({
  promo,
  metrics,
  onClose,
  toast,
}: {
  promo: Promotion;
  metrics: PromoMetrics;
  onClose: () => void;
  toast: (msg: string) => void;
}) {
  const [email, setEmail] = useState("");
  const report = buildPromoReport(promo, metrics);

  const emailReport = () => {
    const subject = `Promotion report — ${promo.title}`;
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(report)}`;
  };
  const shareReport = async () => {
    const r = await share({ title: `Promotion report — ${promo.title}`, text: report });
    if (r === "copied") toast("Report copied");
    else if (r === "failed") toast("Couldn't share");
  };
  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
      toast("Report copied");
    } catch {
      toast("Couldn't copy");
    }
  };
  const downloadCsv = () => {
    downloadText(`${slugify(promo.title)}-report.csv`, promoReportCsv(promo, metrics), "text/csv");
    toast("CSV downloaded");
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-rise w-full max-w-sm overflow-hidden rounded-3xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">Send report</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-black/5 hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Preview */}
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-2xl bg-sand px-4 py-3 font-mono text-[11px] leading-relaxed text-ink">
            {report}
          </pre>

          {/* Email to the business */}
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-medium text-muted">Business email (optional)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@winery.co.za"
              className="input"
            />
          </label>
          <button
            onClick={emailReport}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-cta py-3 text-sm font-semibold text-white transition-colors hover:bg-cta-hover"
          >
            <Send className="h-4 w-4" strokeWidth={2} />
            Email report
          </button>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <ModalAction icon={Send} label="Share" onClick={shareReport} />
            <ModalAction icon={Copy} label="Copy" onClick={copyReport} />
            <ModalAction icon={Download} label="CSV" onClick={downloadCsv} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalAction({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-card py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-black/[0.02]"
    >
      <Icon className="h-4 w-4 text-wine" strokeWidth={2} />
      {label}
    </button>
  );
}

function PerfStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-xl px-2 py-2.5", accent ? "bg-cta/10" : "bg-sand")}>
      <div className={cn("font-display text-xl font-semibold leading-none", accent ? "text-cta" : "text-ink")}>
        {value}
      </div>
      <div className="mt-1 text-[10px] font-medium text-muted">{label}</div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/5">
      <span className={cn("grid h-9 w-9 place-items-center rounded-xl", accent ? "bg-cta/15 text-cta" : "bg-wine/10 text-wine")}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="mt-3 font-display text-2xl font-semibold leading-none text-ink">{value}</div>
      <div className="mt-1 text-xs font-medium text-ink">{label}</div>
      <div className="text-[11px] text-muted">{sub}</div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-card px-2 py-3 text-center shadow-sm ring-1 ring-black/5">
      <Icon className="h-4 w-4 text-wine" strokeWidth={1.75} />
      <span className="mt-1 font-display text-base font-semibold text-ink">{value}</span>
      <span className="text-[10px] leading-tight text-muted">{label}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function Collapsible({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-black/5 transition-colors hover:bg-black/[0.01]"
      >
        <Icon className="h-5 w-5 shrink-0 text-wine" strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
        </div>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-muted transition-transform", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-ink">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn("relative h-5 w-9 rounded-full transition-colors", checked ? "bg-wine" : "bg-line")}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </button>
      {label}
    </label>
  );
}

function ManageRow({
  title,
  sub,
  thumb,
  onEdit,
  onDelete,
}: {
  title: string;
  sub: string;
  thumb?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-black/5">
      {thumb !== undefined && (
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-sand ring-1 ring-black/5">
          {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" />}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink">{title}</div>
        <div className="truncate text-[11px] text-muted">{sub}</div>
      </div>
      {onEdit && (
        <button
          aria-label="Edit"
          onClick={onEdit}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-wine/10 hover:text-wine"
        >
          <Pencil className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
      {onDelete && (
        <button
          aria-label="Delete"
          onClick={onDelete}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

const FALLBACK_EVENT_IMG =
  "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=70";
const FALLBACK_DEAL_IMG =
  "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=70";

function EventsManager() {
  const { events, addEvent, updateEvent, removeEvent } = useEvents();
  const toast = useToast();
  const empty = {
    title: "",
    venue: "",
    categorySlug: categories[0].slug,
    date: "",
    price: "",
    image: "",
    description: "",
    isPremium: false,
    hasChat: false,
  };
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startEdit = (ev: (typeof events)[number]) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      venue: ev.venue,
      categorySlug: ev.categorySlug || categories[0].slug,
      date: ev.date?.slice(0, 16) || "",
      price: ev.price,
      image: ev.image,
      description: ev.description,
      isPremium: ev.isPremium,
      hasChat: ev.hasChat,
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(empty);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast("Add an event title");
    if (!editingId && !form.date) return toast("Pick a date & time");
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      venue: form.venue.trim(),
      categorySlug: form.categorySlug,
      date: form.date,
      image: form.image.trim() || FALLBACK_EVENT_IMG,
      isPremium: form.isPremium,
      price: form.price.trim() || "Free",
      hasChat: form.hasChat,
      description: form.description.trim(),
    };
    const { error } = editingId ? await updateEvent(editingId, payload) : await addEvent(payload);
    setSaving(false);
    if (error) return toast(error);
    toast(editingId ? "Event updated" : "Event added");
    setEditingId(null);
    setForm(empty);
  };

  return (
    <Collapsible
      icon={CalendarDays}
      title={`Events (${events.length})`}
      subtitle="Add events to the Events page, or remove ones you don't want."
    >
      <form onSubmit={submit} className="space-y-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/5">
        <Field label="Title">
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Sunset Wine Tasting" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Venue">
            <input className="input" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Boschendal Estate" />
          </Field>
          <Field label="Category">
            <select className="input" value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date & time">
            <input type="datetime-local" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Price">
            <input className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="R250 or Free" />
          </Field>
        </div>
        <Field label="Photo">
          <ImageField value={form.image} onChange={(url) => setForm({ ...form, image: url })} folder="events" />
        </Field>
        <Field label="Description">
          <textarea rows={3} className="input resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's the event about?" />
        </Field>
        <div className="flex flex-wrap gap-4 pt-1">
          <Toggle label="Premium only" checked={form.isPremium} onChange={(v) => setForm({ ...form, isPremium: v })} />
          <Toggle label="Has community chat" checked={form.hasChat} onChange={(v) => setForm({ ...form, hasChat: v })} />
        </div>
        <div className="flex gap-2">
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded-full px-4 py-3 text-sm font-semibold text-muted ring-1 ring-black/10 transition-colors hover:bg-black/5">
              Cancel
            </button>
          )}
          <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-wine py-3 text-sm font-semibold text-white transition-colors hover:bg-wine-soft disabled:opacity-60">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            {saving ? "Saving…" : editingId ? "Save changes" : "Add event"}
          </button>
        </div>
      </form>

      <div className="mt-3 space-y-2">
        {events.map((ev) => (
          <ManageRow
            key={ev.id}
            title={ev.title}
            sub={`${ev.venue} · ${ev.date ? formatEventDate(ev.date) : "no date"}`}
            thumb={ev.image}
            onEdit={() => startEdit(ev)}
            onDelete={async () => {
              const { error } = await removeEvent(ev.id);
              if (error) toast(error);
            }}
          />
        ))}
      </div>
    </Collapsible>
  );
}

function KnowledgeManager() {
  const { posts, addPost, updatePost, removePost } = useKnowledge();
  const toast = useToast();
  const empty = {
    title: "",
    excerpt: "",
    categorySlug: categories[0].slug,
    author: "",
    publishedAt: "",
    readMinutes: 4,
    image: "",
    body: "",
    tips: "",
  };
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startEdit = (p: (typeof posts)[number]) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      excerpt: p.excerpt,
      categorySlug: p.categorySlug || categories[0].slug,
      author: p.author,
      publishedAt: p.publishedAt?.slice(0, 10) || "",
      readMinutes: p.readMinutes,
      image: p.image,
      body: p.body.join("\n\n"),
      tips: (p.tips ?? []).join("\n"),
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setForm(empty);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast("Add a title");
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      categorySlug: form.categorySlug,
      author: form.author.trim() || "Franschhoek Local",
      publishedAt: form.publishedAt || new Date().toISOString().slice(0, 10),
      readMinutes: Number(form.readMinutes) || 4,
      image: form.image.trim(),
      body: form.body.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean),
      tips: form.tips.split(/\n/).map((s) => s.trim()).filter(Boolean),
    };
    const { error } = editingId ? await updatePost(editingId, payload) : await addPost(payload);
    setSaving(false);
    if (error) return toast(error);
    toast(editingId ? "Guide updated" : "Guide added");
    cancelEdit();
  };

  return (
    <Collapsible icon={BookOpen} title={`Local knowledge (${posts.length})`} subtitle="Write local guides & insider tips for premium members.">
      <form onSubmit={submit} className="space-y-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/5">
        <Field label="Title">
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Where locals actually eat" />
        </Field>
        <Field label="Excerpt">
          <input className="input" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="One-line teaser shown on the card" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select className="input" value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Author">
            <input className="input" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Marieke van Wyk" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Published">
            <input type="date" className="input" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} />
          </Field>
          <Field label="Read minutes">
            <input type="number" min={1} className="input" value={form.readMinutes} onChange={(e) => setForm({ ...form, readMinutes: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label="Cover photo">
          <ImageField value={form.image} onChange={(url) => setForm({ ...form, image: url })} folder="knowledge" />
        </Field>
        <Field label="Body (separate paragraphs with a blank line)">
          <textarea rows={6} className="input resize-none" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write the guide…" />
        </Field>
        <Field label="Insider tips (one per line, optional)">
          <textarea rows={3} className="input resize-none" value={form.tips} onChange={(e) => setForm({ ...form, tips: e.target.value })} placeholder="Book the 10am slot for the quietest tastings" />
        </Field>
        <div className="flex gap-2">
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded-full px-4 py-3 text-sm font-semibold text-muted ring-1 ring-black/10 transition-colors hover:bg-black/5">
              Cancel
            </button>
          )}
          <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-wine py-3 text-sm font-semibold text-white transition-colors hover:bg-wine-soft disabled:opacity-60">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            {saving ? "Saving…" : editingId ? "Save changes" : "Add guide"}
          </button>
        </div>
      </form>

      <div className="mt-3 space-y-2">
        {posts.map((p) => (
          <ManageRow
            key={p.id}
            title={p.title}
            sub={`${p.author} · ${p.readMinutes} min read`}
            thumb={p.image}
            onEdit={() => startEdit(p)}
            onDelete={async () => {
              const { error } = await removePost(p.id);
              if (error) toast(error);
            }}
          />
        ))}
      </div>
    </Collapsible>
  );
}

function VenuesManager() {
  const { venues, updateVenue } = useVenues();
  const toast = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (id: string) => {
    setSaving(true);
    const { error } = await updateVenue(id, { image: image.trim() });
    setSaving(false);
    if (error) return toast(error);
    toast("Photo updated");
    setEditingId(null);
  };

  return (
    <Collapsible icon={MapPinned} title={`Places (${venues.length})`} subtitle="Change the photo shown for any place.">
      <div className="space-y-2">
        {venues.map((v) => {
          const catName = categories.find((c) => c.slug === v.categorySlug)?.name ?? v.categorySlug;
          if (editingId === v.id) {
            return (
              <div key={v.id} className="space-y-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/5">
                <div className="text-sm font-semibold text-ink">{v.name}</div>
                <ImageField value={image} onChange={setImage} folder="venues" />
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className="rounded-full px-4 py-2 text-sm font-semibold text-muted ring-1 ring-black/10 transition-colors hover:bg-black/5">
                    Cancel
                  </button>
                  <button onClick={() => save(v.id)} disabled={saving} className="flex-1 rounded-full bg-wine py-2 text-sm font-semibold text-white transition-colors hover:bg-wine-soft disabled:opacity-60">
                    {saving ? "Saving…" : "Save photo"}
                  </button>
                </div>
              </div>
            );
          }
          return (
            <ManageRow
              key={v.id}
              title={v.name}
              sub={catName}
              thumb={venueImage(v)}
              onEdit={() => {
                setEditingId(v.id);
                setImage(v.image || "");
              }}
            />
          );
        })}
      </div>
    </Collapsible>
  );
}

function DealsManager() {
  const { deals, addDeal, removeDeal } = useDeals();
  const toast = useToast();
  const empty = {
    title: "",
    venue: "",
    categorySlug: categories[0].slug,
    discount: "",
    code: "",
    validUntil: "",
    image: "",
    description: "",
  };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast("Add a deal title");
    setSaving(true);
    const { error } = await addDeal({
      title: form.title.trim(),
      venue: form.venue.trim(),
      categorySlug: form.categorySlug,
      discount: form.discount.trim() || "OFFER",
      description: form.description.trim(),
      code: form.code.trim() || "DEAL",
      validUntil: form.validUntil || new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
      image: form.image.trim() || FALLBACK_DEAL_IMG,
    });
    setSaving(false);
    if (error) return toast(error);
    toast("Deal added");
    setForm(empty);
  };

  return (
    <Collapsible
      icon={Tag}
      title={`Deals (${deals.length})`}
      subtitle="Add deals to the Deals page, or remove ones you don't want."
    >
      <form onSubmit={submit} className="space-y-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/5">
        <Field label="Title">
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="20% off wine tasting flights" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Venue">
            <input className="input" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Boschendal Estate" />
          </Field>
          <Field label="Category">
            <select className="input" value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Badge (e.g. 20% OFF)">
            <input className="input" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="20% OFF" />
          </Field>
          <Field label="Redeem code">
            <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="BOSCH20" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valid until">
            <input type="date" className="input" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
          </Field>
          <Field label="Photo">
            <ImageField value={form.image} onChange={(url) => setForm({ ...form, image: url })} folder="deals" />
          </Field>
        </div>
        <Field label="Description">
          <textarea rows={3} className="input resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's the deal?" />
        </Field>
        <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-full bg-wine py-3 text-sm font-semibold text-white transition-colors hover:bg-wine-soft disabled:opacity-60">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {saving ? "Adding…" : "Add deal"}
        </button>
      </form>

      <div className="mt-3 space-y-2">
        {deals.map((d) => (
          <ManageRow
            key={d.id}
            title={d.title}
            sub={`${d.venue} · ${d.discount} · until ${d.validUntil ? formatValidUntil(d.validUntil) : "—"}`}
            onDelete={async () => {
              const { error } = await removeDeal(d.id);
              if (error) toast(error);
            }}
          />
        ))}
      </div>
    </Collapsible>
  );
}

function GroupsManager() {
  const { groups, addGroup, removeGroup } = useCommunityGroups();
  const toast = useToast();
  const empty = { name: "", categorySlug: categories[0].slug, description: "", inviteUrl: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast("Add a group name");
    if (!/^https:\/\/chat\.whatsapp\.com\//.test(form.inviteUrl.trim())) {
      return toast("Paste a valid WhatsApp invite link (chat.whatsapp.com/…)");
    }
    setSaving(true);
    const { error } = await addGroup({
      name: form.name.trim(),
      categorySlug: form.categorySlug,
      description: form.description.trim(),
      inviteUrl: form.inviteUrl.trim(),
      active: true,
    });
    setSaving(false);
    if (error) return toast(error);
    toast("Group added");
    setForm(empty);
  };

  return (
    <Collapsible
      icon={MessagesSquare}
      title={`Community groups (${groups.length})`}
      subtitle="Public WhatsApp group invite links shown on the Community page."
    >
      <form onSubmit={submit} className="space-y-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/5">
        <Field label="Group name">
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Franschhoek Foodies" />
        </Field>
        <Field label="Category">
          <select className="input" value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="WhatsApp invite link">
          <input className="input" value={form.inviteUrl} onChange={(e) => setForm({ ...form, inviteUrl: e.target.value })} placeholder="https://chat.whatsapp.com/…" />
        </Field>
        <Field label="Description (optional)">
          <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Local food lovers sharing tips & specials" />
        </Field>
        <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-full bg-wine py-3 text-sm font-semibold text-white transition-colors hover:bg-wine-soft disabled:opacity-60">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {saving ? "Adding…" : "Add group"}
        </button>
      </form>

      <div className="mt-3 space-y-2">
        {groups.map((g) => (
          <ManageRow
            key={g.id}
            title={g.name}
            sub={g.inviteUrl}
            onDelete={async () => {
              const { error } = await removeGroup(g.id);
              if (error) toast(error);
            }}
          />
        ))}
      </div>
    </Collapsible>
  );
}
