# Franschhoek Local — Project Plan

> Working planning doc. Living document — we update it as decisions are made.
> Last updated: 2026-06-02

---

## 1. Vision

A mobile-first web app that gives **locals and tourists in Franschhoek** access to **events, deals, and promotions** around town. It's the single place to discover what's happening, find local offers, and (for premium members) tap into community knowledge and per-event chat.

**One-liner:** *Discover Franschhoek — events, local deals, and the community behind them.*

---

## 2. Target users

- **Tourists** — visiting wine country, want to know what's on and where to go.
- **Locals** — want ongoing access to deals, events, and community.
- *(Later)* **Businesses** — wineries, restaurants, etc. that post events/deals.

---

## 3. Membership tiers

| Capability | Free | Premium (subscription) |
|---|:---:|:---:|
| Browse events | ✅ | ✅ |
| Sign up / RSVP to events | ✅ | ✅ |
| Save events to "To Attend" | ✅ | ✅ |
| **Local deals & promotions** | ❌ | ✅ |
| **Premium / exclusive events** | ❌ | ✅ |
| **Local knowledge / insider content** | ❌ | ✅ |
| **Per-event community chat** | ❌ | ✅ |

**Free** = lead-gen + value taster. **Premium** = recurring subscription (Yoco), unlocks deals, premium events, knowledge, and community chat.

---

## 4. Core features

1. **Discover home** — hero + category tiles (Wineries, Restaurants, Coffee, Hotels, Art, Adventure).
2. **Events** — list/detail, filter by category/date, RSVP, save to "To Attend", capacity.
3. **Deals & promotions** *(premium)* — local offers, discount codes, validity windows.
4. **Local knowledge** *(premium)* — curated insider content/guides.
5. **Per-event community chat** *(premium)* — realtime chat scoped to each event.
6. **Memberships & billing** — upgrade flow, Yoco subscription, manage/cancel.
7. **Profile** — saved events, RSVPs, membership status, settings.

---

## 5. UI / UX direction

Reference: `D:\Daniel\Pictures\New folder\UI Claude Code.png`

- **Minimalist**, clean white background, generous whitespace.
- **Warm earthy palette** — wine reds/maroons, ambers, sage greens. (Tokens TBD.)
- **Hero** with full-bleed vineyard image + overlay text + primary CTA (amber).
- **Rounded colored category tiles** with simple icons.
- **Bottom tab bar** navigation (mobile-first).
- Card-based listings, soft shadows, rounded corners.

**Proposed bottom nav:** Home · Events · Deals · Community · Profile

---

## 6. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | **React + Vite + TypeScript** | Fast, matches Base44 origin |
| Styling | **Tailwind CSS** | + small token layer for the palette |
| UI components | **shadcn/ui** (Radix) | Accessible, minimal, easy to theme |
| Routing | React Router | |
| State/data | **TanStack Query** + Supabase client | Caching, realtime |
| Backend | **Supabase** | Postgres, Auth, Realtime (chat), Storage, RLS |
| Payments | **Yoco** | Recurring subscriptions, SA-friendly |
| PWA | Vite PWA plugin | Installable, offline shell |
| Native (later) | **Capacitor** | Wrap the web app for Play Store / App Store, no rewrite |

---

## 7. Data model (Supabase — first pass)

- **profiles** — `id` (→ auth.users), `full_name`, `avatar_url`, `user_type` (local/tourist), `membership_tier` (free/premium), `created_at`
- **subscriptions** — `id`, `user_id`, `paystack_subscription_code`, `paystack_customer_code`, `plan`, `status`, `current_period_end`, `created_at`
- **categories** — `id`, `name`, `slug`, `icon`, `color`
- **venues** — `id`, `name`, `category_id`, `description`, `address`, `lat`, `lng`, `image_url`, `contact`
- **events** — `id`, `title`, `description`, `venue_id`, `category_id`, `start_at`, `end_at`, `image_url`, `capacity`, `is_premium`, `price`, `created_by`, `created_at`
- **event_attendees** — `id`, `event_id`, `user_id`, `status` (attending/saved), `created_at`
- **deals** — `id`, `title`, `description`, `venue_id`, `discount`, `code`, `valid_from`, `valid_to`, `image_url` *(premium-gated)*
- **knowledge_posts** — `id`, `title`, `body`, `image_url`, `category_id`, `published_at` *(premium-gated)*
- **event_messages** — `id`, `event_id`, `user_id`, `body`, `created_at` *(premium-gated, realtime)*

