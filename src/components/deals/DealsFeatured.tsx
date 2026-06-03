import { useNavigate } from "react-router-dom";
import { Flame, MapPin } from "lucide-react";
import type { Deal } from "@/data/deals";

/** Large hero "Deal of the week" card. */
export function DealsFeatured({ deal }: { deal: Deal }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/deals/${deal.id}`)}
      className="relative block h-44 w-full overflow-hidden rounded-3xl text-left shadow-md transition-transform active:scale-[0.99]"
    >
      <img src={deal.image} alt={deal.title} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

      <span className="absolute right-4 top-4 rounded-xl bg-cta px-3 py-1.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-md">
        {deal.discount}
      </span>

      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cta">
          <Flame className="h-3.5 w-3.5" strokeWidth={2.5} />
          Deal of the week
        </span>
        <h3 className="mt-1 font-display text-2xl font-semibold leading-tight">{deal.title}</h3>
        <span className="mt-1 flex items-center gap-1 text-xs text-white/80">
          <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
          {deal.venue}
        </span>
      </div>
    </button>
  );
}
