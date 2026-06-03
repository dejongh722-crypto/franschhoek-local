import {
  Wine,
  UtensilsCrossed,
  Coffee,
  BedDouble,
  Palette,
  Mountain,
  LandPlot,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  slug: string;
  name: string;
  icon: LucideIcon;
  /** CSS color (uses theme tokens via inline style). */
  color: string;
  /** Fallback photo for cards when an item (e.g. a scraped event/venue) has no image. */
  image: string;
}

const unsplash = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

// Curated per-category photos, matching the set used by venueImage() in data/venues.ts.
export const categories: Category[] = [
  { slug: "wineries", name: "Wineries", icon: Wine, color: "var(--color-cat-wineries)", image: unsplash("1506377247377-2a5b3b417ebb") },
  { slug: "restaurants", name: "Restaurants", icon: UtensilsCrossed, color: "var(--color-cat-restaurants)", image: unsplash("1517248135467-4c7edcad34c4") },
  { slug: "coffee", name: "Coffee", icon: Coffee, color: "var(--color-cat-coffee)", image: unsplash("1495474472287-4d71bcdd2085") },
  { slug: "hotels", name: "Hotels", icon: BedDouble, color: "var(--color-cat-hotels)", image: unsplash("1571896349842-33c89424de2d") },
  { slug: "art", name: "Art", icon: Palette, color: "var(--color-cat-art)", image: unsplash("1577720580479-7d839d829c73") },
  { slug: "adventure", name: "Adventure", icon: Mountain, color: "var(--color-cat-adventure)", image: unsplash("1551632811-561732d1e306") },
  { slug: "padel", name: "Padel", icon: LandPlot, color: "var(--color-cat-padel)", image: unsplash("1554068865-24cecd4e34b8") },
];

export const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c])) as Record<
  string,
  Category | undefined
>;

/** A relevant showcase image for a category, with a wine-country default. */
export function categoryImage(slug?: string): string {
  return categoryBySlug[slug ?? ""]?.image ?? unsplash("1506377247377-2a5b3b417ebb");
}
