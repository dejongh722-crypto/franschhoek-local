import { useNavigate } from "react-router-dom";
import { Hero } from "@/components/home/Hero";
import { SectionHeader } from "@/components/home/SectionHeader";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { EventCard } from "@/components/home/EventCard";
import { EventRow } from "@/components/home/EventRow";
import { PremiumBanner } from "@/components/home/PremiumBanner";
import { PromoCarousel } from "@/components/home/PromoCarousel";
import { KnowledgeCard } from "@/components/knowledge/KnowledgeCard";
import { VenueCard } from "@/components/venues/VenueCard";
import { useEvents } from "@/store/events";
import { useVenues } from "@/store/venues";
import { knowledgePosts } from "@/data/knowledge";

export function Home() {
  const navigate = useNavigate();
  const { featured, upcoming } = useEvents();
  const { venues } = useVenues();

  return (
    <div className="pb-6">
      <Hero />

      <div className="mt-8 space-y-9">
        {/* Featured promotions / adverts (renders nothing when none are live) */}
        <PromoCarousel />

        {/* Categories */}
        <section>
          <SectionHeader title="Browse by category" />
          <div className="mt-4">
            <CategoryGrid />
          </div>
        </section>

        {/* Local spots (real venues from the scraper) */}
        {venues.length > 0 && (
          <section>
            <SectionHeader title="Local spots" action="See all" onAction={() => navigate("/venues")} />
            <div className="mt-4 space-y-3 px-5">
              {venues.slice(0, 3).map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          </section>
        )}

        {/* Featured events */}
        <section>
          <SectionHeader title="Featured this week" action="See all" onAction={() => navigate("/events")} />
          <div className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-5 px-5 pb-1">
            {featured.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>

        {/* Premium upsell */}
        <section className="px-5">
          <PremiumBanner />
        </section>

        {/* Local knowledge */}
        <section>
          <SectionHeader
            title="Local knowledge"
            action="See all"
            onAction={() => navigate("/knowledge")}
          />
          <div className="mt-4 space-y-3 px-5">
            {knowledgePosts.slice(0, 2).map((post) => (
              <KnowledgeCard key={post.id} post={post} />
            ))}
          </div>
        </section>

        {/* Happening soon */}
        <section>
          <SectionHeader title="Happening soon" action="See all" onAction={() => navigate("/events")} />
          <div className="mt-4 space-y-3 px-5">
            {upcoming.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
