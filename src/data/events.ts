/** Sample event data — placeholder until Supabase is wired up. */

export interface AppEvent {
  id: string;
  title: string;
  venue: string;
  categorySlug: string;
  /** ISO datetime */
  date: string;
  image: string;
  isPremium: boolean;
  /** "Free" or a price like "R250" */
  price: string;
  /** Whether this event has a community chat (premium + RSVP to join). */
  hasChat: boolean;
  description: string;
}

/** Build an optimized Unsplash URL from a photo id. */
const img = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const events: AppEvent[] = [
  {
    id: "sunset-wine-tasting",
    title: "Sunset Wine Tasting",
    venue: "Boschendal Estate",
    categorySlug: "wineries",
    date: "2026-06-06T18:00:00",
    image: img("1514933651103-005eec06c04b"),
    isPremium: false,
    price: "R250",
    hasChat: true,
    description:
      "Sip your way through a curated flight of estate wines as the sun dips behind the Drakenstein mountains. A sommelier guides you through five vintages paired with artisanal bites.",
  },
  {
    id: "harvest-long-table",
    title: "Harvest Long-Table Lunch",
    venue: "La Petite Ferme",
    categorySlug: "restaurants",
    date: "2026-06-08T12:30:00",
    image: img("1414235077428-338989a2e8c0"),
    isPremium: false,
    price: "R495",
    hasChat: true,
    description:
      "A leisurely four-course long-table feast celebrating the season's harvest, with dishes built around produce from the valley and wines poured to match each course.",
  },
  {
    id: "live-jazz-tapas",
    title: "Live Jazz & Tapas",
    venue: "Leopard's Leap",
    categorySlug: "art",
    date: "2026-06-12T19:00:00",
    image: img("1531913764164-f85c52e6e654"),
    isPremium: true,
    price: "R180",
    hasChat: true,
    description:
      "An intimate evening of live jazz from local musicians, paired with a sharing menu of Mediterranean-inspired tapas. Premium members only — limited seating.",
  },
  {
    id: "cellar-barrel-tasting",
    title: "Cellar Tour & Barrel Tasting",
    venue: "Haute Cabrière",
    categorySlug: "wineries",
    date: "2026-06-13T11:00:00",
    image: img("1533777324565-a040eb52facd"),
    isPremium: true,
    price: "R320",
    hasChat: true,
    description:
      "Go behind the scenes with the winemaker for a tour of the historic cellar, tasting straight from the barrel and learning the craft of méthode cap classique.",
  },
  {
    id: "mountain-trail-morning",
    title: "Mountain Trail Morning",
    venue: "Mont Rochelle Reserve",
    categorySlug: "adventure",
    date: "2026-06-14T07:30:00",
    image: img("1551632811-561732d1e306"),
    isPremium: false,
    price: "Free",
    hasChat: false,
    description:
      "A guided sunrise hike along the Mont Rochelle ridge with sweeping views over the valley. Suitable for moderate fitness levels. Bring water and good shoes.",
  },
  {
    id: "padel-social-doubles",
    title: "Social Doubles Padel Night",
    venue: "Franschhoek Padel Club",
    categorySlug: "padel",
    date: "2026-06-10T17:30:00",
    image: img("1554068865-24cecd4e34b8"),
    isPremium: false,
    price: "R120",
    hasChat: false,
    description:
      "A relaxed mixed-doubles padel social for all levels. Rackets and balls provided, rotating partners every few games, with drinks at the clubhouse afterwards.",
  },
  {
    id: "slow-coffee-workshop",
    title: "Slow Coffee Workshop",
    venue: "Terbodore Roastery",
    categorySlug: "coffee",
    date: "2026-06-07T09:00:00",
    image: img("1470158499416-75be9aa0c4db"),
    isPremium: false,
    price: "R150",
    hasChat: false,
    description:
      "Master the pour-over and learn to taste like a pro in this hands-on workshop with Terbodore's head roaster. Includes a bag of single-origin beans to take home.",
  },
];

export const featuredEvents = events.filter((e) =>
  ["sunset-wine-tasting", "harvest-long-table", "live-jazz-tapas", "cellar-barrel-tasting"].includes(e.id),
);

/** Soonest upcoming events by date. */
export const upcomingEvents = [...events].sort(byDate).slice(0, 3);

export function getEventById(id: string | undefined): AppEvent | undefined {
  return events.find((e) => e.id === id);
}

export function byDate(a: AppEvent, b: AppEvent) {
  return a.date.localeCompare(b.date);
}

const dayFmt = new Intl.DateTimeFormat("en-ZA", { weekday: "short", day: "numeric", month: "short" });
const longDayFmt = new Intl.DateTimeFormat("en-ZA", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const timeFmt = new Intl.DateTimeFormat("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });

export function formatEventDate(iso: string) {
  return dayFmt.format(new Date(iso));
}
export function formatEventDateLong(iso: string) {
  return longDayFmt.format(new Date(iso));
}
export function formatEventTime(iso: string) {
  return timeFmt.format(new Date(iso));
}
/** Short month + day, e.g. { month: "JUN", day: "06" } for date badges. */
export function dateBadge(iso: string) {
  const d = new Date(iso);
  return {
    month: new Intl.DateTimeFormat("en-ZA", { month: "short" }).format(d).toUpperCase(),
    day: new Intl.DateTimeFormat("en-ZA", { day: "2-digit" }).format(d),
  };
}
