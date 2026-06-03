# Deploying Franschhoek Local

The app is a static Vite SPA backed by Supabase. Recommended host: **Vercel** (free, connects to GitHub, auto-deploys on every push to `main`).

## One-time setup (you, ~5 min)

1. Go to **vercel.com** → sign in with GitHub.
2. **Add New → Project → Import** `dejongh722-crypto/franschhoek-local`.
3. Vercel auto-detects Vite (Build: `npm run build`, Output: `dist`). Leave defaults.
4. Add **Environment Variables** (these are the *publishable* keys — safe in the client):

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://pgdbwgiocqtnfgmxpiot.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_tLaQmBifUqjJgNof1jv12g_KJyQTZSw` |

   ⚠️ Do **not** add `SUPABASE_SECRET_KEY` or `ANTHROPIC_API_KEY` here — those are server-only.
5. **Deploy.** You'll get a URL like `https://franschhoek-local.vercel.app`.

## After the first deploy

- In **Supabase → Authentication → URL Configuration**, set **Site URL** to your Vercel URL and add `<your-url>/update-password` to **Redirect URLs** (so sign-in and password reset work in production).
- SPA deep links (`/events`, `/venues/...`) work via `vercel.json` (rewrites) / `public/_redirects` (Netlify/Cloudflare).

## Known follow-up

- The **Ask-a-Question assistant** calls `/api/...`, which in dev is the local `npm run server`. In production it needs a serverless function (Vercel Function) holding `ANTHROPIC_API_KEY`. The rest of the app works without it. Tracked as a post-launch task.
