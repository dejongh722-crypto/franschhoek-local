import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TicketX } from "lucide-react";
import { SearchBar } from "@/components/home/SearchBar";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { DealTicket } from "@/components/deals/DealTicket";
import { DealsFeatured } from "@/components/deals/DealsFeatured";
import { DealsLocked } from "@/components/deals/DealsLocked";
import { daysUntil } from "@/data/deals";
import { useDeals } from "@/store/deals";
import { useMembership } from "@/store/membership";

const FEATURED_ID = "spa-30-off";

export function Deals() {
  const { deals } = useDeals();
  const { isPremium } = useMembership();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const [query, setQuery] = useState("");

  const setCategory = (slug: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("category", slug);
    else next.delete("category");
    setSearchParams(next, { replace: true });
  };

  const featured = deals.find((d) => d.id === FEATURED_ID) ?? deals[0];
  const isDefaultView = !selectedCategory && !query.trim();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deals
      .filter((d) => (selectedCategory ? d.categorySlug === selectedCategory : true))
      .filter((d) => (q ? d.title.toLowerCase().includes(q) || d.venue.toLowerCase().includes(q) : true))
      .sort((a, b) => daysUntil(a.validUntil) - daysUntil(b.validUntil));
  }, [deals, selectedCategory, query]);

  return (
    <div className="pb-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-b-3xl px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(150deg, rgba(124,45,58,0.62) 0%, rgba(92,31,42,0.82) 100%), url('https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1000&q=70')",
          }}
        />
        <div className="relative">
          <h1 className="font-display text-3xl font-semibold">Local Deals</h1>
          <p className="mt-1 text-sm text-white/80">Exclusive offers from Franschhoek businesses</p>
          {isPremium && (
            <SearchBar
              className="mt-4 shadow-lg shadow-black/20"
              value={query}
              onChange={setQuery}
              placeholder="Search deals…"
              showFilter={false}
            />
          )}
        </div>
      </header>

      {!isPremium ? (
        <DealsLocked />
      ) : (
        <>
          {/* Deal of the week */}
          {isDefaultView && featured && (
            <section className="px-5 pt-5">
              <DealsFeatured deal={featured} />
            </section>
          )}

          {/* Category filter grid */}
          <div className="py-5">
            <CategoryGrid selectable selected={selectedCategory} onSelect={setCategory} />
          </div>

          {/* Deals list (soonest-ending first) */}
          <div className="px-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">
                {selectedCategory || query ? "Results" : "Latest offers"}
              </h2>
              <span className="text-xs font-medium text-muted">
                {filtered.length} {filtered.length === 1 ? "deal" : "deals"}
              </span>
            </div>

            {filtered.length > 0 ? (
              <div className="space-y-3">
                {filtered.map((deal) => (
                  <DealTicket key={deal.id} deal={deal} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-wine/10 text-wine">
                  <TicketX className="h-7 w-7" strokeWidth={1.75} />
                </span>
                <h2 className="mt-4 font-display text-xl font-semibold text-ink">No deals found</h2>
                <p className="mt-1 max-w-xs text-sm text-muted">Try a different category or clear your search.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
