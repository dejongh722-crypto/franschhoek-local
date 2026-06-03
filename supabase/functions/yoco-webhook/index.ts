// Supabase Edge Function: receive Yoco payment webhooks and grant Premium.
// Deploy:  supabase functions deploy yoco-webhook --no-verify-jwt
// Secret:  supabase secrets set YOCO_WEBHOOK_SECRET=whsec_...
// Then register the function URL as a webhook in the Yoco dashboard.
//
// Uses the service-role key (auto-injected into edge functions) to update
// profiles, bypassing RLS.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const WEBHOOK_SECRET = Deno.env.get("YOCO_WEBHOOK_SECRET") ?? "";

/** Verify a Svix-style signature (Yoco uses webhook-id / -timestamp / -signature). */
async function verify(req: Request, body: string): Promise<boolean> {
  if (!WEBHOOK_SECRET) return true; // skip if not configured (dev) — set it in production
  try {
    const id = req.headers.get("webhook-id") ?? "";
    const ts = req.headers.get("webhook-timestamp") ?? "";
    const sigHeader = req.headers.get("webhook-signature") ?? "";
    const secretBytes = Uint8Array.from(atob(WEBHOOK_SECRET.split("_")[1] ?? WEBHOOK_SECRET), (c) =>
      c.charCodeAt(0),
    );
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const data = new TextEncoder().encode(`${id}.${ts}.${body}`);
    const mac = await crypto.subtle.sign("HMAC", key, data);
    const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
    // Header is space-separated "v1,<sig>" pairs.
    return sigHeader.split(" ").some((part) => part.split(",")[1] === expected);
  } catch {
    return false;
  }
}

/** Reject webhooks whose timestamp is too old/new — limits replay attacks. */
const REPLAY_TOLERANCE_MS = 3 * 60 * 1000;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const body = await req.text();
  if (!(await verify(req, body))) return new Response("invalid signature", { status: 401 });

  // Replay protection (only meaningful once the signing secret is set).
  if (WEBHOOK_SECRET) {
    const tsMs = Number(req.headers.get("webhook-timestamp") ?? 0) * 1000;
    if (!tsMs || Math.abs(Date.now() - tsMs) > REPLAY_TOLERANCE_MS) {
      return new Response("stale", { status: 400 });
    }
  }

  try {
    const event = JSON.parse(body);
    // Only act on a confirmed successful payment.
    if (event?.type !== "payment.succeeded") return new Response("ignored", { status: 200 });

    const payload = event.payload ?? {};
    const meta = payload.metadata ?? {};
    const userId: string | undefined = meta.userId;
    if (!userId) return new Response("no user", { status: 200 });

    const plan = meta.plan === "annual" ? "annual" : "monthly";
    const eventId: string = event.id ?? req.headers.get("webhook-id") ?? crypto.randomUUID();
    const days = plan === "annual" ? 365 : 30;
    const periodEnd = new Date(Date.now() + days * 86_400_000).toISOString();

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Record the payment first, keyed on the event id so retries are idempotent.
    const { error } = await admin.from("subscriptions").insert({
      event_id: eventId,
      user_id: userId,
      plan,
      status: "active",
      provider: "yoco",
      payment_id: payload.id ?? null,
      checkout_id: meta.checkoutId ?? null,
      current_period_end: periodEnd,
    });
    // 23505 = unique_violation → we've already processed this event; ack and stop.
    if (error) {
      if (error.code === "23505") return new Response("ok (duplicate)", { status: 200 });
      return new Response("db error", { status: 500 });
    }

    // Grant Premium only after the subscription row is safely written.
    await admin.from("profiles").update({ tier: "premium" }).eq("id", userId);

    return new Response("ok", { status: 200 });
  } catch {
    return new Response("error", { status: 500 });
  }
});
