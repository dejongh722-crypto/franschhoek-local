import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PartyPopper, Crown } from "lucide-react";
import { SectionHeader } from "@/components/home/SectionHeader";
import { VenueTile } from "@/components/venues/VenueTile";
import { EventCard } from "@/components/home/EventCard";
import { categories } from "@/data/categories";
import { byDate, isUpcoming } from "@/data/events";
import { useVenues } from "@/store/venues";
import { useEvents } from "@/store/events";
import { useMembership } from "@/store/membership";

/** A horizontal, snapping rail used for every showcase row. */
function Rail({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-5 px-5 pb-1">
      {children}
    </div>
  );
}

export function Explore() {
  const navigate = useNavigate();
  const { venues } = useVenues();
  const { events } = useEvents();
  const { isPremium } = useMembership();

  const byCategory = useMemo(() => {
    const map: Record<string, typeof venues> = {};
    for (const v of venues) (map[v.categorySlug] ??= []).push(v);
    return map;
  }, [venues]);

  const festivals = useMemo(
    () => events.filter((e) => isUpcoming(e.date)).sort(byDate),
    [events],
  );

  return (
    <div className="pb-6">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-b-3xl px-5 pb-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(150deg, rgba(124,45,58,0.62) 0%, rgba(92,31,42,0.86) 100%), url('https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?auto=format&fit=crop&w=1000&q=70')",
          }}
        />
        <div className="relative">
          <h1 className="font-display text-3xl font-semibold">Explore Franschhoek</h1>
          <p className="mt-1 text-sm text-white/80">
            Wineries, restaurants, coffee, stays, art, adventure &amp; festivals
          </p>
        </div>
      </header>

      <div className="mt-7 space-y-8">
        {/* One showcase rail per category that has places */}
        {categories.map((cat) => {
          const list = byCategory[cat.slug];
          if (!list || list.length === 0) return null;
          return (
            <section key={cat.slug}>
              <SectionHeader
                title={cat.name}
                action="See all"
                onAction={() => navigate(`/venues?category=${cat.slug}`)}
              />
              <Rail>
                {list.slice(0, 10).map((venue) => (
                  <VenueTile key={venue.id} venue={venue} />
                ))}
              </Rail>
            </section>
          );
        })}

        {/* Festivals & markets (upcoming events) — premium only */}
        {festivals.length > 0 && (
          <section>
            <SectionHeader
              title="Festivals & Markets"
              action={isPremium ? "See all" : undefined}
              onAction={isPremium ? () => navigate("/events") : undefined}
            />
            {isPremium ? (
              <Rail>
                {festivals.slice(0, 10).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </Rail>
            ) : (
              <div className="relative mt-3">
                <div className="no-scrollbar pointer-events-none flex select-none gap-3 overflow-hidden px-5 pb-1 opacity-60 blur-[3px]" aria-hidden>
                  {festivals.slice(0, 10).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
                <div className="absolute inset-0 grid place-items-center">
                  <button
                    onClick={() => navigate("/membership")}
                    className="flex items-center gap-2 rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-cta-hover active:scale-[0.99]"
                  >
                    <Crown className="h-4 w-4" strokeWidth={2} />
                    Go Premium for events
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Empty state — nothing loaded yet */}
        {venues.length === 0 && festivals.length === 0 && (
          <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-wine/10 text-wine">
              <PartyPopper className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-ink">Nothing here yet</h2>
            <p className="mt-1 max-w-xs text-sm text-muted">
              Places and festivals will appear here as they're added.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
