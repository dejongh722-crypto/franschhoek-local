import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarSearch } from "lucide-react";
import { SearchBar } from "@/components/home/SearchBar";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { EventListCard } from "@/components/events/EventListCard";
import { byDate } from "@/data/events";
import { useEvents } from "@/store/events";

export function Events() {
  const { events } = useEvents();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const setCategory = (slug: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("category", slug);
    else next.delete("category");
    setSearchParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events
      .filter((e) => (selectedCategory ? e.categorySlug === selectedCategory : true))
      .filter((e) =>
        q ? e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q) : true,
      )
      .sort(byDate);
  }, [events, selectedCategory, query]);

  return (
    <div className="pb-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-b-3xl px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(150deg, rgba(124,45,58,0.62) 0%, rgba(92,31,42,0.82) 100%), url('https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1000&q=70')",
          }}
        />
        <div className="relative">
          <h1 className="font-display text-3xl font-semibold">Events</h1>
          <p className="mt-1 text-sm text-white/80">What's happening around Franschhoek</p>
          <SearchBar
            className="mt-4 shadow-lg shadow-black/20"
            value={query}
            onChange={setQuery}
            showFilter={false}
          />
        </div>
      </header>

      {/* Category filter grid */}
      <div className="py-5">
        <CategoryGrid selectable selected={selectedCategory} onSelect={setCategory} />
      </div>

      {/* Results */}
      <div className="px-5">
        <p className="mb-3 text-xs font-medium text-muted">
          {filtered.length} {filtered.length === 1 ? "event" : "events"}
        </p>

        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((event) => (
              <EventListCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-wine/10 text-wine">
              <CalendarSearch className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-ink">No events found</h2>
            <p className="mt-1 max-w-xs text-sm text-muted">
              Try a different category or clear your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
