import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpenCheck, Clock, ArrowRight } from "lucide-react";
import { SearchBar } from "@/components/home/SearchBar";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { KnowledgeCard } from "@/components/knowledge/KnowledgeCard";
import { KnowledgeLocked } from "@/components/knowledge/KnowledgeLocked";
import { categoryBySlug } from "@/data/categories";
import { useKnowledge } from "@/store/knowledge";
import { useMembership } from "@/store/membership";

const FEATURED_ID = "where-locals-actually-eat";

export function Knowledge() {
  const { isPremium } = useMembership();
  const { posts: knowledgePosts } = useKnowledge();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const [query, setQuery] = useState("");

  const setCategory = (slug: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("category", slug);
    else next.delete("category");
    setSearchParams(next, { replace: true });
  };

  const featured = knowledgePosts.find((p) => p.id === FEATURED_ID) ?? knowledgePosts[0];
  const isDefaultView = !selectedCategory && !query.trim();
  const featuredCat = featured ? categoryBySlug[featured.categorySlug] : undefined;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return knowledgePosts
      .filter((p) => (selectedCategory ? p.categorySlug === selectedCategory : true))
      .filter((p) =>
        q ? p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) : true,
      )
      .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  }, [knowledgePosts, selectedCategory, query]);

  return (
    <div className="pb-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-b-3xl px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(150deg, rgba(124,45,58,0.62) 0%, rgba(92,31,42,0.82) 100%), url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1000&q=70')",
          }}
        />
        <div className="relative">
          <h1 className="font-display text-3xl font-semibold">Local Knowledge</h1>
          <p className="mt-1 text-sm text-white/80">Insider guides from people who live here</p>
          {isPremium && (
            <SearchBar
              className="mt-4 shadow-lg shadow-black/20"
              value={query}
              onChange={setQuery}
              placeholder="Search guides…"
              showFilter={false}
            />
          )}
        </div>
      </header>

      {!isPremium ? (
        <KnowledgeLocked />
      ) : (
        <>
          {/* Featured guide */}
          {isDefaultView && featured && (
            <section className="px-5 pt-5">
              <article
                onClick={() => navigate(`/knowledge/${featured.id}`)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl shadow-md transition-transform active:scale-[0.99]"
              >
                <img src={featured.image} alt={featured.title} className="h-56 w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  {featuredCat && (
                    <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
                      {featuredCat.name}
                    </span>
                  )}
                  <h2 className="mt-2 font-display text-2xl font-semibold leading-tight">
                    {featured.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 max-w-md text-sm text-white/85">{featured.excerpt}</p>
                  <div className="mt-2.5 flex items-center gap-2 text-[11px] text-white/75">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {featured.readMinutes} min read
                    </span>
                    <span className="h-1 w-1 rounded-full bg-white/40" />
                    <span>{featured.author}</span>
                    <ArrowRight
                      className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </div>
                </div>
              </article>
            </section>
          )}

          {/* Category filter grid */}
          <div className="py-5">
            <CategoryGrid selectable selected={selectedCategory} onSelect={setCategory} />
          </div>

          {/* Guides list (newest first) */}
          <div className="px-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">
                {selectedCategory || query ? "Results" : "Latest guides"}
              </h2>
              <span className="text-xs font-medium text-muted">
                {filtered.length} {filtered.length === 1 ? "guide" : "guides"}
              </span>
            </div>

            {filtered.length > 0 ? (
              <div className="space-y-3">
                {filtered.map((post) => (
                  <KnowledgeCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-wine/10 text-wine">
                  <BookOpenCheck className="h-7 w-7" strokeWidth={1.75} />
                </span>
                <h2 className="mt-4 font-display text-xl font-semibold text-ink">No guides found</h2>
                <p className="mt-1 max-w-xs text-sm text-muted">
                  Try a different category or clear your search.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
