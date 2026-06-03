import { useNavigate } from "react-router-dom";
import { MapPin, Crown, Heart, Clock, MessagesSquare } from "lucide-react";
import { categoryBySlug, categoryImage } from "@/data/categories";
import { dateBadge, formatEventDate, formatEventTime, type AppEvent } from "@/data/events";
import { useUserEvents } from "@/store/userEvents";
import { useToast } from "@/store/toast";
import { cn } from "@/lib/utils";

export function EventListCard({ event }: { event: AppEvent }) {
  const navigate = useNavigate();
  const { isSaved, toggleSaved } = useUserEvents();
  const toast = useToast();
  const cat = categoryBySlug[event.categorySlug];
  const badge = dateBadge(event.date);
  const Icon = cat?.icon;
  const saved = isSaved(event.id);

  return (
    <div
      onClick={() => navigate(`/events/${event.id}`)}
      className="cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform active:scale-[0.99]"
    >
      <div className="relative h-40">
        <img
          src={event.image}
          alt={event.title}
          onError={(e) => {
            const fb = categoryImage(event.categorySlug, event.id);
            if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

        <div className="absolute left-3 top-3 rounded-xl bg-white/90 px-2.5 py-1 text-center shadow-sm backdrop-blur">
          <div className="text-[10px] font-bold leading-none text-wine">{badge.month}</div>
          <div className="text-base font-bold leading-tight text-ink">{badge.day}</div>
        </div>

        <button
          aria-label={saved ? "Remove from saved" : "Save event"}
          onClick={(e) => {
            e.stopPropagation();
            toggleSaved(event.id);
            toast(saved ? "Removed from saved" : "Saved to To Attend");
          }}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-wine shadow-sm backdrop-blur transition-transform active:scale-90"
        >
          <Heart className={cn("h-[18px] w-[18px]", saved && "fill-wine")} strokeWidth={2} />
        </button>

        {event.isPremium && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-wine/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur">
            <Crown className="h-3 w-3" strokeWidth={2} />
            Premium
          </span>
        )}
        {event.hasChat && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-wine shadow-sm backdrop-blur">
            <MessagesSquare className="h-3 w-3" strokeWidth={2} />
            Chat
          </span>
        )}
      </div>

      <div className="p-4">
        {cat && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: cat.color }}>
            {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2} />}
            {cat.name}
          </div>
        )}
        <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-ink">{event.title}</h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
            {event.venue}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
            {formatEventDate(event.date)} · {formatEventTime(event.date)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span className="text-sm font-bold text-wine">{event.price}</span>
          <span className="text-xs font-semibold text-cta">View details →</span>
        </div>
      </div>
    </div>
  );
}
