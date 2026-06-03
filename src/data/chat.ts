/** Sample chat data — seeded conversations until Supabase Realtime is wired up. */

export type Reactions = Record<string, string[]>; // emoji -> author ids

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  /** CSS color for the author's avatar. */
  authorColor: string;
  body: string;
  /** ISO datetime */
  at: string;
  /** "host" messages get a verified badge and accent styling. */
  role?: "host" | "member";
  /** Pinned host announcement shown in the sticky bar. */
  pinned?: boolean;
  /** Id of the message this one is replying to. */
  replyToId?: string;
  reactions?: Reactions;
}

/** The current (placeholder) user until auth lands. */
export const ME = { id: "me", name: "You", color: "var(--color-wine)" };

/** The general community room — open to all premium members (no RSVP needed). */
export const GENERAL_ID = "general";
export const GENERAL_HOST = "Franschhoek Local";

const authors = [
  { id: "thandi", name: "Thandi M.", color: "#c2410c" },
  { id: "james", name: "James K.", color: "#3c7a8c" },
  { id: "sophie", name: "Sophie R.", color: "#7c5cbf" },
];

/** Emojis offered in the reaction picker. */
export const REACTION_EMOJIS = ["👍", "❤️", "🎉", "🔥", "😍", "🙌"];

/** Tappable suggested replies above the composer. */
export const QUICK_REPLIES = [
  "Can't wait! 🎉",
  "See you there 👋",
  "Anyone carpooling?",
  "What's the dress code?",
];

/** Canned attendee responses used to simulate a live chat. */
export const AUTO_REPLIES = [
  "Love that! 😄",
  "Totally agree 🙌",
  "Same here — counting down the days.",
  "Good shout, noted 👍",
  "This is going to be special.",
];

/** Attendee presence shown in the header. */
export const ATTENDEES = [
  { name: "Thandi M.", color: "#c2410c" },
  { name: "James K.", color: "#3c7a8c" },
  { name: "Sophie R.", color: "#7c5cbf" },
  { name: "Marco D.", color: "#3c8c5a" },
  { name: "Aisha P.", color: "#b07a3c" },
];
export const GOING_COUNT = 24;
export const ONLINE_COUNT = 6;

/**
 * Deterministic seed conversation for an event. Stable across renders so the
 * preview/last-message stays consistent. Real-time messages append on top.
 */
export function seedMessages(eventId: string, hostName = "The host"): ChatMessage[] {
  const host = { id: "host", name: hostName, color: "var(--color-wine)" };
  const id = (i: number) => `${eventId}-seed-${i}`;

  if (eventId === GENERAL_ID) {
    return [
      {
        id: id(0),
        authorId: host.id,
        authorName: GENERAL_HOST,
        authorColor: host.color,
        role: "host",
        pinned: true,
        body: "Welcome to the Franschhoek Local community! 👋 This is the place to ask anything, share tips and meet fellow members. Be kind and have fun.",
        at: "2026-06-01T09:00:00",
        reactions: { "❤️": ["thandi", "james", "sophie"], "🙌": ["james"] },
      },
      {
        id: id(1),
        authorId: authors[2].id,
        authorName: authors[2].name,
        authorColor: authors[2].color,
        role: "member",
        body: "Hi everyone! Just moved to the valley — any must-visit wineries for a first-timer?",
        at: "2026-06-01T10:12:00",
      },
      {
        id: id(2),
        authorId: authors[1].id,
        authorName: authors[1].name,
        authorColor: authors[1].color,
        role: "member",
        replyToId: id(1),
        body: "Welcome! Start with the smaller estates up the pass — quieter and stunning views.",
        at: "2026-06-01T10:25:00",
        reactions: { "👍": ["thandi", "sophie"] },
      },
      {
        id: id(3),
        authorId: authors[0].id,
        authorName: authors[0].name,
        authorColor: authors[0].color,
        role: "member",
        body: "Anyone keen for a Saturday morning market meet-up? ☕",
        at: "2026-06-01T11:40:00",
        reactions: { "🎉": ["james"] },
      },
    ];
  }

  return [
    {
      id: id(0),
      authorId: host.id,
      authorName: host.name,
      authorColor: host.color,
      role: "host",
      pinned: true,
      body: "Welcome to the official chat for this event! 🍷 Drop any questions here — our team is around to help. See you soon.",
      at: "2026-06-02T08:00:00",
      reactions: { "🎉": ["thandi", "james", "sophie"], "❤️": ["sophie"] },
    },
    {
      id: id(1),
      authorId: authors[0].id,
      authorName: authors[0].name,
      authorColor: authors[0].color,
      role: "member",
      body: "So excited for this one! Anyone been before?",
      at: "2026-06-02T08:15:00",
      reactions: { "👍": ["james", "sophie"] },
    },
    {
      id: id(2),
      authorId: authors[1].id,
      authorName: authors[1].name,
      authorColor: authors[1].color,
      role: "member",
      body: "Went last season — it's brilliant. Get there a little early for parking.",
      at: "2026-06-02T08:22:00",
    },
    {
      id: id(3),
      authorId: authors[2].id,
      authorName: authors[2].name,
      authorColor: authors[2].color,
      role: "member",
      replyToId: id(0),
      body: "Thanks for setting this up 🙌 Can I bring a friend who hasn't RSVP'd?",
      at: "2026-06-02T08:40:00",
    },
    {
      id: id(4),
      authorId: host.id,
      authorName: host.name,
      authorColor: host.color,
      role: "host",
      body: "Of course — tickets at the door if there's space. Parking opens at 17:00.",
      at: "2026-06-02T09:05:00",
      reactions: { "🔥": ["thandi"] },
    },
  ];
}

const timeFmt = new Intl.DateTimeFormat("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });

export function formatChatTime(iso: string) {
  return timeFmt.format(new Date(iso));
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
