import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronRight } from "lucide-react";
import { categoryBySlug, categoryImage } from "@/data/categories";
import { formatEventDate, formatEventTime, type AppEvent } from "@/data/events";

export function EventRow({ event }: { event: AppEvent }) {
  const navigate = useNavigate();
  const cat = categoryBySlug[event.categorySlug];

  return (
    <button
      onClick={() => navigate(`/events/${event.id}`)}
      className="flex w-full items-center gap-3 rounded-2xl bg-white p-2.5 text-left shadow-sm ring-1 ring-black/5 transition-transform active:scale-[0.99]"
    >
      <img
        src={event.image}
        alt={event.title}
        onError={(e) => {
          const fb = categoryImage(event.categorySlug, event.id);
          if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
        }}
        className="h-16 w-16 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        {cat && (
          <div className="text-[11px] font-semibold" style={{ color: cat.color }}>
            {cat.name}
          </div>
        )}
        <h3 className="truncate font-semibold text-ink">{event.title}</h3>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {formatEventDate(event.date)} · {formatEventTime(event.date)}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} />
    </button>
  );
}
