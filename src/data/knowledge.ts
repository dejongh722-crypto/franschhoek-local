/** Sample local-knowledge content — placeholder until Supabase is wired up. Premium-gated. */

export interface KnowledgePost {
  id: string;
  title: string;
  /** One-line teaser shown on cards. */
  excerpt: string;
  categorySlug: string;
  author: string;
  /** ISO date the guide was published. */
  publishedAt: string;
  /** Estimated read time in minutes. */
  readMinutes: number;
  image: string;
  /** Article body, one entry per paragraph. */
  body: string[];
  /** Optional quick "insider tips" rendered as a highlighted list. */
  tips?: string[];
}

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const knowledgePosts: KnowledgePost[] = [
  {
    id: "best-time-wine-tasting",
    title: "When to taste: beating the crowds at the estates",
    excerpt: "The locals' calendar for quiet cellars, golden light and unhurried pours.",
    categorySlug: "wineries",
    author: "Marieke van Wyk",
    publishedAt: "2026-05-28",
    readMinutes: 4,
    image: img("1506377247377-2a5b3b417ebb"),
    body: [
      "Franschhoek's estates are busiest between 11am and 2pm, when tour buses and lunch crowds converge. If you want the cellar to yourself, aim for the first tasting slot of the day — most open at 10am and the staff are fresh, generous and happy to chat.",
      "Mid-week is your friend. Tuesday to Thursday sees a fraction of the weekend traffic, and many estates quietly pour an extra splash of their reserve range when it's quiet. Avoid public holidays and the Bastille weekend in July unless you love a festival buzz.",
      "Late afternoon — around 4pm — is the locals' secret. The light over the vineyards turns gold, the day-trippers have left, and you can linger on the terrace as the mountains change colour. Many cellars take their last tasting at 4:30pm, so call ahead.",
    ],
    tips: [
      "Book the 10am slot for the quietest, most generous tastings.",
      "Tuesday–Thursday beats any weekend for space and attention.",
      "4pm gives you golden-hour views with the crowds gone.",
    ],
  },
  {
    id: "where-locals-actually-eat",
    title: "Where locals actually eat (not just the famous names)",
    excerpt: "Beyond the white-tablecloth institutions — the spots that fill with Franschhoekers.",
    categorySlug: "restaurants",
    author: "Thabo Mokoena",
    publishedAt: "2026-05-21",
    readMinutes: 5,
    image: img("1517248135467-4c7edcad34c4"),
    body: [
      "The village's flagship restaurants earn their reputations, but locals know the real value sits a street or two back. Look for the places without a queue of rental cars outside — they're usually where the chefs and farmworkers eat on their day off.",
      "Lunch is the move for fine dining on a budget. Several of the celebrated kitchens run a two- or three-course set lunch at roughly half the dinner price, with the same kitchen and the same view. Book it and skip dinner.",
      "For an honest plate, follow the bakeries and delis at opening. Fresh sourdough, farm cheese and a flat white on a stoep beats any tourist trap, and you'll overhear exactly where to go next.",
    ],
    tips: [
      "Set lunches give you fine dining at half the dinner price.",
      "No rental cars outside usually means locals inside.",
      "Delis at opening time are the best-value breakfast in town.",
    ],
  },
  {
    id: "perfect-coffee-crawl",
    title: "The perfect Franschhoek coffee crawl",
    excerpt: "A walkable morning route through the village's best roasters and hidden corners.",
    categorySlug: "coffee",
    author: "Lena Fourie",
    publishedAt: "2026-05-14",
    readMinutes: 3,
    image: img("1495474472287-4d71bcdd2085"),
    body: [
      "Start at the top of the main road before 8am, when the roasters fire up and the village is still quiet. The first espresso of the day is always the one the barista is proudest of.",
      "Walk south and you'll pass three serious coffee spots within ten minutes of each other — enough for a proper crawl without ever needing the car. Order a cortado at each and you'll have tasted the full spectrum of local roasts by mid-morning.",
      "Finish with a filter coffee and a pastry on a shaded stoep. The locals treat this as a slow ritual, not a takeaway — pull up a chair, watch the village wake up, and you'll understand the pace of the place.",
    ],
    tips: [
      "Before 8am gets you the freshest pour and an empty counter.",
      "A cortado at each stop lets you taste more without the jitters.",
      "Sit in — the stoep ritual is half the point.",
    ],
  },
  {
    id: "choosing-where-to-stay",
    title: "Choosing where to stay: village vs. valley",
    excerpt: "The trade-offs between walking-distance charm and vineyard seclusion.",
    categorySlug: "hotels",
    author: "Daniël de Jongh",
    publishedAt: "2026-05-07",
    readMinutes: 4,
    image: img("1571896349842-33c89424de2d"),
    body: [
      "Staying in the village means everything is on foot — restaurants, tastings and the morning market are all minutes from your door, and you'll never worry about driving after a tasting. The trade-off is that you trade the big vineyard views for a more bustling, walkable charm.",
      "Out in the valley, the estate guesthouses give you silence, mountain views and your own slice of the winelands. You'll want a car, and you'll plan your days a little more deliberately, but waking up among the vines is a different kind of luxury.",
      "Our rule of thumb: first-time visitors should stay in or near the village for the ease; returning guests who know the lay of the land tend to drift out to the valley for the quiet. Either way, book well ahead for harvest season and the July festival.",
    ],
    tips: [
      "Village stays mean no driving after tastings.",
      "Valley guesthouses trade convenience for silence and views.",
      "Book months ahead for harvest and the July festival.",
    ],
  },
  {
    id: "local-art-scene",
    title: "Reading the local art scene like an insider",
    excerpt: "Galleries, studios and the quiet openings worth timing your visit around.",
    categorySlug: "art",
    author: "Sipho Ndlovu",
    publishedAt: "2026-04-30",
    readMinutes: 4,
    image: img("1577720580479-7d839d829c73"),
    body: [
      "Franschhoek punches well above its weight for art. The main road galleries are the obvious start, but the real finds are the working studios tucked behind the estates, where you can meet the artist and often buy direct.",
      "Time your visit around a First Thursday-style opening if you can — several galleries coordinate evening launches with a glass of wine, and it's the best way to see new work and meet the people behind it.",
      "Don't overlook the estate collections. A handful of wineries house serious sculpture gardens and rotating exhibitions that are free to wander with a tasting — ask at the cellar door which pieces are new.",
    ],
    tips: [
      "Working studios behind the estates let you buy direct.",
      "Evening gallery openings are the social heart of the scene.",
      "Several estates pair tastings with free sculpture gardens.",
    ],
  },
  {
    id: "outdoor-adventure-guide",
    title: "The valley on foot and by bike: an insider's outdoor guide",
    excerpt: "Trailheads, gentle rides and the viewpoints worth the early start.",
    categorySlug: "adventure",
    author: "Anja Brink",
    publishedAt: "2026-04-23",
    readMinutes: 5,
    image: img("1551632811-561732d1e306"),
    body: [
      "The mountains ringing Franschhoek hide some of the Cape's most rewarding short hikes. Start early — the valley heats up fast — and carry more water than you think you need. The trail up toward the old mountain pass rewards an hour's climb with a view down the entire valley.",
      "Cycling between the estates is the gentlest way to cover ground. Several spots hire e-bikes, which flatten the gradients and let you taste as you go without worrying about the drive home. Stick to the quieter back roads and you'll have the vineyards to yourself.",
      "For the big view without the big effort, the wine tram's hop-on hop-off loop doubles as a scenic tour. Pair it with a short walk at one of the stops and you get the postcard panorama and a leg-stretch in one outing.",
    ],
    tips: [
      "Hike at first light — the valley bakes by mid-morning.",
      "E-bikes let you taste between estates without driving.",
      "The wine tram is a low-effort way to bag the big views.",
    ],
  },
];

export function getKnowledgeById(id: string | undefined): KnowledgePost | undefined {
  return knowledgePosts.find((p) => p.id === id);
}

const dateFmt = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" });

export function formatPublished(iso: string) {
  return dateFmt.format(new Date(iso));
}