**Access control via RLS:** everyone reads events; deals/knowledge/event_messages require `membership_tier = 'premium'`. Chat insert requires premium **and** (optionally) RSVP to that event.

---

## 8. App structure (routes)

```
/                 Home (discover)
/events           Events list
/events/:id       Event detail (RSVP, save, chat tab if premium)
/deals            Deals (premium gate)
/knowledge        Local knowledge (premium gate)
/community        Community / my events chats (premium)
/profile          Profile, saved, membership
/membership       Upgrade / manage subscription
/auth             Sign in / sign up
```

---

## 9. Roadmap (phased)

### Phase 0 — Foundation
- [x] Scaffold Vite + React + TS + Tailwind (shadcn/ui to layer in when building forms/dialogs)
- [x] Design tokens (palette, typography, spacing) from reference UI
- [x] App shell: bottom nav, routing, layout, home page + category tiles
- [ ] Supabase project + client + env config

> **Env note:** npm installs require `NODE_OPTIONS=--use-system-ca` on this machine (proxy/AV intercepts TLS). Consider an `.npmrc`.
> **Asset note:** hero uses a gradient placeholder; drop `public/hero.jpg` for the real vineyard photo.

### Phase 1 — Auth & profiles
- [ ] Sign up / sign in (Supabase Auth)
- [ ] `profiles` table + onboarding (local vs tourist)
- [ ] Profile screen

### Phase 2 — Events (Free tier core)
- [x] Events list + detail UI
- [x] Categories + filtering (URL-synced; deep-linkable from Home tiles)
- [x] RSVP + "To Attend" save (client-side via context + localStorage; swap to Supabase later)
- [x] Home / discover page (hero, search, category rail, featured carousel, premium banner, happening-soon)

> Premium gating is wired in the UI via `src/config.ts` `CURRENT_TIER` (hard-coded). Replace with the real profile tier when auth lands.
> Sample data lives in `src/data/events.ts`. Detail route `/events/:id` reads from it.

### Admin & promotions
- [x] Admin dashboard (`/admin`) — metrics (users, MRR, all-time revenue, conversion, ARPU, revenue chart) + promotions manager (create / pause / delete). Metrics are sample analytics until Supabase/Yoco are connected.
- [x] Admin **events & deals managers** — add/delete events and deals from `/admin`; they render on the Events/Deals pages. Backed by Supabase `events`/`deals` tables (public read, admin write), seeded with the samples; stores `src/store/events.tsx` + `src/store/deals.tsx` (local fallback). All write actions surface a clear error if RLS blocks them.
- [x] **Venues directory** — `/venues` (+ `/venues/:id` detail) lists real local spots from the scraper's `venues` table, filtered by category + search; Home category tiles open it (`/venues?category=…`) and Home shows a "Local spots" rail. Store `src/store/venues.tsx`, page mirrors Deals. Surfaces the scraped wineries/restaurants/coffee/hotels/art/adventure/padel.
- [x] In-app promotion pop-ups (`PromoPopup`) — audience-targeted (all/free/premium), dismissible & persisted. Store: `src/store/promotions.tsx`.
- [x] Home "Spotlight" rail (`PromoCarousel`) — permanent featured slot for live, audience/schedule-filtered promotions; hides when none are live.
- [x] Promotion performance & client reports — track promo **clicks** + attributed **sign-ups** (`promotion_events` table, anon-insert / admin-read RLS; 30-day click→signup attribution via `src/lib/promoMetrics.ts`). Admin "Promotion performance" section shows clicks/sign-ups/conversion per promo and a **Send report** modal (email / share / copy / CSV) so a business sees what it paid for.

### Phase 3 — Premium content
- [x] Deals & promotions (list + detail page, category grid filter, search, reveal-code & copy, directions, terms; sample data in `src/data/deals.ts`)
- [x] Local knowledge — premium insider guides (list + featured + category filter + search; article detail with insider tips; teaser-gated for free tier). Sample data in `src/data/knowledge.ts`; surfaced on Home + deep-linkable at `/knowledge`. Pages: `Knowledge`, `KnowledgeDetail`.
- [x] Premium gating — UI gate done (`DealsLocked`, `KnowledgeLocked`, driven by `useMembership`); RLS to follow with Supabase

