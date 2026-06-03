import express from "express";
import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from the environment (load via `node --env-file=.env`).
const client = new Anthropic();

const MODEL = "claude-opus-4-8";

const SYSTEM = `You are the friendly in-app support assistant for **Franschhoek Local**, a mobile app that helps locals and visitors in Franschhoek, South Africa discover events, local deals and promotions.

You ONLY help with questions about the Franschhoek Local app — what it is, its features, and how to use it.

App facts — answer from these:
- Memberships. Free: browse events, RSVP / sign up, and save events to a "To Attend" list. Premium: everything in Free plus local deals & promotions, premium/exclusive events, local knowledge, and per-event community chat.
- Premium pricing: R99/month or R990/year (save ~17%). Payments are via Yoco (coming soon); cancel anytime. Upgrade from the Profile or Membership screen.
- Events: in the Events tab, open an event and tap "Sign up to attend" to RSVP, or tap the heart to save it. Saved and attending events appear on the Profile tab.
- Deals (Premium): in the Deals tab, open a deal, tap "Reveal code", then show the code at the venue. Each deal shows how many days are left.
- Community chat (Premium): a General Community room open to all members, plus a chat for each event that has one — join by RSVPing to a chat-enabled event (look for the "Chat" badge). This "Ask a Question" assistant is also there.
- Categories: Wineries, Restaurants, Coffee, Hotels, Art, Adventure, Padel.

Behaviour:
- Answer questions about the app directly from the facts above.
- If a question is NOT about the app (general knowledge, current events, weather, specific real-world venue/winery details, directions, anything you'd need the internet for), politely decline in one sentence and steer back — e.g. "I can only help with the Franschhoek Local app — try asking about memberships, events, deals or community chat." Do not attempt to answer off-topic questions.
- Be concise and warm: usually 1–3 sentences. Plain text only (no markdown headings or bullet symbols). Reply with only the final answer — no commentary about your process.
- If it's an app question you genuinely can't answer from the facts above, say so briefly and point them to Profile → Help & support.`;

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/ask", async (req, res) => {
  try {
    const history = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const messages = history
      .filter(
        (m) =>
          (m?.role === "user" || m?.role === "assistant") &&
          typeof m?.content === "string" &&
          m.content.trim(),
      )
      .map((m) => ({ role: m.role, content: m.content }));

    // The conversation must start with a user turn.
    while (messages.length && messages[0].role !== "user") messages.shift();
    if (!messages.length) return res.status(400).json({ error: "no_user_message" });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: SYSTEM,
      messages,
    });

    const reply = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    res.json({ reply: reply || "Sorry, I couldn't find an answer to that." });
  } catch (err) {
    console.error("ask error:", err?.status ?? "", err?.message ?? err);
    res.status(500).json({ error: "assistant_failed" });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Assistant API listening on http://localhost:${PORT}`));
