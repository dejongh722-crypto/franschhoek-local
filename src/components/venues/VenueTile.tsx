import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { categoryBySlug, categoryImage } from "@/data/categories";
import { venueImage, type Venue } from "@/data/venues";

/** Compact vertical venue card for horizontal showcase rails (Explore page). */
export function VenueTile({ venue }: { venue: Venue }) {
  const navigate = useNavigate();
  const cat = categoryBySlug[venue.categorySlug];

  return (
    <button
      onClick={() => navigate(`/venues/${venue.id}`)}
      className="w-44 shrink-0 snap-start overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-black/5 transition-transform active:scale-[0.98]"
    >
      <div className="relative h-28">
        <img
          src={venueImage(venue)}
          alt={venue.name}
          onError={(e) => {
            const fb = categoryImage(venue.categorySlug, venue.id);
            if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="p-3">
        {cat && (
          <div className="text-[11px] font-semibold" style={{ color: cat.color }}>
            {cat.name}
          </div>
        )}
        <h3 className="mt-0.5 line-clamp-1 font-display text-sm font-semibold text-ink">{venue.name}</h3>
        {venue.address && (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
            <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
            <span className="line-clamp-1">{venue.address}</span>
          </p>
        )}
      </div>
    </button>
  );
}
