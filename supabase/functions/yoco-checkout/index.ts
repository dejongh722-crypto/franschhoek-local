// Supabase Edge Function: create a Yoco hosted checkout for a Premium plan.
// Deploy:  supabase functions deploy yoco-checkout
// Secret:  supabase secrets set YOCO_SECRET_KEY=sk_live_or_test_...
//
// The browser calls this via supabase.functions.invoke("yoco-checkout", { body }),
// which forwards the user's auth token so we can tie the payment to their account.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const YOCO_SECRET_KEY = Deno.env.get("YOCO_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Plan → amount in cents (ZAR). Annual = 12 × monthly, less 15%.
const PLANS: Record<string, { amount: number; label: string }> = {
  monthly: { amount: 1999, label: "Premium (monthly)" },
  annual: { amount: 20390, label: "Premium (annual)" },
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (!YOCO_SECRET_KEY) return json({ error: "yoco_not_configured" }, 400);

    const { plan, origin } = await req.json();
    const selected = PLANS[plan];
    if (!selected) return json({ error: "invalid_plan" }, 400);

    // Identify the signed-in user from their forwarded JWT.
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: userData } = await sb.auth.getUser(token);
    const user = userData.user;
    if (!user) return json({ error: "not_authenticated" }, 401);

    const base = (origin as string) || "https://localhost";

    // Yoco Online Checkout API (https://payments.yoco.com/api/checkouts).
    // The Idempotency-Key guards against duplicate checkouts if this POST is retried.
    const res = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${YOCO_SECRET_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        amount: selected.amount,
        currency: "ZAR",
        successUrl: `${base}/membership?status=success`,
        cancelUrl: `${base}/membership?status=cancelled`,
        failureUrl: `${base}/membership?status=failed`,
        // Carried through into the payment.succeeded webhook (payload.metadata),
        // so the webhook can grant Premium to the right user.
        metadata: { userId: user.id, plan, kind: "premium_subscription" },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data?.redirectUrl) {
      return json({ error: "checkout_failed", detail: data }, 502);
    }
    return json({ redirectUrl: data.redirectUrl, checkoutId: data.id });
  } catch {
    return json({ error: "server_error" }, 500);
  }
});
