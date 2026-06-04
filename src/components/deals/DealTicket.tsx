import { useNavigate } from "react-router-dom";
import { MapPin, CalendarClock } from "lucide-react";
import { categoryBySlug } from "@/data/categories";
import { daysLeftLabel, daysUntil, type Deal } from "@/data/deals";
import { cn } from "@/lib/utils";

/** Voucher-style deal card with a perforated, tear-off discount stub. */
export function DealTicket({ deal }: { deal: Deal }) {
  const navigate = useNavigate();
  const cat = categoryBySlug[deal.categorySlug];
  const urgent = daysUntil(deal.validUntil) <= 3;

  return (
    <div
      onClick={() => navigate(`/deals/${deal.id}`)}
      className="relative flex h-28 cursor-pointer overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-line transition-transform active:scale-[0.99]"
    >
      <img src={deal.image} alt={deal.title} className="h-full w-24 shrink-0 object-cover" />

      <div className="flex min-w-0 flex-1 flex-col justify-center px-3">
        {cat && (
          <span className="text-[11px] font-semibold" style={{ color: cat.color }}>
            {cat.name}
          </span>
        )}
        <h3 className="line-clamp-1 font-display text-base font-semibold leading-snug text-ink">{deal.title}</h3>
        <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{deal.venue}</span>
        </span>
        <span
          className={cn(
            "mt-1 flex items-center gap-1 text-[11px] font-medium",
            urgent ? "text-red-500" : "text-muted",
          )}
        >
          <CalendarClock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {daysLeftLabel(deal.validUntil)}
        </span>
      </div>

      {/* Tear-off discount stub */}
      <div className="relative flex w-[76px] shrink-0 flex-col items-center justify-center bg-gradient-to-b from-cta to-cta-hover px-1 text-center text-white">
        {/* Perforation: notches at the seam + dashed line */}
        <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-sand" />
        <span className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-sand" />
        <span className="absolute bottom-2 left-0 top-2 border-l border-dashed border-white/50" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-white/80">Save</span>
        <span className="text-sm font-extrabold leading-tight">{deal.discount}</span>
      </div>
    </div>
  );
}
