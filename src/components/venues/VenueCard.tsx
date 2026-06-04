import { useNavigate } from "react-router-dom";
import { MapPin, ChevronRight } from "lucide-react";
import { categoryBySlug, categoryImage } from "@/data/categories";
import { venueImage, type Venue } from "@/data/venues";
import { StarRating } from "@/components/StarRating";

export function VenueCard({ venue }: { venue: Venue }) {
  const navigate = useNavigate();
  const cat = categoryBySlug[venue.categorySlug];

  return (
    <button
      onClick={() => navigate(`/venues/${venue.id}`)}
      className="group flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-card p-2.5 text-left shadow-sm ring-1 ring-line transition-transform active:scale-[0.99]"
    >
      <img
        src={venueImage(venue)}
        alt={venue.name}
        onError={(e) => {
          const fb = categoryImage(venue.categorySlug, venue.id);
          if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
        }}
        className="h-20 w-20 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        {cat && (
          <span className="text-[11px] font-semibold" style={{ color: cat.color }}>
            {cat.name}
          </span>
        )}
        <h3 className="line-clamp-1 font-display text-base font-semibold leading-snug text-ink">{venue.name}</h3>
        {venue.rating ? (
          <StarRating rating={venue.rating} count={venue.ratingCount} className="mt-0.5" />
        ) : (
          venue.description && <p className="line-clamp-1 text-xs text-muted">{venue.description}</p>
        )}
        {venue.address && (
          <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted">
            <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{venue.address}</span>
          </span>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
    </button>
  );
}
