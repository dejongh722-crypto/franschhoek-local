// Supabase Edge Function: the app-only "Ask a Question" assistant (Claude).
// Deploy:  supabase functions deploy ask
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Runs on Deno (Supabase edge runtime) — not part of the Vite build.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const SYSTEM = `You are the friendly in-app support assistant for **Franschhoek Local**, a mobile app that helps locals and visitors in Franschhoek, South Africa discover events, local deals and promotions.

You ONLY help with questions about the Franschhoek Local app — what it is, its features, and how to use it.

App facts:
- Free members: browse events, RSVP / sign up, and save events to a "To Attend" list. Premium: everything in Free plus local deals & promotions, premium/exclusive events, local knowledge, and per-event community chat.
- Premium pricing: R99/month or R990/year (save ~17%). Payments via Yoco (coming soon); cancel anytime.
- Events: in the Events tab, open an event and tap "Sign up to attend" to RSVP, or tap the heart to save it.
- Deals (Premium): in the Deals tab, open a deal, tap "Reveal code", show it at the venue.
- Community chat (Premium): a General Community room open to all members, plus a chat per event that has one — join by RSVPing to a chat-enabled event ("Chat" badge).
- Categories: Wineries, Restaurants, Coffee, Hotels, Art, Adventure, Padel.

Behaviour:
- Answer app questions from the facts above.
- If a question is NOT about the app, politely decline in one sentence and steer back to app topics.
- Be concise and warm (1–3 sentences), plain text only, final answer only.`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { messages } = await req.json();
    const clean = (Array.isArray(messages) ? messages : [])
      .filter(
        (m: { role?: string; content?: string }) =>
          (m?.role === "user" || m?.role === "assistant") &&
          typeof m?.content === "string" &&
          m.content.trim(),
      )
      .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));

    while (clean.length && clean[0].role !== "user") clean.shift();
    if (!clean.length) return json({ error: "no_user_message" }, 400);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 600,
        system: SYSTEM,
        messages: clean,
      }),
    });

    const data = await res.json();
    const reply = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n")
      .trim();

    return json({ reply: reply || "Sorry, I couldn't find an answer to that." });
  } catch {
    return json({ error: "assistant_failed" }, 500);
  }
});
