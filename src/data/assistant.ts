/**
 * Built-in help assistant. A lightweight intent-matcher over a curated
 * knowledge base about the app — no backend or API key required.
 * (Can be swapped for a real LLM endpoint later.)
 */

interface Intent {
  keywords: string[];
  answer: string;
}

export const ASSISTANT_WELCOME =
  "Hi! 👋 I'm the Franschhoek Local assistant. Ask me anything about the app — memberships, events, deals, community chat and more.";

export const SUGGESTED_QUESTIONS = [
  "What's included in Premium?",
  "How do I RSVP to an event?",
  "How do deals work?",
  "How much is Premium?",
  "How does community chat work?",
];

const FALLBACK =
  "I'm not totally sure about that one 🤔 — but I can help with memberships, events, deals, community chat and payments. Try asking things like “What's included in Premium?”, “How do I RSVP?” or “How do deals work?”. For anything else, see Profile → Help & support.";

// Ordered most-specific first; ties favour the earlier (more specific) intent.
const intents: Intent[] = [
  {
    keywords: ["hi", "hello", "hey", "howzit", "good morning", "good evening"],
    answer:
      "Hi there! 👋 I'm here to help you get the most out of Franschhoek Local. Ask me about memberships, events, deals or community chat.",
  },
  {
    keywords: ["thank", "thanks", "cheers", "appreciate"],
    answer: "You're welcome! 😊 Anything else you'd like to know about Franschhoek Local?",
  },
  {
    keywords: ["price", "cost", "how much", "r99", "fee", "pricing", "expensive"],
    answer:
      "Premium is R99/month or R990/year (save ~17%). Secure payments via Yoco are coming soon, and you can cancel anytime.",
  },
  {
    keywords: ["cancel", "refund", "unsubscribe", "stop my", "downgrade"],
    answer:
      "You can cancel Premium anytime from the Membership screen — tap “Cancel membership”. You'll keep access until the end of your billing period.",
  },
  {
    keywords: ["upgrade", "go premium", "become premium", "subscribe", "subscription", "get premium"],
    answer:
      "To go Premium: open the Profile tab → tap “Upgrade to Premium” (or any “Go Premium” button) → choose Monthly or Annual → Upgrade. You'll instantly unlock deals, premium events and community chat.",
  },
  {
    keywords: ["benefit", "perk", "include", "what do i get", "premium get", "unlock"],
    answer:
      "Premium unlocks:\n• Local deals & promotions\n• Premium / exclusive events\n• Local knowledge & insider tips\n• Community chat for events you're attending\nUpgrade from the Profile or Membership screen.",
  },
  {
    keywords: ["redeem", "code", "voucher", "coupon", "discount", "deal", "promo", "offer", "saving"],
    answer:
      "Local deals are a Premium perk. In the Deals tab, open a deal, tap “Reveal code”, then show the code at the venue to redeem. Each deal also shows how many days are left before it expires.",
  },
  {
    keywords: ["rsvp", "attend", "sign up", "book", "ticket", "going to"],
    answer:
      "Open the Events tab, tap an event, then “Sign up to attend” to RSVP. You can also tap the heart to save it. Your RSVPs and saved events show up on the Profile tab.",
  },
  {
    keywords: ["save", "saved", "bookmark", "to attend", "heart", "favourite", "favorite"],
    answer:
      "Tap the heart on any event card or detail page to save it. Your saved events appear under “Saved” on the Profile tab.",
  },
  {
    keywords: ["chat", "community", "message", "group", "talk", "discuss"],
    answer:
      "Community chat is for Premium members. There's a General Community room open to all members, plus a chat for each event that has one — join by RSVPing to a chat-enabled event (look for the “Chat” badge). You can react, reply and ask questions there.",
  },
  {
    keywords: ["categor", "padel", "winer", "restaurant", "coffee", "hotel", "art", "adventure"],
    answer:
      "Explore by category: Wineries, Restaurants, Coffee, Hotels, Art, Adventure and Padel. Tap a category on the Home or Events screen to filter what's on.",
  },
  {
    keywords: ["pay", "paystack", "payment", "card", "eft"],
    answer:
      "Payments will be handled securely through Yoco (coming soon), supporting cards and EFT. You can cancel anytime.",
  },
  {
    keywords: ["notif", "alert", "remind"],
    answer:
      "Notifications for new messages and event reminders are coming soon — you'll manage them from Profile → Notifications.",
  },
  {
    keywords: ["account", "profile", "sign in", "log in", "login", "register"],
    answer:
      "The Profile tab shows your membership status, saved and attending events, and settings. Full sign-in and accounts arrive in the next update.",
  },
  {
    keywords: ["free", "difference", "tier", "plan", "membership"],
    answer:
      "There are two memberships:\n• Free — browse events, RSVP and save them.\n• Premium — everything in Free, plus local deals, premium events, insider knowledge and community chat.",
  },
  {
    keywords: ["what is", "about", "what does", "what can", "this app", "franschhoek local"],
    answer:
      "Franschhoek Local helps locals and visitors discover what's on in town — events, exclusive deals and promotions. Free members browse and RSVP to events; Premium adds deals, premium events, local knowledge and community chat.",
  },
  {
    keywords: ["human", "support", "contact", "speak to", "agent", "real person"],
    answer:
      "For anything I can't answer, reach the team via Profile → Help & support. In the meantime I'm happy to help with memberships, events, deals and community chat!",
  },
];

/** Pick the best-matching answer for a question, or a friendly fallback. */
export function getBotReply(question: string): string {
  const q = question.toLowerCase();
  let best: Intent | null = null;
  let bestScore = 0;
  for (const intent of intents) {
    let score = 0;
    for (const k of intent.keywords) if (q.includes(k)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }
  return best && bestScore > 0 ? best.answer : FALLBACK;
}
