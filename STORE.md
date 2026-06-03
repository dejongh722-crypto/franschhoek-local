# Shipping Franschhoek Local — Web (PWA) + App Stores

The app is a **Vite + React web app**, made **installable as a PWA**, and packaged for the
**Play Store / App Store** with **Capacitor** (the web app runs inside a native shell — no rewrite).

---

## 1. Prerequisites

| Target | You need |
|---|---|
| Web / PWA | Just a static host (Vercel, Netlify, Cloudflare Pages, or Supabase Hosting) |
| Android | **Android Studio** (+ a Google **Play Console** account, US$25 one-time) |
| iOS | A **Mac with Xcode** (+ an **Apple Developer** account, US$99/yr) |

Build config: `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_PUBLIC_WEB_URL` must be set
at **build time** (they're bundled). Keep `SUPABASE_SECRET_KEY` and `ANTHROPIC_API_KEY` **server-side only**.

> **Pay on the web (no app-store cut):** the native apps don't sell Premium in-app. The "Upgrade"
> button opens `VITE_PUBLIC_WEB_URL/membership` in the **external browser**, where Yoco processes the
> payment — so Apple/Google take **no commission**. Make sure `VITE_PUBLIC_WEB_URL` points at the live
> web deployment before building the native apps.

---

## 2. Backend (do this before store builds)

- **Supabase** is already cloud — works from web & native. Run `supabase/schema.sql`.
- **Edge Functions** (Supabase CLI — `npm i -g supabase`, then `supabase login` + `supabase link`):
  ```bash
  supabase functions deploy ask
  supabase functions deploy yoco-checkout
  supabase functions deploy yoco-webhook --no-verify-jwt
  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
  supabase secrets set YOCO_SECRET_KEY=sk_test_or_live_...
  supabase secrets set YOCO_WEBHOOK_SECRET=whsec_...
  ```
  The assistant calls `ask` in production automatically (local dev still uses `server/index.mjs`).

### Yoco payments
1. Create a Yoco account → get your **secret key** (test then live).
2. Deploy the two functions above and set `YOCO_SECRET_KEY`.
3. In the Yoco dashboard, add a **webhook** pointing at the deployed `yoco-webhook` URL
   (`https://<project>.supabase.co/functions/v1/yoco-webhook`); copy its signing secret into
   `YOCO_WEBHOOK_SECRET`.
4. Tapping **Upgrade to Premium** (on the web) redirects to Yoco's hosted checkout; on success the
   `payment.succeeded` webhook sets the user's `tier = premium` and records a row in `subscriptions`.
   - Prices are **R19.99/mo** and **R203.90/yr** (cents in `yoco-checkout` `PLANS`).
   - The webhook verifies the **signature + timestamp** and dedupes on the event id (unique
     `subscriptions.event_id`), so retries can't double-grant or double-insert.
   - Yoco Checkout is **one-time**; this grants Premium for the period (30/365 days via
     `current_period_end`). Recurring auto-renewal (re-charging stored cards on a schedule) is a
     follow-up — wire a scheduled job or Yoco recurring API when ready.

---

## 3. Web / PWA

```bash
npm run build           # outputs dist/ (includes manifest.webmanifest + sw.js + icons)
npm run preview         # smoke-test the production build locally
```

Deploy `dist/` to any static host. **Important:** add an SPA fallback so deep links work —
rewrite all routes to `/index.html` (Netlify `_redirects: /* /index.html 200`, Vercel rewrites, etc.).
Once hosted over HTTPS the app is **installable** (Add to Home Screen) and works offline.

---

## 4. Android (Capacitor)

```bash
npx cap add android        # one-time: creates the android/ project
npm run cap:android        # builds web, syncs, opens Android Studio
```

In Android Studio: **Build → Generate Signed Bundle/APK → Android App Bundle (.aab)** with a new
keystore (keep it safe — you need it for every update). Then in **Play Console**: create the app,
upload the `.aab`, fill the listing, and submit for review.

---

## 5. iOS (Capacitor — needs a Mac)

```bash
npx cap add ios            # one-time
npm run cap:ios            # builds web, syncs, opens Xcode
```

In Xcode: set the **Team/signing**, then **Product → Archive → Distribute App** to
**App Store Connect**. Create the app there, attach the build, fill the listing, submit.

---

## 6. App icons & splash (native)

The PWA uses `public/icon.svg`. For native stores you want **PNGs**:

```bash
# Put a 1024x1024 icon.png (and optional splash) in ./resources, then:
npm i -D @capacitor/assets
npx capacitor-assets generate    # generates all Android/iOS icon + splash sizes
```

(Export `public/icon.svg` to a 1024px PNG first — any image tool or an online SVG→PNG converter.)

---

## 7. Store listing checklist

- [ ] App name, short + full description, keywords
- [ ] **Privacy policy URL** (required by both stores — we collect email/auth, so this is mandatory)
- [ ] Screenshots (phone sizes; both stores have required dimensions)
- [ ] Feature graphic (Play), promotional text (App Store)
- [ ] Content rating / age questionnaire
- [ ] Data-safety / privacy nutrition labels (declare: email, usage, user content/chat)
- [ ] Support email + website
- [ ] `appId` set to your real reverse-domain (currently `com.franschhoeklocal.app`)

---

## 8. Things to wire before public launch

- Real **Yoco** subscription flow (payments) + revenue metrics.
- Host the **assistant API** (or Edge Function).
- **Push notifications** (Capacitor Push / web push) if you want re-engagement.
- Make `ADMIN_ENABLED` gate on the real `is_admin` profile flag (lock the admin area).