### Phase 4 — Memberships & billing
- [x] Membership page (`/membership`) — benefits, monthly/annual plan picker, upgrade & cancel
- [x] Live tier state — `useMembership` store (persisted), drives all premium gates app-wide
- [x] Yoco integration — code-complete: `yoco-checkout` (hosted checkout + Idempotency-Key) and `yoco-webhook` (`payment.succeeded`, signature + replay verify, event-id dedupe → grants Premium & writes `subscriptions`). Goes live once `YOCO_SECRET_KEY` / `YOCO_WEBHOOK_SECRET` are set and the functions are deployed. Dev without a key falls back to a local upgrade.
- [x] Real plan pricing — **R19.99/mo, R203.90/yr** (annual = 15% off). Set in `yoco-checkout` PLANS (cents) and the Membership UI.
- [x] iOS/Android pay-on-web — native apps route "Upgrade" to the web checkout in the external browser (`isNativePlatform` + `WEB_APP_URL`), so payment is processed by Yoco off Apple/Google IAP (no store commission). Set `VITE_PUBLIC_WEB_URL` to the real domain.

### Backend (Supabase) progress
- [x] Auth (email sign-in/up), `profiles` table + RLS, sign-in screen, profile sync (name/avatar/tier ⇄ DB)
- [x] Cloud promotions — admin writes & in-app pop-ups read from Supabase (`promotions` table, realtime, admin-only RLS); local fallback
- [x] Realtime community chat — `messages` table + Supabase Realtime; seeded convo + local fallback
- [x] Admin users list pulls real `profiles`
- [ ] Real revenue/metrics (Yoco) · move events/deals to Supabase · push notifications

### Phase 5 — Community chat
- [x] Community tab — premium gate, General room (open to all members), your-event-chats list (only `hasChat` events you're attending), simple 3-step guidance
- [x] Events carry a `hasChat` flag; "Chat" badge on event cards; chat card only shows on chat-enabled events
- [x] Per-event chat thread (full-screen) with composer; gated Premium + RSVP'd
- [x] Premium chat attributes: reactions, reply/quote, quick replies, pinned host announcement, verified host badges, attendee presence (avatar stack + going/online), typing indicator + simulated attendee replies, read receipts, message grouping
- [x] Local chat store (seeded + persisted, reactions overlay) — `src/store/chat.tsx`
- [x] "Ask a Question" help assistant — real **Claude Opus 4.8 + web search** via a backend proxy (`server/index.mjs`, Express, key in gitignored `.env`); offline FAQ matcher (`src/data/assistant.ts`) as fallback. Run with `npm run server` (Vite proxies `/api`). Port to a Supabase Edge Function for production.
- [ ] Swap to Supabase Realtime for live multi-user chat
- [ ] Moderation basics

### Phase 6 — Polish & ship
- [ ] PWA install, offline shell, icons/splash
- [ ] Performance, accessibility, empty/loading states
- [ ] (Later) Capacitor wrap → Play Store / App Store

---

## 10. Decisions made

- ✅ **Content authoring:** Admin-only to start (simple admin area). Later: an automated **scraper/ingestion** pipeline to pull in promotions/events automatically.
- ✅ **Chat gating:** Premium **and** RSVP'd to that event.
- ✅ **First build step:** Scaffold + UI shell (home + bottom nav) from the reference design.

### Still open
- [ ] **Premium price point** & billing cycle (monthly/annual)?
- [ ] **Maps** — do we need a map view of venues? (Google Maps / Mapbox)
- [ ] **Content seeding** — initial events/deals sample data.
- [ ] Brand assets — logo, exact hex palette, fonts.
- [x] **Scraper** — `server/scraper.mjs` aggregates real venues/events/deals (+ public WhatsApp group invite links) per category from a curated source list (`server/sources.mjs`). Hybrid extraction: schema.org JSON-LD first, Claude (Haiku) fallback. Respects robots.txt, rate-limits, dedupes by stable id, auto-publishes via the service-role key. Runs every 4h via `.github/workflows/scrape.yml` (or `npm run scrape`). Writes `venues`/`community_groups` tables + provenance columns on `events`/`deals`; logs to `scrape_runs` (surfaced in Admin → Content scraper). **Owner must curate `sources.mjs` with permitted URLs.** WhatsApp *chat* scraping intentionally not done (private/ToS) — only openly-posted invite links.

---

## 11. Notes

- Starting **fresh** (not importing Base44 code); the Base44 app and reference image guide the design.
- Web-first; native via Capacitor when ready for stores.
