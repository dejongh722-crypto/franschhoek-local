import { useNavigate } from "react-router-dom";
import { Megaphone, ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/home/SectionHeader";
import { isPromoLive, usePromotions } from "@/store/promotions";
import { useMembership } from "@/store/membership";
import { trackPromoClick } from "@/lib/promoMetrics";
import { followLink } from "@/lib/links";
import { imgFallback } from "@/lib/img";

/**
 * Permanent featured rail of live, audience-targeted promotions on Home.
 * Same data as the PromoPopup, but always visible (not dismissed). Hides itself
 * when there's nothing live to show.
 */
export function PromoCarousel() {
  const navigate = useNavigate();
  const { activePromotions } = usePromotions();
  const { isPremium } = useMembership();
  const tier = isPremium ? "premium" : "free";

  const promos = activePromotions.filter(
    (p) => isPromoLive(p) && (p.audience === "all" || p.audience === tier),
  );
  if (promos.length === 0) return null;

  const open = (promoId: string, link?: string) => {
    trackPromoClick(promoId);
    followLink(link, navigate);
  };

  return (
    <section>
      <SectionHeader title="Spotlight" />
      <div className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-5 px-5 pb-1">
        {promos.map((promo) => (
        <button
          key={promo.id}
          onClick={() => open(promo.id, promo.ctaLink)}
          className="group relative h-44 w-[280px] shrink-0 snap-start overflow-hidden rounded-3xl text-left shadow-md ring-1 ring-line transition-transform active:scale-[0.99]"
        >
          {promo.image ? (
            <img src={promo.image} alt="" onError={imgFallback(undefined, promo.id)} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-wine via-wine-soft to-wine-deep" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-cta px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
            <Megaphone className="h-3 w-3" strokeWidth={2.5} />
            Featured
          </span>

          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <h3 className="line-clamp-1 font-display text-lg font-semibold leading-tight">{promo.title}</h3>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-white/85">{promo.body}</p>
            {promo.ctaLabel && (
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cta">
                {promo.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
              </span>
            )}
          </div>
          </button>
        ))}
      </div>
    </section>
  );
}
