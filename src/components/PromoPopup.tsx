import { useNavigate } from "react-router-dom";
import { X, Megaphone } from "lucide-react";
import { isPromoLive, usePromotions } from "@/store/promotions";
import { useMembership } from "@/store/membership";
import { trackPromoClick } from "@/lib/promoMetrics";
import { followLink } from "@/lib/links";

/** Shows the newest live promotion the user hasn't dismissed, as a pop-up. */
export function PromoPopup() {
  const navigate = useNavigate();
  const { activePromotions, isDismissed, dismiss } = usePromotions();
  const { isPremium } = useMembership();

  const tier = isPremium ? "premium" : "free";
  const promo = activePromotions.find(
    (p) => !isDismissed(p.id) && isPromoLive(p) && (p.audience === "all" || p.audience === tier),
  );
  if (!promo) return null;

  const close = () => dismiss(promo.id);
  const act = () => {
    trackPromoClick(promo.id);
    dismiss(promo.id);
    followLink(promo.ctaLink, navigate);
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-end bg-black/40 p-4 backdrop-blur-sm sm:place-items-center">
      <div className="animate-rise w-full max-w-sm overflow-hidden rounded-3xl bg-card shadow-2xl">
        <div className="relative">
          {promo.image ? (
            <img src={promo.image} alt="" className="h-36 w-full object-cover" />
          ) : (
            <div className="grid h-24 w-full place-items-center bg-gradient-to-br from-wine to-wine-deep text-white">
              <Megaphone className="h-8 w-8" strokeWidth={1.75} />
            </div>
          )}
          <button
            aria-label="Dismiss"
            onClick={close}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="p-5 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">{promo.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{promo.body}</p>

          <button
            onClick={act}
            className="mt-5 w-full rounded-full bg-cta py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-cta-hover active:scale-[0.99]"
          >
            {promo.ctaLabel || "Got it"}
          </button>
          <button
            onClick={close}
            className="mt-2 w-full py-2 text-xs font-semibold text-muted transition-colors hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
