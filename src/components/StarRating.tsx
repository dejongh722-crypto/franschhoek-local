import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** 1–5 rating. */
  rating: number;
  /** Total number of reviews (shown in parentheses when provided). */
  count?: number;
  /** "sm" for cards, "md" for the venue detail header. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Real star rating display (Google data). Renders five stars with a partial
 * fill on the fractional star, the numeric rating, and an optional review
 * count. Returns nothing when there's no rating yet, so cards stay clean until
 * `npm run ratings` has populated the data.
 */
export function StarRating({ rating, count, size = "sm", className }: Props) {
  if (!rating) return null;

  const star = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const text = size === "sm" ? "text-[11px]" : "text-sm";
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));

  return (
    <span className={cn("flex items-center gap-1", text, className)}>
      {/* Star track: muted outlines with an amber fill clipped to the rating. */}
      <span className="relative inline-flex">
        <span className="flex">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className={cn(star, "text-line")} strokeWidth={1.75} fill="currentColor" />
          ))}
        </span>
        <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
          <span className="flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className={cn(star, "text-cta")} strokeWidth={1.75} fill="currentColor" />
            ))}
          </span>
        </span>
      </span>
      <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
      {count != null && count > 0 && (
        <span className="text-muted">({count.toLocaleString()})</span>
      )}
    </span>
  );
}
