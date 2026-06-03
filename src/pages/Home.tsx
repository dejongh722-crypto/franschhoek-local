import { useNavigate } from "react-router-dom";
import { Crown, Lock } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { SectionHeader } from "@/components/home/SectionHeader";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { EventCard } from "@/components/home/EventCard";
import { EventRow } from "@/components/home/EventRow";
import { PremiumBanner } from "@/components/home/PremiumBanner";
import { PromoCarousel } from "@/components/home/PromoCarousel";
import { KnowledgeCard } from "@/components/knowledge/KnowledgeCard";
import { useEvents } from "@/store/events";
import { useKnowledge } from "@/store/knowledge";
import { useMembership } from "@/store/membership";

export function Home() {
  const navigate = useNavigate();
  const { featured, upcoming } = useEvents();
  const { posts: knowledgePosts } = useKnowledge();
  const { isPremium } = useMembership();

  return (
    <div className="pb-6">
      <Hero />

      <div className="mt-8 space-y-9">
        {/* Featured promotions / adverts (renders nothing when none are live) */}
        <PromoCarousel />

        {/* Categories — tap through to Explore */}
        <section>
          <SectionHeader title="Explore Franschhoek" action="See all" onAction={() => navigate("/explore")} />
          <div className="mt-4">
            <CategoryGrid />
          </div>
        </section>

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

        {/* Happening soon — premium only */}
        <section>
          <SectionHeader
            title="Happening soon"
            action={isPremium ? "See all" : undefined}
            onAction={isPremium ? () => navigate("/events") : undefined}
          />
          {isPremium ? (
            <div className="mt-4 space-y-3 px-5">
              {upcoming.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="relative mt-4 px-5">
              {/* Blurred teaser behind the premium gate */}
              <div className="pointer-events-none min-h-[140px] select-none space-y-3 opacity-60 blur-[3px]" aria-hidden>
                {upcoming.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
              <div className="absolute inset-0 grid place-items-center px-5">
                <div className="w-full max-w-xs rounded-2xl bg-white/95 p-5 text-center shadow-lg ring-1 ring-black/5 backdrop-blur">
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-wine/10 text-wine">
                    <Lock className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-cta">
                    <Crown className="h-3.5 w-3.5" strokeWidth={2} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Premium</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-ink">See what's happening soon</p>
                  <button
                    onClick={() => navigate("/membership")}
                    className="mt-3 w-full rounded-full bg-cta py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-cta-hover active:scale-[0.99]"
                  >
                    Go Premium
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
