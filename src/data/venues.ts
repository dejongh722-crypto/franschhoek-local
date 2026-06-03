/** Local venues (real spots). Live data comes from the scraper via Supabase;
 *  this small set is the offline/dev fallback. */

export interface Venue {
  id: string;
  name: string;
  categorySlug: string;
  description: string;
  address: string;
  image: string;
  website: string;
  phone: string;
}

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

/** Tasteful per-category placeholder when a scraped venue has no image. */
const CATEGORY_IMG: Record<string, string> = {
  wineries: img("1506377247377-2a5b3b417ebb"),
  restaurants: img("1517248135467-4c7edcad34c4"),
  coffee: img("1495474472287-4d71bcdd2085"),
  hotels: img("1571896349842-33c89424de2d"),
  art: img("1577720580479-7d839d829c73"),
  adventure: img("1551632811-561732d1e306"),
  padel: img("1554068865-24cecd4e34b8"),
};

export function venueImage(v: Venue): string {
  return v.image || CATEGORY_IMG[v.categorySlug] || CATEGORY_IMG.wineries;
}

export const venues: Venue[] = [
  {
    id: "boschendal-estate",
    name: "Boschendal Estate",
    categorySlug: "wineries",
    description: "Historic wine estate with tastings, farm-to-table dining and oak-lined gardens.",
    address: "Pniel Road, Groot Drakenstein, Franschhoek",
    image: img("1514933651103-005eec06c04b"),
    website: "https://www.boschendal.com",
    phone: "",
  },
  {
    id: "la-petite-ferme",
    name: "La Petite Ferme",
    categorySlug: "restaurants",
    description: "Valley-view restaurant and boutique winery known for its seasonal menu.",
    address: "Pass Road, Franschhoek",
    image: img("1414235077428-338989a2e8c0"),
    website: "",
    phone: "",
  },
  {
    id: "terbodore-coffee",
    name: "Terbodore Roastery",
    categorySlug: "coffee",
    description: "Specialty roaster pouring single-origin coffee in a relaxed garden setting.",
    address: "Le Quartier Français, Franschhoek",
    image: img("1470158499416-75be9aa0c4db"),
    website: "",
    phone: "",
  },
  {
    id: "leopards-leap",
    name: "Leopard's Leap",
    categorySlug: "art",
    description: "Winery, gallery and cookery school with rotating local exhibitions.",
    address: "R45 Main Road, Franschhoek",
    image: img("1531913764164-f85c52e6e654"),
    website: "",
    phone: "",
  },
];

export function getVenueById(id: string | undefined): Venue | undefined {
  return venues.find((v) => v.id === id);
}
