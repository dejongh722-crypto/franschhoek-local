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
}

export const categories: Category[] = [
  { slug: "wineries", name: "Wineries", icon: Wine, color: "var(--color-cat-wineries)" },
  { slug: "restaurants", name: "Restaurants", icon: UtensilsCrossed, color: "var(--color-cat-restaurants)" },
  { slug: "coffee", name: "Coffee", icon: Coffee, color: "var(--color-cat-coffee)" },
  { slug: "hotels", name: "Hotels", icon: BedDouble, color: "var(--color-cat-hotels)" },
  { slug: "art", name: "Art", icon: Palette, color: "var(--color-cat-art)" },
  { slug: "adventure", name: "Adventure", icon: Mountain, color: "var(--color-cat-adventure)" },
  { slug: "padel", name: "Padel", icon: LandPlot, color: "var(--color-cat-padel)" },
];

export const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c])) as Record<
  string,
  Category | undefined
>;
