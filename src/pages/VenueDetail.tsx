import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Share2, MapPin, Navigation, Globe, Phone, Star } from "lucide-react";
import { categoryBySlug } from "@/data/categories";
import { venueImage, type Review } from "@/data/venues";
import { imgFallback } from "@/lib/img";
import { useVenues } from "@/store/venues";
import { useToast } from "@/store/toast";
import { share } from "@/lib/share";
import { StarRating } from "@/components/StarRating";
import { initials } from "@/data/chat";

export function VenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getVenueById } = useVenues();
  const venue = getVenueById(id);
  const toast = useToast();

  if (!venue) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Place not found</h1>
        <p className="mt-2 text-sm text-muted">This spot may have been removed.</p>
        <button
          onClick={() => navigate("/venues")}
          className="mt-6 rounded-full bg-wine px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to places
        </button>
      </div>
    );
  }

  const cat = categoryBySlug[venue.categorySlug];
  const Icon = cat?.icon;

  const openDirections = () => {
    const q = encodeURIComponent(venue.address || `${venue.name}, Franschhoek, South Africa`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank", "noopener");
  };
  const openWebsite = () => {
    if (venue.website) window.open(venue.website, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="pb-12">
      {/* Image header */}
      <div className="relative h-64">
        <img
          src={venueImage(venue)}
          alt={venue.name}
          onError={imgFallback(venue.categorySlug, venue.id)}
          className="absolute inset-0 h-full w-full object-cover"
        />
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
              const r = await share({ title: venue.name, text: `${venue.name} — on Franschhoek Local` });
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
        <h1 className="mt-1.5 font-display text-3xl font-semibold leading-tight text-ink">{venue.name}</h1>

        {venue.rating && (
          <div className="mt-2">
            <StarRating rating={venue.rating} count={venue.ratingCount} size="md" />
          </div>
        )}

        {venue.address && (
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card text-wine shadow-sm ring-1 ring-line">
              <MapPin className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 text-sm font-medium text-ink">{venue.address}</div>
          </div>
        )}

        {venue.description && (
          <>
            <h2 className="mt-7 font-display text-lg font-semibold text-ink">About</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{venue.description}</p>
          </>
        )}

        {/* Reviews — real Google data */}
        {venue.reviews && venue.reviews.length > 0 && (
          <section className="mt-7">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Reviews</h2>
              {venue.rating && (
                <span className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-cta" strokeWidth={1.75} fill="currentColor" />
                  <span className="font-semibold text-ink">{venue.rating.toFixed(1)}</span>
                  {venue.ratingCount ? (
                    <span className="text-muted">· {venue.ratingCount.toLocaleString()} reviews</span>
                  ) : null}
                </span>
              )}
            </div>
            <div className="mt-3 space-y-3">
              {venue.reviews.map((r, i) => (
                <ReviewItem key={i} review={r} />
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted">Ratings &amp; reviews from Google</p>
          </section>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button
            onClick={openDirections}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-wine py-3.5 text-sm font-semibold text-white transition-colors hover:bg-wine-soft"
          >
            <Navigation className="h-4 w-4" strokeWidth={2} />
            Get directions
          </button>
          {venue.website && (
            <button
              onClick={openWebsite}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-card py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/[0.04]"
            >
              <Globe className="h-4 w-4 text-wine" strokeWidth={2} />
              Visit website
            </button>
          )}
          {venue.phone && (
            <a
              href={`tel:${venue.phone}`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-card py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/[0.04]"
            >
              <Phone className="h-4 w-4 text-wine" strokeWidth={2} />
              {venue.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/** A single Google review. Author, text and time are shown unmodified. */
function ReviewItem({ review }: { review: Review }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line">
      <div className="flex items-center gap-3">
        {review.profilePhoto ? (
          <img src={review.profilePhoto} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-wine/10 text-xs font-bold text-wine">
            {initials(review.author)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{review.author}</p>
          <div className="flex items-center gap-2">
            <StarRating rating={review.rating} />
            <span className="text-[11px] text-muted">{review.relativeTime}</span>
          </div>
        </div>
      </div>
      {review.text && (
        <p className="mt-2.5 text-sm leading-relaxed text-muted">{review.text}</p>
      )}
    </div>
  );
}
