import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Share2, Clock, Lightbulb, Lock, Crown } from "lucide-react";
import { categoryBySlug } from "@/data/categories";
import { formatPublished, getKnowledgeById } from "@/data/knowledge";
import { useMembership } from "@/store/membership";
import { useToast } from "@/store/toast";
import { share } from "@/lib/share";

export function KnowledgeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const post = getKnowledgeById(id);
  const { isPremium } = useMembership();
  const toast = useToast();

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Guide not found</h1>
        <p className="mt-2 text-sm text-muted">This guide may have been moved or removed.</p>
        <button
          onClick={() => navigate("/knowledge")}
          className="mt-6 rounded-full bg-wine px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to guides
        </button>
      </div>
    );
  }

  const cat = categoryBySlug[post.categorySlug];
  const Icon = cat?.icon;

  return (
    <div className="pb-12">
      {/* Image header */}
      <div className="relative h-64">
        <img src={post.image} alt={post.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />

        <div className="relative flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
          <button
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <button
            aria-label="Share"
            onClick={async () => {
              const r = await share({
                title: post.title,
                text: `${post.title} — insider guide on Franschhoek Local`,
              });
              if (r === "copied") toast("Link copied");
              else if (r === "failed") toast("Couldn't share");
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/30"
          >
            <Share2 className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Content card */}
      <div className="relative -mt-5 rounded-t-3xl bg-sand px-5 pt-6">
        {cat && (
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: cat.color }}>
            {Icon && <Icon className="h-4 w-4" strokeWidth={2} />}
            {cat.name}
          </div>
        )}
        <h1 className="mt-1.5 font-display text-3xl font-semibold leading-tight text-ink">{post.title}</h1>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          <span className="font-medium text-ink">{post.author}</span>
          <span className="h-1 w-1 rounded-full bg-muted/40" />
          <span>{formatPublished(post.publishedAt)}</span>
          <span className="h-1 w-1 rounded-full bg-muted/40" />
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
            {post.readMinutes} min read
          </span>
        </div>

        {isPremium ? (
          <>
            {/* Article body */}
            <div className="mt-6 space-y-4">
              {post.body.map((para, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-ink/90">
                  {para}
                </p>
              ))}
            </div>

            {/* Insider tips */}
            {post.tips && post.tips.length > 0 && (
              <div className="mt-7 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="flex items-center gap-2 text-wine">
                  <Lightbulb className="h-4 w-4" strokeWidth={2} />
                  <h2 className="font-display text-base font-semibold">Insider tips</h2>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {post.tips.map((tip) => (
                    <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-ink/90">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cta" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          /* Premium gate — show the intro paragraph, then upsell */
          <div className="mt-6">
            <p className="text-[15px] leading-relaxed text-ink/90">{post.body[0]}</p>

            <div className="relative mt-4">
              {/* Faded teaser of the rest */}
              <p
                className="pointer-events-none select-none text-[15px] leading-relaxed text-ink/40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
                aria-hidden
              >
                {post.body[1] ?? post.excerpt}
              </p>

              <div className="mt-3 rounded-2xl bg-gradient-to-br from-wine to-wine-deep p-5 text-white">
                <div className="flex items-center gap-2 text-cta">
                  <Crown className="h-4 w-4" strokeWidth={2} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Premium</span>
                </div>
                <p className="mt-1.5 flex items-start gap-2 text-sm text-white/85">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                  Upgrade to Premium to read the full guide and unlock every insider tip.
                </p>
                <button
                  onClick={() => navigate("/membership")}
                  className="mt-3 w-full rounded-full bg-cta py-3 text-sm font-semibold text-white transition-colors hover:bg-cta-hover"
                >
                  Go Premium
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
