import { useNavigate } from "react-router-dom";
import { MapPin, Crown } from "lucide-react";
import { categoryBySlug, categoryImage } from "@/data/categories";
import { dateBadge, formatEventDate, formatEventTime, type AppEvent } from "@/data/events";

export function EventCard({ event }: { event: AppEvent }) {
  const navigate = useNavigate();
  const cat = categoryBySlug[event.categorySlug];
  const badge = dateBadge(event.date);
  const Icon = cat?.icon;

  return (
    <button
      onClick={() => navigate(`/events/${event.id}`)}
      className="w-60 shrink-0 snap-start overflow-hidden rounded-2xl bg-card text-left shadow-sm ring-1 ring-black/5 transition-transform active:scale-[0.98]"
    >
      <div className="relative h-32">
        <img
          src={event.image}
          alt={event.title}
          onError={(e) => {
            const fb = categoryImage(event.categorySlug, event.id);
            if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute left-3 top-3 rounded-xl bg-white/90 px-2.5 py-1 text-center shadow-sm backdrop-blur">
          <div className="text-[10px] font-bold leading-none text-wine">{badge.month}</div>
          <div className="text-sm font-bold leading-tight text-ink">{badge.day}</div>
        </div>
        {event.isPremium && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-wine/90 px-2 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur">
            <Crown className="h-3 w-3" strokeWidth={2} />
            Premium
          </span>
        )}
      </div>
      <div className="p-3.5">
        {cat && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: cat.color }}>
            {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2} />}
            {cat.name}
          </div>
        )}
        <h3 className="mt-1 line-clamp-1 font-semibold text-ink">{event.title}</h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{event.venue}</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5">
          <span className="text-[11px] text-muted">
            {formatEventDate(event.date)} · {formatEventTime(event.date)}
          </span>
          <span className="text-sm font-bold text-wine">{event.price}</span>
        </div>
      </div>
    </button>
  );
}
