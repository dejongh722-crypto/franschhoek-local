/** Sample deal data — placeholder until Supabase is wired up. Premium-gated. */

export interface Deal {
  id: string;
  title: string;
  venue: string;
  categorySlug: string;
  /** Short badge text, e.g. "20% OFF", "2-for-1". */
  discount: string;
  description: string;
  /** Redemption code, when the offer has one. Empty for "book direct" offers. */
  code: string;
  /** ISO date the deal is valid until. Empty when not known. */
  validUntil: string;
  image: string;
  /** The venue's own offer page (scraped deals), used for "View offer". */
  sourceUrl?: string;
}

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const deals: Deal[] = [
  {
    id: "boschendal-tasting-20",
    title: "20% off wine tasting flights",
    venue: "Boschendal Estate",
    categorySlug: "wineries",
    discount: "20% OFF",
    description:
      "Enjoy 20% off any tasting flight at the estate, Monday to Friday. Includes the premium and reserve selections.",
    code: "BOSCH20",
    validUntil: "2026-06-30",
    image: img("1514933651103-005eec06c04b"),
  },
  {
    id: "petite-ferme-2for1",
    title: "2-for-1 main courses",
    venue: "La Petite Ferme",
    categorySlug: "restaurants",
    discount: "2-FOR-1",
    description:
      "Buy one main course and get the second free, available Tuesday to Thursday for lunch. Excludes set menus.",
    code: "DINE241",
    validUntil: "2026-07-15",
    image: img("1414235077428-338989a2e8c0"),
  },
  {
    id: "terbodore-free-pastry",
    title: "Free pastry with any coffee",
    venue: "Terbodore Roastery",
    categorySlug: "coffee",
    discount: "FREE PASTRY",
    description: "Get a complimentary fresh-baked pastry with any specialty coffee, all day, every day.",
    code: "BREWTREAT",
    validUntil: "2026-06-20",
    image: img("1470158499416-75be9aa0c4db"),
  },
  {
    id: "spa-30-off",
    title: "30% off spa treatments",
    venue: "Le Franschhoek Hotel & Spa",
    categorySlug: "hotels",
    discount: "30% OFF",
    description:
      "Save 30% on all signature spa treatments booked before noon. The perfect wine-country wind-down.",
    code: "SPA30",
    validUntil: "2026-08-01",
    image: img("1540541338287-41700207dee6"),
  },
  {
    id: "padel-half-price",
    title: "Half-price off-peak court hire",
    venue: "Franschhoek Padel Club",
    categorySlug: "padel",
    discount: "50% OFF",
    description: "Book any off-peak court (before 4pm on weekdays) at half price. Racket hire included.",
    code: "PADEL50",
    validUntil: "2026-07-01",
    image: img("1554068865-24cecd4e34b8"),
  },
  {
    id: "leopards-leap-prints",
    title: "Buy 2 get 1 free gallery prints",
    venue: "Leopard's Leap Gallery",
    categorySlug: "art",
    discount: "3-FOR-2",
    description: "Purchase any two limited-edition local artist prints and receive a third of equal value free.",
    code: "ART3FOR2",
    validUntil: "2026-06-25",
    image: img("1531913764164-f85c52e6e654"),
  },
];

export function getDealById(id: string | undefined): Deal | undefined {
  return deals.find((d) => d.id === id);
}

const validFmt = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" });

export function formatValidUntil(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : validFmt.format(d);
}

/** Whole days from today until the given date (0 = today, negative = past).
 *  Returns Infinity for an unknown/empty date so it never reads as "urgent". */
export function daysUntil(iso: string): number {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return Infinity;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfDay(target) - startOfDay(new Date())) / 86_400_000);
}

/** True when a deal has a known end date that has already passed.
 *  Deals without an end date (book-direct offers) are never "expired". */
export function isDealExpired(iso: string): boolean {
  const d = daysUntil(iso);
  return Number.isFinite(d) && d < 0;
}

/** Short urgency label, e.g. "Ends today", "1 day left", "12 days left".
 *  Empty string when there's no known end date. */
export function daysLeftLabel(iso: string): string {
  const d = daysUntil(iso);
  if (!Number.isFinite(d)) return "";
  if (d <= 0) return "Ends today";
  if (d === 1) return "1 day left";
  return `${d} days left`;
}
